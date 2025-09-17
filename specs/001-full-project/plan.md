# Kế hoạch triển khai: Toàn bộ dự án

**Nhánh**: `001-full-project` | **Ngày**: 2025-09-15 | **Đặc tả**: [spec.md](./spec.md)
**Đầu vào**: Đặc tả tính năng từ `/specs/001-full-project/spec.md`

## Luồng thực thi (phạm vi lệnh /plan)
```
1. Tải đặc tả tính năng từ đường dẫn Đầu vào
   → Nếu không tìm thấy: LỖI "Không có đặc tả tính năng tại {đường dẫn}"
2. Điền bối cảnh kỹ thuật (quét tìm CẦN LÀM RÕ)
   → Phát hiện loại dự án từ bối cảnh (web=frontend+backend, mobile=app+api)
   → Đặt quyết định cấu trúc dựa trên loại dự án
3. Đánh giá phần Kiểm tra Hiến pháp bên dưới
   → Nếu có vi phạm: Ghi lại trong Theo dõi độ phức tạp
   → Nếu không thể biện minh: LỖI "Đơn giản hóa cách tiếp cận trước"
   → Cập nhật Theo dõi tiến độ: Kiểm tra Hiến pháp ban đầu
4. Thực thi Giai đoạn 0 → research.md
   → Nếu vẫn còn CẦN LÀM RÕ: LỖI "Giải quyết các ẩn số"
5. Thực thi Giai đoạn 1 → contracts, data-model.md, quickstart.md, tệp mẫu dành riêng cho agent (ví dụ: `CLAUDE.md` cho Claude Code, `.github/copilot-instructions.md` cho GitHub Copilot hoặc `GEMINI.md` cho Gemini CLI).
6. Đánh giá lại phần Kiểm tra Hiến pháp
   → Nếu có vi phạm mới: Tái cấu trúc thiết kế, quay lại Giai đoạn 1
   → Cập nhật Theo dõi tiến độ: Kiểm tra Hiến pháp sau thiết kế
7. Lập kế hoạch Giai đoạn 2 → Mô tả cách tiếp cận tạo tác vụ (KHÔNG tạo tasks.md)
8. DỪNG - Sẵn sàng cho lệnh /tasks
```

**QUAN TRỌNG**: Lệnh /plan DỪNG ở bước 7. Các giai đoạn 2-4 được thực thi bởi các lệnh khác:
- Giai đoạn 2: Lệnh /tasks tạo ra tasks.md
- Giai đoạn 3-4: Thực thi triển khai (thủ công hoặc qua các công cụ)

## Tóm tắt
Tài liệu này phác thảo kế hoạch triển khai cho toàn bộ dự án, bao gồm việc tạo ra nhiều dịch vụ như được định nghĩa trong bối cảnh kỹ thuật.

## Bối cảnh kỹ thuật
**Ngôn ngữ/Phiên bản**: Java 17
**Phụ thuộc chính**: Spring Boot, Spring Cloud
**Lưu trữ**: PostgreSQL
**Kiểm thử**: JUnit, Mockito
**Nền tảng mục tiêu**: Máy chủ Linux
**Loại dự án**: web
**Mục tiêu hiệu suất**: CẦN LÀM RÕ
**Ràng buộc**: CẦN LÀM RÕ
**Quy mô/Phạm vi**: CẦN LÀM RÕ

## Kiểm tra Hiến pháp
*CỔNG: Phải vượt qua trước khi nghiên cứu Giai đoạn 0. Kiểm tra lại sau khi thiết kế Giai đoạn 1.*

**Tính đơn giản**:
- Dự án: 12 (tối đa 3 - ví dụ: api, cli, tests) - VI PHẠM
- Sử dụng trực tiếp framework? (không có lớp bao bọc) - CÓ
- Mô hình dữ liệu đơn? (không có DTO trừ khi tuần tự hóa khác nhau) - CÓ
- Tránh các mẫu thiết kế? (không có Repository/UoW nếu không có nhu cầu đã được chứng minh) - CÓ

**Kiến trúc**:
- MỌI tính năng như một thư viện? (không có mã ứng dụng trực tiếp) - CÓ
- Các thư viện được liệt kê: [tên + mục đích cho mỗi loại]
- CLI cho mỗi thư viện: [lệnh với --help/--version/--format]
- Tài liệu thư viện: định dạng llms.txt có được lên kế hoạch không?

