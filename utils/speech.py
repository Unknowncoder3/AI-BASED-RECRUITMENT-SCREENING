# utils/speech.py

import speech_recognition as sr
import pyttsx3


class SpeechEngine:
    def __init__(self, rate: int = 155):
        self.recognizer = sr.Recognizer()
        self.engine = pyttsx3.init()
        self.engine.setProperty("rate", rate)

    # -----------------------------
    # Text to Speech
    # -----------------------------
    def speak(self, text: str):
        if not text:
            return
        self.engine.say(text)
        self.engine.runAndWait()

    # -----------------------------
    # Speech to Text
    # -----------------------------
    def listen(self, timeout: int = 5) -> str:
        with sr.Microphone() as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            try:
                audio = self.recognizer.listen(
                    source, timeout=timeout, phrase_time_limit=15
                )
                return self.recognizer.recognize_google(audio)
            except sr.WaitTimeoutError:
                return ""
            except sr.UnknownValueError:
                return ""
            except sr.RequestError:
                return ""
