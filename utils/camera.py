import cv2

class CameraMonitor:
    def __init__(self, camera_index=0):
        self.cap = cv2.VideoCapture(camera_index)

        if not self.cap.isOpened():
            raise RuntimeError("❌ Could not access the camera")

    def get_frame(self):
        """
        Capture a single frame for live preview in Streamlit
        """
        ret, frame = self.cap.read()
        if not ret:
            return None
        return frame

    def run_proctoring(self, duration=10):
        """
        Placeholder for future cheating / gaze detection.
        Currently just captures frames.
        """
        flags = []
        for _ in range(duration):
            ret, frame = self.cap.read()
            if not ret:
                flags.append("Camera frame not captured")
        return flags

    def release(self):
        if self.cap:
            self.cap.release()