**Kiểm thử (KHÔNG THỂ THƯƠNG LƯỢNG)**:
- Chu trình ĐỎ-XANH-Tái cấu trúc có được thực thi không? (kiểm thử PHẢI thất bại trước)
- Các commit Git có hiển thị các bài kiểm thử trước khi triển khai không?
- Thứ tự: Hợp đồng→Tích hợp→E2E→Đơn vị có được tuân thủ nghiêm ngặt không?
- Các phụ thuộc thực có được sử dụng không? (DB thực tế, không phải giả lập)
- Kiểm thử tích hợp cho: thư viện mới, thay đổi hợp đồng, lược đồ dùng chung?
- CẤM: Triển khai trước khi kiểm thử, bỏ qua giai đoạn ĐỎ

**Khả năng quan sát**:
- Ghi log có cấu trúc được bao gồm không?
- Log frontend → backend? (luồng hợp nhất)
- Bối cảnh lỗi có đủ không?

**Phiên bản**:
- Số phiên bản đã được gán chưa? (MAJOR.MINOR.BUILD)
- BUILD có tăng sau mỗi thay đổi không?
- Các thay đổi đột phá có được xử lý không? (kiểm thử song song, kế hoạch di chuyển)

## Cấu trúc dự án

### Tài liệu (tính năng này)
```
specs/001-full-project/
├── plan.md              # Tệp này (đầu ra lệnh /plan)
├── research.md          # Đầu ra giai đoạn 0 (/plan command)
├── data-model.md        # Đầu ra giai đoạn 1 (/plan command)
├── quickstart.md        # Đầu ra giai đoạn 1 (/plan command)
├── contracts/           # Đầu ra giai đoạn 1 (/plan command)
└── tasks.md             # Đầu ra giai đoạn 2 (lệnh /tasks - KHÔNG được tạo bởi /plan)
```

### Mã nguồn (gốc kho lưu trữ)
```
# Tùy chọn 1: Dự án đơn (MẶC ĐỊNH)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Tùy chọn 2: Ứng dụng web (khi phát hiện "frontend" + "backend")
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Tùy chọn 3: Di động + API (khi phát hiện "iOS/Android")
api/
└── [giống như backend ở trên]

ios/ hoặc android/
└── [cấu trúc dành riêng cho nền tảng]
```

**Quyết định cấu trúc**: Tùy chọn 2: Ứng dụng web

## Giai đoạn 0: Phác thảo & Nghiên cứu
1. **Trích xuất các ẩn số từ Bối cảnh kỹ thuật** ở trên:
   - Đối với mỗi CẦN LÀM RÕ → tác vụ nghiên cứu
   - Đối với mỗi phụ thuộc → tác vụ thực tiễn tốt nhất
   - Đối với mỗi tích hợp → tác vụ mẫu

2. **Tạo và điều phối các agent nghiên cứu**:
   ```
   Đối với mỗi ẩn số trong Bối cảnh kỹ thuật:
     Tác vụ: "Nghiên cứu {ẩn số} cho {bối cảnh tính năng}"
   Đối với mỗi lựa chọn công nghệ:
     Tác vụ: "Tìm các thực tiễn tốt nhất cho {công nghệ} trong {miền}"
   ```

3. **Tổng hợp các phát hiện** trong `research.md` bằng định dạng:
   - Quyết định: [đã chọn gì]
   - Lý do: [tại sao chọn]
   - Các lựa chọn thay thế đã xem xét: [đã đánh giá những gì khác]

**Đầu ra**: research.md với tất cả các CẦN LÀM RÕ đã được giải quyết

## Giai đoạn 1: Thiết kế & Hợp đồng
*Điều kiện tiên quyết: research.md hoàn thành*

1. **Trích xuất các thực thể từ đặc tả tính năng** → `data-model.md`:
   - Tên thực thể, các trường, mối quan hệ
   - Quy tắc xác thực từ các yêu cầu
   - Chuyển đổi trạng thái nếu có

2. **Tạo hợp đồng API** từ các yêu cầu chức năng:
   - Đối với mỗi hành động của người dùng → điểm cuối
   - Sử dụng các mẫu REST/GraphQL tiêu chuẩn
   - Xuất lược đồ OpenAPI/GraphQL sang `/contracts/`

3. **Tạo kiểm thử hợp đồng** từ các hợp đồng:
   - Một tệp kiểm thử cho mỗi điểm cuối
   - Xác nhận lược đồ yêu cầu/phản hồi
   - Kiểm thử phải thất bại (chưa có triển khai)

