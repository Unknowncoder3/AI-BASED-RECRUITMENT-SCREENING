import cv2

EMOTIONS = ["Neutral", "Happy", "Sad", "Angry", "Surprised"]

def detect_emotion(frame):
    # Lightweight heuristic (safe for college projects)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mean_intensity = gray.mean()

    if mean_intensity > 170:
        return "Happy"
    elif mean_intensity < 90:
        return "Sad"
    else:
        return "Neutral"
