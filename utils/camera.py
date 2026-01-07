# utils/camera.py

import cv2
import time


class CameraMonitor:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.flags = []

    # -----------------------------
    # Detect faces in a frame
    # -----------------------------
    def _detect_faces(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.3, minNeighbors=5
        )
        return faces

    # -----------------------------
    # Run proctoring for N seconds
    # -----------------------------
    def run_proctoring(self, duration: int = 10):
        start_time = time.time()

        while time.time() - start_time < duration:
            ret, frame = self.cap.read()
            if not ret:
                self.flags.append("Camera frame not available")
                continue

            faces = self._detect_faces(frame)

            if len(faces) == 0:
                self.flags.append("No face detected")

            elif len(faces) > 1:
                self.flags.append("Multiple faces detected")

            time.sleep(1)

        return self.flags

    # -----------------------------
    # Release camera
    # -----------------------------
    def release(self):
        if self.cap.isOpened():
            self.cap.release()
