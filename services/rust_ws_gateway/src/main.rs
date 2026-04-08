use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, Query, State},
    response::IntoResponse,
    routing::get,
    Router,
};
use dashmap::DashMap;
use futures::{sink::SinkExt, stream::StreamExt};
use rdkafka::{
    consumer::{Consumer, StreamConsumer},
    producer::{FutureProducer, FutureRecord},
    ClientConfig, Message as KafkaMessage,
};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, time::Duration};
use tokio::sync::mpsc;

// 1. ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU
#[derive(Deserialize)]
struct ConnectionQuery {
    user_id: String, // Lấy user_id từ URL (VD: ws://localhost:8080/ws?user_id=123)
}

#[derive(Serialize, Deserialize, Debug)]
struct KafkaPayload {
    user_id: String,
    content: String,
}

// 2. QUẢN LÝ TRẠNG THÁI (Lưu trữ các kết nối đang mở)
// Map lưu user_id -> Kênh gửi tin nhắn (Sender)
type AppState = Arc<DashMap<String, mpsc::Sender<String>>>;

#[tokio::main]
async fn main() {
    let state: AppState = Arc::new(DashMap::new());

    // Khởi tạo Kafka Producer (Dùng để bắn tin lên Kafka)
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .set("message.timeout.ms", "5000")
        .create()
        .expect("Lỗi tạo Kafka Producer");

    // Khởi tạo Kafka Consumer (Dùng để nghe tin từ Node.js/Java trả về)
    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", "rust-gateway-group")
        .set("bootstrap.servers", "localhost:9092")
        .set("auto.offset.reset", "latest")
        .create()
        .expect("Lỗi tạo Kafka Consumer");

    consumer.subscribe(&["to-client"]).expect("Không thể subscribe topic");

    // LUỒNG CHẠY NGẦM: Lắng nghe Kafka và đẩy về cho người dùng
    let state_clone = state.clone();
    tokio::spawn(async move {
        println!("🎧 Đang lắng nghe Kafka topic 'to-client'...");
        loop {
            match consumer.recv().await {
                Ok(msg) => {
                    if let Some(payload_bytes) = msg.payload() {
                        if let Ok(json_str) = std::str::from_utf8(payload_bytes) {
                            // Phân tích JSON để biết cần gửi cho user_id nào
                            if let Ok(parsed) = serde_json::from_str::<KafkaPayload>(json_str) {
                                // Tìm trong RAM xem user này có đang kết nối không
                                if let Some(sender) = state_clone.get(&parsed.user_id) {
                                    // Bắn qua kênh mpsc, WebSocket sẽ nhận được và đẩy cho client
                                    let _ = sender.send(parsed.content).await;
                                }
                            }
                        }
                    }
                }
                Err(e) => println!("Lỗi đọc Kafka: {:?}", e),
            }
        }
    });

    // 3. KHỞI TẠO SERVER WEB
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state((state, Arc::new(producer)));

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("🚀 Rust WebSocket Gateway chạy tại ws://{}/ws?user_id=YOUR_ID", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// 4. XỬ LÝ NÂNG CẤP KẾT NỐI (Handshake)
async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<ConnectionQuery>,
    State((state, producer)): State<(AppState, Arc<FutureProducer>)>,
) -> impl IntoResponse {
    // Chấp nhận kết nối và chuyển vào hàm xử lý logic
    ws.on_upgrade(move |socket| handle_socket(socket, query.user_id, state, producer))
}

// 5. LOGIC CHÍNH CỦA TỪNG KẾT NỐI WEBSOCKET
async fn handle_socket(
    socket: WebSocket,
    user_id: String,
    state: AppState,
    producer: Arc<FutureProducer>,
) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // Tạo một kênh giao tiếp nội bộ (mpsc) cho user này
    let (tx, mut rx) = mpsc::channel::<String>(100);
    
    // Lưu vào bộ nhớ đệm (RAM)
    state.insert(user_id.clone(), tx);
    println!("✅ User {} đã kết nối. Tổng số kết nối: {}", user_id, state.len());

    // Task 1: Nghe tin nhắn từ Kafka (qua kênh mpsc) -> Đẩy xuống Client
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if ws_sender.send(Message::Text(msg)).await.is_err() {
                break; // Client mất mạng
            }
        }
    });

    // Task 2: Nghe tin nhắn từ Client -> Đẩy lên Kafka topic 'from-client'
    let user_id_clone = user_id.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = ws_receiver.next().await {
            println!("Nhận từ {}: {}", user_id_clone, text);
            
            // Đóng gói thành JSON
            let payload = KafkaPayload {
                user_id: user_id_clone.clone(),
                content: text,
            };
            let json_payload = serde_json::to_string(&payload).unwrap();

            // Gửi vào Kafka
            let record = FutureRecord::to("from-client")
                .key(&user_id_clone)
                .payload(&json_payload);
            
            let _ = producer.send(record, Duration::from_secs(0)).await;
        }
    });

    // Chờ 1 trong 2 luồng chết (ví dụ Client ngắt kết nối)
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    // Dọn dẹp RAM ngay lập tức khi Client ngắt kết nối! (Tính năng ăn tiền của Rust)
    state.remove(&user_id);
    println!("❌ User {} đã ngắt kết nối. Tổng số kết nối: {}", user_id, state.len());
}