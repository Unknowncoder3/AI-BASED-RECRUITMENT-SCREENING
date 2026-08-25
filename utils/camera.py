import cv2


class CameraMonitor:
    """Optional camera preview. No biometric or emotion inference is performed."""

    def __init__(self, camera_index: int = 0):
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            raise RuntimeError("Could not access the camera")

    def get_frame(self):
        ret, frame = self.cap.read()
        return frame if ret else None

    def run_proctoring(self, duration: int = 10):
        """Capture frames only; this is not a cheating detector."""
        flags = []
        for _ in range(max(0, duration)):
            ret, _ = self.cap.read()
            if not ret:
                flags.append("Camera frame not captured")
        return flags

    def release(self):
        if self.cap:
            self.cap.release()
