import React, { useEffect, useRef, useState } from "react";

// Proctoring is intentionally strict for real integrity events, but camera AI
// detections are debounced so a single bad frame cannot terminate an interview.
const DETECTION_INTERVAL_MS = 1500;
const PHONE_CONFIRMATIONS = 5;
const NO_PERSON_CONFIRMATIONS = 6;
const MULTIPLE_PERSON_CONFIRMATIONS = 3;

export default function AutoProctorPanel({ onReady, onEvent, onTerminate }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const terminatedRef = useRef(false);
  const startedRef = useRef(false);
  const violationsRef = useRef({});
  const phoneHitsRef = useRef(0);
  const noPersonHitsRef = useRef(0);
  const multiplePeopleHitsRef = useRef(0);
  const detectionBusyRef = useRef(false);
  const lastDetectionMessageRef = useRef("");

  const [status, setStatus] = useState("starting");
  const [error, setError] = useState("");
  const [full, setFull] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [violation, setViolation] = useState("");
  const [detectorReady, setDetectorReady] = useState(false);

  const emit = (type, detail = "") =>
    onEvent?.({ type, detail, time: new Date().toISOString() });

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch {}
      videoRef.current.srcObject = null;
    }
  };

  const terminate = (type, detail) => {
    if (terminatedRef.current) return;
    terminatedRef.current = true;
    setStatus("terminated");
    setViolation(detail);
    emit(type, detail);
    stopTracks();
    onTerminate?.({ type, detail });
  };

  const violationEvent = (type, detail, limit = 2, stopNow = false) => {
    const count = (violationsRef.current[type] || 0) + 1;
    violationsRef.current[type] = count;
    setViolation(`${detail} (${count}/${limit})`);
    emit(type, `${detail} | occurrence ${count}`);
    if (stopNow || count >= limit) {
      terminate(
        "proctoring_terminated",
        `${detail}. Integrity policy triggered; assessment stopped.`
      );
    }
  };

  const showDetectionWarning = (message) => {
    if (lastDetectionMessageRef.current === message) return;
    lastDetectionMessageRef.current = message;
    setViolation(message);
  };

  const attach = async (stream) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    const play = async () => {
      try {
        await video.play();
        setHasFrame(video.readyState >= 2);
      } catch {
        setHasFrame(false);
      }
    };

    video.onloadedmetadata = play;
    video.onloadeddata = play;
    setTimeout(play, 150);
  };

  const requestFullscreen = async () => {
    if (document.fullscreenElement) return true;
    try {
      await document.documentElement.requestFullscreen();
      return Boolean(document.fullscreenElement);
    } catch {
      return false;
    }
  };

  const loadDetector = async () => {
    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const coco = await import("@tensorflow-models/coco-ssd");
      detectorRef.current = await coco.load({ base: "lite_mobilenet_v2" });
      setDetectorReady(true);
      emit(
        "object_detection_ready",
        "AI camera detection active: person + mobile-phone detection enabled."
      );
    } catch (e) {
      // A detector loading problem must NOT terminate an otherwise valid session.
      setDetectorReady(false);
      emit(
        "object_detection_unavailable",
        e?.message || "AI object detector could not be loaded."
      );
    }
  };

  const start = async () => {
    if (startedRef.current || terminatedRef.current) return;
    startedRef.current = true;
    setStatus("requesting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera and microphone access is not supported in this browser.");
      }

      const fullscreenStarted = await requestFullscreen();
      setFull(fullscreenStarted);
      if (!fullscreenStarted) {
        emit(
          "fullscreen_gesture_required",
          "Browser requires a user gesture for fullscreen; camera and integrity monitoring are active."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (!videoTrack || !audioTrack) {
        throw new Error("Both camera and microphone tracks are required.");
      }

      streamRef.current = stream;
      await attach(stream);

      videoTrack.onended = () =>
        terminate("camera_lost", "Camera feed ended. Restore camera access to continue.");
      audioTrack.onended = () =>
        terminate("microphone_lost", "Microphone feed ended. Restore microphone access to continue.");

      videoTrack.onmute = () =>
        violationEvent("camera_muted", "Camera feed was muted", 1, true);
      audioTrack.onmute = () =>
        violationEvent("microphone_muted", "Microphone feed was muted", 1, true);

      setStatus("ready");
      onReady?.(stream);
      emit("proctoring_started", "Proctoring started automatically with the interview.");
      loadDetector();
    } catch (e) {
      startedRef.current = false;
      stopTracks();
      setStatus("denied");
      setError(e?.message || "Camera/microphone permission was denied.");
      emit("permission_error", e?.message || "");
    }
  };

  useEffect(() => {
    start();
    return () => {
      detectorRef.current = null;
      stopTracks();
      startedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return undefined;

    const paste = (e) => {
      e.preventDefault();
      violationEvent("paste_blocked", "Paste blocked", 1, true);
    };
    const copy = (e) => {
      e.preventDefault();
      violationEvent("copy_blocked", "Copy blocked", 3);
    };
    const cut = (e) => {
      e.preventDefault();
      violationEvent("cut_blocked", "Cut blocked", 3);
    };
    const menu = (e) => {
      e.preventDefault();
      violationEvent("context_menu", "Context menu blocked", 3);
    };
    const key = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      if (mod && ["c", "v", "x", "a"].includes(k)) {
        e.preventDefault();
        violationEvent(
          k === "v" ? "paste_blocked" : k === "c" ? "copy_blocked" : "cut_blocked",
          `${e.key.toUpperCase()} shortcut blocked`,
          k === "v" ? 1 : 3,
          k === "v"
        );
      }

      if (e.key === "F12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k))) {
        e.preventDefault();
        violationEvent("devtools_shortcut", "Developer-tools shortcut blocked", 1, true);
      }
    };

    const visibility = () => {
      if (document.hidden) {
        terminate(
          "tab_hidden",
          "Assessment tab/window was hidden or minimized. The interview has been stopped."
        );
      }
    };

    const blur = () =>
      violationEvent("window_blur", "Assessment window lost focus", 1, true);

    const fullscreen = () => {
      const active = Boolean(document.fullscreenElement);
      setFull(active);
      if (!active && startedRef.current && !terminatedRef.current) {
        terminate(
          "fullscreen_exit",
          "Fullscreen was exited. The assessment has been stopped."
        );
      }
    };

    document.addEventListener("paste", paste, true);
    document.addEventListener("copy", copy, true);
    document.addEventListener("cut", cut, true);
    document.addEventListener("contextmenu", menu, true);
    document.addEventListener("keydown", key, true);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    document.addEventListener("fullscreenchange", fullscreen);

    const timer = setInterval(async () => {
      const detector = detectorRef.current;
      const video = videoRef.current;

      if (
        !detector ||
        detectionBusyRef.current ||
        terminatedRef.current ||
        !video ||
        video.readyState < 2
      ) return;

      detectionBusyRef.current = true;

      try {
        const predictions = await detector.detect(video);
        const phones = predictions.filter(
          (x) => x.class === "cell phone" && x.score >= 0.60
        );
        const people = predictions.filter(
          (x) => x.class === "person" && x.score >= 0.60
        );

        // PHONE: require five consecutive positive frames (~7.5 sec) before stopping.
        if (phones.length) {
          phoneHitsRef.current += 1;
          showDetectionWarning(
            `Possible mobile phone detected — confirming (${phoneHitsRef.current}/${PHONE_CONFIRMATIONS})`
          );
          emit(
            "external_device_check",
            `Possible phone detection ${phoneHitsRef.current}/${PHONE_CONFIRMATIONS}`
          );
          if (phoneHitsRef.current >= PHONE_CONFIRMATIONS) {
            violationEvent(
              "external_device_detected",
              "External device / mobile phone persistently detected in the camera frame",
              1,
              true
            );
          }
        } else {
          phoneHitsRef.current = 0;
        }

        // NO PERSON: tolerate temporary bad frames / movement / camera exposure.
        if (!people.length) {
          noPersonHitsRef.current += 1;
          showDetectionWarning(
            `Candidate not clearly detected — confirming (${noPersonHitsRef.current}/${NO_PERSON_CONFIRMATIONS})`
          );
          if (noPersonHitsRef.current >= NO_PERSON_CONFIRMATIONS) {
            violationEvent(
              "no_person_detected",
              "Candidate was not visible in the camera frame for a sustained period",
              1,
              true
            );
          }
        } else {
          noPersonHitsRef.current = 0;
        }

        // MULTIPLE PEOPLE: require three consecutive detections.
        if (people.length > 1) {
          multiplePeopleHitsRef.current += 1;
          showDetectionWarning(
            `Multiple people detected — confirming (${multiplePeopleHitsRef.current}/${MULTIPLE_PERSON_CONFIRMATIONS})`
          );
          if (multiplePeopleHitsRef.current >= MULTIPLE_PERSON_CONFIRMATIONS) {
            violationEvent(
              "multiple_people",
              "Multiple people persistently detected in the camera frame",
              1,
              true
            );
          }
        } else {
          multiplePeopleHitsRef.current = 0;
        }

        // Clear stale AI warnings after a clean frame.
        if (people.length === 1 && !phones.length) {
          phoneHitsRef.current = 0;
          noPersonHitsRef.current = 0;
          multiplePeopleHitsRef.current = 0;
          lastDetectionMessageRef.current = "";
          setViolation("");
        }
      } catch (e) {
        // Detector errors are logged but never terminate the interview.
        emit(
          "object_detection_error",
          e?.message || "Camera AI detection temporarily failed."
        );
      } finally {
        detectionBusyRef.current = false;
      }
    }, DETECTION_INTERVAL_MS);

    return () => {
      document.removeEventListener("paste", paste, true);
      document.removeEventListener("copy", copy, true);
      document.removeEventListener("cut", cut, true);
      document.removeEventListener("contextmenu", menu, true);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      document.removeEventListener("fullscreenchange", fullscreen);
      clearInterval(timer);
    };
  }, [status]);

  return (
    <div
      className="card"
      style={{
        padding: 16,
        marginBottom: 16,
        borderColor:
          status === "ready"
            ? "#3ddc9766"
            : status === "terminated"
              ? "#ff6b7a88"
              : "var(--line)"
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            width: 260,
            height: 150,
            borderRadius: 14,
            overflow: "hidden",
            background: "#03050a",
            border: "1px solid var(--line)",
            position: "relative"
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              background: "#03050a"
            }}
          />
          {status !== "ready" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "var(--muted)",
                fontSize: 11
              }}
            >
              {status === "starting" || status === "requesting"
                ? "Starting secure proctoring…"
                : "Camera unavailable"}
            </div>
          )}
          {status === "ready" && !hasFrame && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "var(--muted)",
                fontSize: 11
              }}
            >
              Waiting for camera frame…
            </div>
          )}
          {status === "ready" && (
            <span
              style={{
                position: "absolute",
                left: 8,
                bottom: 8,
                background: "#000a",
                padding: "4px 7px",
                borderRadius: 7,
                fontSize: 9
              }}
            >
              ● LIVE
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="tag">PROCTORED SESSION</span>
            <span
              className="status"
              style={{
                fontSize: 10,
                color: status === "ready" ? "#3ddc97" : "var(--muted)"
              }}
            >
              <i
                style={{
                  background: status === "ready" ? "#3ddc97" : "var(--muted)"
                }}
              />
              {status === "ready"
                ? "Camera + microphone + integrity monitoring active"
                : status === "requesting"
                  ? "Securing session…"
                  : status === "terminated"
                    ? "Assessment terminated"
                    : "Starting automatically…"}
            </span>
          </div>

          <p className="muted" style={{ fontSize: 11, lineHeight: 1.5, margin: "8px 0" }}>
            Automatic monitoring: camera/microphone health, fullscreen, tab visibility,
            focus changes, copy/paste, context menu, multiple people and AI-based
            mobile-phone detection.
          </p>

          {detectorReady && (
            <span className="tag" style={{ marginRight: 8 }}>
              AI DEVICE DETECTION ON
            </span>
          )}
          {full ? (
            <span className="tag">🔒 FULLSCREEN LOCKED</span>
          ) : (
            status === "ready" && <span className="tag">⚠ FULLSCREEN PENDING</span>
          )}
          {error && (
            <div style={{ color: "#ff8b96", fontSize: 11, marginTop: 8 }}>{error}</div>
          )}
          {violation && (
            <div style={{ color: "#ffb86b", fontSize: 11, marginTop: 8 }}>⚠ {violation}</div>
          )}
        </div>
      </div>
    </div>
  );
}