4. **Trích xuất các kịch bản kiểm thử** từ các câu chuyện người dùng:
   - Mỗi câu chuyện → kịch bản kiểm thử tích hợp
   - Kiểm thử nhanh = các bước xác thực câu chuyện

5. **Cập nhật tệp agent tăng dần** (thao tác O(1)):
   - Chạy `/scripts/bash/update-agent-context.sh gemini` cho trợ lý AI của bạn
   - Nếu tồn tại: Chỉ thêm công nghệ MỚI từ kế hoạch hiện tại
   - Giữ lại các bổ sung thủ công giữa các điểm đánh dấu
   - Cập nhật các thay đổi gần đây (giữ 3 thay đổi cuối cùng)
   - Giữ dưới 150 dòng để hiệu quả token
   - Xuất ra gốc kho lưu trữ

**Đầu ra**: data-model.md, /contracts/*, kiểm thử thất bại, quickstart.md, tệp dành riêng cho agent

## Giai đoạn 2: Cách tiếp cận lập kế hoạch tác vụ
*Phần này mô tả những gì lệnh /tasks sẽ làm - KHÔNG thực thi trong /plan*

**Chiến lược tạo tác vụ**:
- Tải `/templates/tasks-template.md` làm cơ sở
- Tạo tác vụ từ các tài liệu thiết kế Giai đoạn 1 (hợp đồng, mô hình dữ liệu, quickstart)
- Mỗi hợp đồng → tác vụ kiểm thử hợp đồng [P]
- Mỗi thực thể → tác vụ tạo mô hình [P] 
- Mỗi câu chuyện người dùng → tác vụ kiểm thử tích hợp
- Tác vụ triển khai để làm cho các bài kiểm thử vượt qua

**Chiến lược sắp xếp**:
- Thứ tự TDD: Kiểm thử trước khi triển khai
- Thứ tự phụ thuộc: Mô hình trước dịch vụ trước giao diện người dùng
- Đánh dấu [P] để thực thi song song (các tệp độc lập)

**Ước tính đầu ra**: 25-30 tác vụ được đánh số, được sắp xếp trong tasks.md

**QUAN TRỌNG**: Giai đoạn này được thực thi bởi lệnh /tasks, KHÔNG phải bởi /plan

## Giai đoạn 3+: Triển khai trong tương lai
*Các giai đoạn này nằm ngoài phạm vi của lệnh /plan*

**Giai đoạn 3**: Thực thi tác vụ (lệnh /tasks tạo ra tasks.md)  
**Giai đoạn 4**: Triển khai (thực thi tasks.md theo các nguyên tắc hiến pháp)  
**Giai đoạn 5**: Xác thực (chạy kiểm thử, thực thi quickstart.md, xác thực hiệu suất)

## Theo dõi độ phức tạp
*Chỉ điền nếu Kiểm tra Hiến pháp có các vi phạm phải được biện minh*

| Vi phạm | Tại sao cần thiết | Lựa chọn thay thế đơn giản hơn bị từ chối vì |
|-----------|------------|-------------------------------------|
| 12 dự án | Dự án là một kiến trúc microservice đòi hỏi nhiều dịch vụ để hoạt động. | Một cách tiếp cận nguyên khối sẽ không thể mở rộng hoặc linh hoạt bằng. |


## Theo dõi tiến độ
*Danh sách kiểm tra này được cập nhật trong quá trình thực thi*

**Trạng thái giai đoạn**:
- [x] Giai đoạn 0: Nghiên cứu hoàn tất (lệnh /plan)
- [ ] Giai đoạn 1: Thiết kế hoàn tất (lệnh /plan)
- [ ] Giai đoạn 2: Lập kế hoạch tác vụ hoàn tất (lệnh /plan - chỉ mô tả cách tiếp cận)
- [ ] Giai đoạn 3: Các tác vụ đã được tạo (lệnh /tasks)
- [ ] Giai đoạn 4: Triển khai hoàn tất
- [ ] Giai đoạn 5: Xác thực đã vượt qua

**Trạng thái cổng**:
- [x] Kiểm tra Hiến pháp ban đầu: VƯỢT QUA
- [ ] Kiểm tra Hiến pháp sau thiết kế: VƯỢT QUA
- [ ] Tất cả các CẦN LÀM RÕ đã được giải quyết
- [ ] Các sai lệch về độ phức tạp đã được ghi lại

---
*Dựa trên Hiến pháp v2.1.1 - Xem `/memory/constitution.md`*