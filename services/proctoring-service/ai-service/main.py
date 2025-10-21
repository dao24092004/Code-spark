# file: main.py
import cv2
import numpy as np
import mediapipe as mp
from ultralytics import YOLO
import pickle
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# --- CẤU HÌNH VÀ HELPERS ---
PITCH_DOWN, YAW_SIDE, OCCLUSION_DARK, OCCLUSION_UNIFORM = 20.0, 25.0, 40, 10
LANDMARK_IDS = [1, 199, 33, 263, 61, 291]
MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),(0.0, -63.6, -12.5),(-43.3,32.7,-26),
    (43.3,32.7,-26),(-28.9,-28.9,-24.1),(28.9,-28.9,-24.1)
], dtype=np.float64)

def get_head_pose(landmarks, shape):
    h,w = shape[:2]
    img_pts = np.array([(landmarks[i].x*w, landmarks[i].y*h) for i in LANDMARK_IDS], dtype=np.float64)
    cam = np.array([[w,0,w/2],[0,w,h/2],[0,0,1]], dtype=np.float64)
    ok, rvec, _ = cv2.solvePnP(MODEL_POINTS_3D, img_pts, cam, np.zeros((4,1)))
    if not ok: return None
    R,_ = cv2.Rodrigues(rvec)
    sy = np.sqrt(R[0,0]**2 + R[1,0]**2)
    pitch = np.degrees(np.arctan2(R[2,1], R[2,2]))
    yaw = np.degrees(np.arctan2(-R[2,0], sy))
    return {"pitch":pitch, "yaw":yaw}

def extract_features(frame, last_gray, head_angles, yolo_results):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_b = float(np.mean(gray))
    std_b = float(np.std(gray))
    labels = [yolo_results.names[int(c)] for c in yolo_results.boxes.cls] if yolo_results else []
    person_count = labels.count("person")
    phone_flag = int(any("phone" in l.lower() or "cell" in l.lower() for l in labels))
    pitch = head_angles["pitch"] if head_angles else 0.0
    yaw = head_angles["yaw"] if head_angles else 0.0
    motion = 0.0
    if last_gray is not None:
        diff = cv2.absdiff(gray, last_gray)
        motion = np.count_nonzero(diff) / diff.size
    occlusion = 1 if (mean_b < OCCLUSION_DARK or std_b < OCCLUSION_UNIFORM) else 0
    return {"person_count": person_count, "phone": phone_flag, "mean_b": mean_b, 
            "std_b": std_b, "pitch": pitch, "yaw": yaw, "motion": motion, "occlusion": occlusion}

# --- KHỞI TẠO SERVER VÀ TẢI MODEL ---
app = FastAPI(title="Proctoring AI Service", version="2.0.0")
yolo_model = YOLO('yolov8n.pt')
mp_face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=2, refine_landmarks=True)
clf = None
try:
    with open("violation_model.pkl", "rb") as f:
        clf = pickle.load(f)
    print("INFO:     Tải model 'violation_model.pkl' thành công.")
except FileNotFoundError:
    print("WARNING:  Không tìm thấy file 'violation_model.pkl'.")

# --- API ---
class AnalysisResult(BaseModel):
    events: List[Dict[str, Any]]

@app.post("/analyze_frame", response_model=AnalysisResult)
async def analyze_frame(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None: raise HTTPException(status_code=400, detail="Ảnh không hợp lệ.")

    detected_events = []
    yolo_results = yolo_model.predict(frame, conf=0.4, verbose=False)[0]
    head_angles = None
    fm_results = mp_face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    if fm_results.multi_face_landmarks and len(fm_results.multi_face_landmarks) == 1:
        head_angles = get_head_pose(fm_results.multi_face_landmarks[0].landmark, frame.shape)

    # Trích xuất và áp dụng luật
    feats = extract_features(frame, None, head_angles, yolo_results)
    if feats["person_count"] == 0: detected_events.append({"event_type": "FACE_NOT_DETECTED", "severity": "high", "metadata": {}})
    elif feats["person_count"] > 1: detected_events.append({"event_type": "MULTIPLE_FACES", "severity": "high", "metadata": {"persons_detected": feats["person_count"]}})
    if feats["phone"] == 1: detected_events.append({"event_type": "MOBILE_PHONE_DETECTED", "severity": "high", "metadata": {}})
    if feats["occlusion"] == 1: detected_events.append({"event_type": "CAMERA_TAMPERED", "severity": "medium", "metadata": {}})
    if head_angles:
        if head_angles["pitch"] > PITCH_DOWN: detected_events.append({"event_type": "LOOKING_AWAY", "severity": "low", "metadata": {"direction": "down"}})
        if abs(head_angles["yaw"]) > YAW_SIDE: detected_events.append({"event_type": "LOOKING_AWAY", "severity": "medium", "metadata": {"direction": "side"}})

    # Dự đoán bằng model ML
    if clf:
        X_pred = np.array([[feats["person_count"], feats["phone"], feats["mean_b"], feats["std_b"], feats["pitch"], feats["yaw"], feats["motion"], feats["occlusion"]]])
        ml_pred = clf.predict(X_pred)[0]
        if ml_pred != 'no_violation':
            event_map = {"Roi_manhinh": "FACE_NOT_DETECTED", "Nhieu_nguoi": "MULTIPLE_FACES", "Dien_thoai": "MOBILE_PHONE_DETECTED", "Che_camera": "CAMERA_TAMPERED", "Khac": "SUSPICIOUS_BEHAVIOR"}
            event_type = event_map.get(ml_pred, "SUSPICIOUS_BEHAVIOR")
            if not any(e['event_type'] == event_type for e in detected_events):
                detected_events.append({"event_type": event_type, "severity": "medium", "metadata": {"source": "ml_model", "prediction": ml_pred}})

    return {"events": detected_events}