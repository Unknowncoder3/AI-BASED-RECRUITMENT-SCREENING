import React, { useEffect, useRef, useState } from "react";
import ProctorPanel from "./ProctorPanel.jsx";
import { HR_BANK, PROJECT_BANK, selectQuestions } from "./questionBank.js";

const ROLE_FIT = [
  ["MOT-1", "Why do you want this role, and why is it a good match for your current skills?"],
  ["MOT-2", "What part of this role would you be most excited to work on in your first six months?"],
  ["MOT-3", "How does this role fit into the direction you want your career to take?"],
  ["MOT-4", "What do you expect to learn in this role, and what value can you contribute immediately?"],
  ["MOT-5", "What keeps you motivated when a problem is difficult or ambiguous?"]
];

const FIRST_QUESTION = {
  id: "BEH-SELF",
  question: "Tell me about yourself. Walk me through your background, skills, and experiences that are most relevant to this role."
};

const ROLE_WORDS = {
  "Data Scientist": ["python", "machine learning", "statistics", "model", "data"],
  "Data Analyst": ["sql", "python", "power bi", "excel", "analysis", "dashboard"],
  "AI Engineer": ["python", "machine learning", "llm", "api", "model"],
  "ML Engineer": ["python", "machine learning", "model", "statistics"],
  "Software Engineer": ["dsa", "algorithm", "system", "api", "testing"],
  "Software Developer": ["java", "python", "dsa", "algorithm", "testing"],
  "Backend Developer": ["api", "database", "python", "java", "sql"],
  "Frontend Developer": ["javascript", "react", "html", "css", "frontend"],
  "Full Stack Developer": ["react", "node", "api", "database", "javascript"],
  "Business Analyst": ["sql", "excel", "power bi", "requirements", "stakeholder"]
};

function scoreAnswer(answer, phase, role) {
  const text = String(answer || "").trim().toLowerCase();
  if (!text) return 0;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8) return 18;

  let keywords = ["project", "experience", "learn", "team", "result", "skill"];
  if (phase === "technical") keywords = ROLE_WORDS[role] || ["technology", "api", "database", "testing"];
  if (phase === "motivation") keywords = ["role", "company", "learn", "career", "impact", "contribute"];
  if (phase === "hr") keywords = ["team", "feedback", "problem", "learn", "communication", "ownership"];

  const hits = keywords.filter((keyword) => text.includes(keyword)).length;
  return Math.min(95, Math.round(28 + Math.min(38, words.length * 1.05) + hits * 6));
}

function chooseVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const english = voices.filter((voice) => /^en(-|_)/i.test(voice.lang));
  const preferred = [/samantha/i, /ava/i, /jenny/i, /aria/i, /allison/i, /google.*us/i, /daniel/i, /alex/i];

  for (const pattern of preferred) {
    const match = english.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }

  return english.find((voice) => voice.localService && voice.default) || english.find((voice) => voice.localService) || english[0] || voices[0] || null;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function historyKey(profile, phase) {
  return `candidateiq-${profile.role}-${profile.branch}-${phase}-interview-history`;
}

function loadHistory(profile, phase) {
  try {
    return JSON.parse(sessionStorage.getItem(historyKey(profile, phase)) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(profile, phase, ids) {
  try {
    sessionStorage.setItem(historyKey(profile, phase), JSON.stringify([...new Set(ids)].slice(-500)));
  } catch {
    // Session storage can be unavailable in restricted browser modes.
  }
}

function buildFollowUp(answer, role) {
  const text = String(answer || "").toLowerCase();
  const keywords = ROLE_WORDS[role] || ["project", "technology", "testing", "api", "database"];
  const mentioned = keywords.find((keyword) => text.includes(keyword));

  if (mentioned) {
    return {
      id: `FOLLOW-${Date.now()}`,
      question: `You mentioned ${mentioned}. Give me one concrete example of how you used ${mentioned}, what you personally did, and what result you achieved.`
    };
  }

  if (/project|internship|dashboard|model|app|system|pipeline|api|website|classifier|recommender/.test(text)) {
    return {
      id: `FOLLOW-${Date.now()}`,
      question: "You mentioned practical experience. What was your exact contribution, what was the hardest part, and what would you improve today?"
    };
  }

  return {
    id: `FOLLOW-${Date.now()}`,
    question: "Which experience best demonstrates that you are ready for this role, and why?"
  };
}

function buildQuestions(profile, phase, askedIds) {
  const asked = new Set(askedIds);

  if (phase === "behavioral") {
    const extra = shuffle(
      HR_BANK.map((question, index) => ({ id: `BEH-${index + 1}`, question }))
        .filter((item) => !asked.has(item.id))
        .filter((item) => !/tell me about yourself|why this role|why this company/i.test(item.question))
    ).slice(0, 2);
    return [FIRST_QUESTION, ...extra];
  }

  if (phase === "motivation") {
    return shuffle(ROLE_FIT.map(([id, question]) => ({ id, question })))
      .filter((item) => !asked.has(item.id))
      .slice(0, 3);
  }

  if (phase === "technical") {
    const technical = selectQuestions({
      phase: "technical",
      branch: profile.branch || "CSE",
      askedIds,
      limit: 3
    });
    const projects = shuffle(
      PROJECT_BANK.map((question, index) => ({ id: `PROJ-${index + 1}`, question }))
    ).filter((item) => !asked.has(item.id)).slice(0, 2);
    return [...technical, ...projects];
  }

  if (phase === "hr") {
    return shuffle(
      HR_BANK.map((question, index) => ({ id: `HR-${index + 1}`, question }))
    ).filter((item) => !asked.has(item.id)).slice(0, 4);
  }

  return [];
}

export default function VoiceInterviewStable({ p, phase, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const [voice, setVoice] = useState(null);
  const [events, setEvents] = useState([]);
  const [terminated, setTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");

  const recognitionRef = useRef(null);
  const runningRef = useRef(false);
  const transcriptRef = useRef("");
  const restartTimerRef = useRef(null);
  const generationRef = useRef(0);
  const questionRef = useRef(0);
  const askedRef = useRef([]);

  const emit = (event) => {
    setEvents((current) => [...current, { ...event, time: event.time || new Date().toISOString() }]);
  };

  useEffect(() => {
    const loadVoice = () => setVoice(chooseVoice());
    loadVoice();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoice);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoice);
  }, []);

  useEffect(() => {
    const history = loadHistory(p, phase);
    askedRef.current = history;
    setQuestions(buildQuestions(p, phase, history));
    setQuestionIndex(0);
    setAnswers([]);
    setAnswer("");
    setReady(false);
    setTerminated(false);
    setTerminationReason("");
  }, [p.role, p.branch, phase]);

  const stopRecognition = () => {
    runningRef.current = false;
    generationRef.current += 1;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already have stopped.
    }
    recognitionRef.current = null;
    setListening(false);
  };

  const startRecognition = ({ restart = false } = {}) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || terminated) {
      emit({ type: "voice_unavailable", detail: "Speech recognition is unavailable in this browser." });
      return;
    }

    if (runningRef.current && !restart) return;
    runningRef.current = false;

    const generation = ++generationRef.current;
    const questionAtStart = questionRef.current;
    const recognition = new SpeechRecognition();

    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      if (questionAtStart !== questionRef.current || generation !== generationRef.current) return;

      let interim = "";
      let finals = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finals += `${text} `;
        else interim += `${text} `;
      }

      if (finals) transcriptRef.current = `${transcriptRef.current} ${finals}`.replace(/\s+/g, " ").trim();
      setAnswer(`${transcriptRef.current} ${interim}`.replace(/\s+/g, " ").trim());
    };

    recognition.onend = () => {
      if (!runningRef.current || terminated || questionAtStart !== questionRef.current || generation !== generationRef.current) return;
      runningRef.current = false;
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (questionAtStart === questionRef.current && !terminated) startRecognition({ restart: true });
      }, 180);
    };

    recognition.onerror = (event) => {
      if (!['aborted', 'no-speech', 'not-allowed'].includes(event.error)) {
        emit({ type: "speech_error", detail: event.error });
      }
      if (event.error === "not-allowed") {
        runningRef.current = false;
        setListening(false);
      }
    };

    runningRef.current = true;
    setListening(true);
    try {
      recognition.start();
    } catch {
      runningRef.current = false;
      restartTimerRef.current = setTimeout(() => startRecognition({ restart: true }), 220);
    }
  };

  const speakQuestion = () => {
    if (!window.speechSynthesis || !questions[questionIndex]) return;
    stopRecognition();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(questions[questionIndex].question);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    stopRecognition();
    questionRef.current = questionIndex;
    transcriptRef.current = "";
    setAnswer("");
    setSpeaking(false);

    if (!questions[questionIndex] || !window.speechSynthesis || terminated) return undefined;
    const timer = setTimeout(speakQuestion, 220);
    return () => clearTimeout(timer);
  }, [questionIndex, questions, voice, terminated]);

  const terminateInterview = (info) => {
    stopRecognition();
    window.speechSynthesis?.cancel();
    setTerminated(true);
    setTerminationReason(info?.detail || "Integrity policy violation detected.");
    emit({ type: "interview_terminated", detail: info?.detail || "Integrity policy violation detected." });
  };

  const submitAnswer = () => {
    if (terminated) return;

    const value = (transcriptRef.current || answer).trim();
    if (!value) {
      emit({ type: "empty_answer", detail: `Question ${questionIndex + 1} submitted without an answer` });
      return;
    }

    stopRecognition();
    window.speechSynthesis?.cancel();

    const currentQuestion = questions[questionIndex];
    const nextAnswers = [...answers, { id: currentQuestion.id, question: currentQuestion.question, answer: value }];
    const nextAsked = [...askedRef.current, currentQuestion.id];

    if (phase === "behavioral" && questionIndex === 0) {
      const followUp = buildFollowUp(value, p.role);
      setQuestions((current) => [current[0], followUp, ...current.slice(1)]);
      nextAsked.push(followUp.id);
    }

    askedRef.current = nextAsked;
    saveHistory(p, phase, nextAsked);

    if (questionIndex < questions.length - 1) {
      setAnswers(nextAnswers);
      setQuestionIndex((current) => current + 1);
      return;
    }

    const scores = nextAnswers.map((item) => scoreAnswer(item.answer, phase, p.role));
    const score = scores.length ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length) : 0;

    onComplete({
      score,
      answers: nextAnswers,
      events,
      askedIds: nextAsked
    });
  };

  if (!questions.length) {
    return (
      <div className="card" style={{ padding: 42, textAlign: "center" }}>
        <h2>Preparing question bank…</h2>
        <p className="muted">Selecting fresh, role-aware questions for this stage.</p>
      </div>
    );
  }

  if (terminated) {
    return (
      <div className="card" style={{ padding: 42, textAlign: "center", borderColor: "#ff6b7a88" }}>
        <div style={{ fontSize: 48 }}>🚨</div>
        <h1>Interview stopped</h1>
        <p className="muted">{terminationReason}</p>
        <span className="tag">SESSION FLAGGED FOR REVIEW</span>
      </div>
    );
  }

  const currentQuestion = questions[questionIndex];
  const title = phase === "behavioral"
    ? "Start with your story."
    : phase === "motivation"
      ? "Now let's talk about the role."
      : phase === "technical"
        ? "Show your technical depth."
        : "Let's finish with HR.";

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">🎙 {phase.toUpperCase()} INTERVIEW</span>
        <h1 style={{ fontSize: 40, margin: "14px 0 6px" }}>{title}</h1>
        <p className="muted">Question {questionIndex + 1} of {questions.length} · Speak naturally. A short pause will not stop the microphone; submit when your answer is complete.</p>
      </div>

      <ProctorPanel onReady={() => setReady(true)} onEvent={emit} onTerminate={terminateInterview} />

      <div className="card" style={{ maxWidth: 960, margin: "auto", opacity: ready ? 1 : 0.55 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span className="tag">AI INTERVIEWER</span>
          <span className="muted" style={{ fontSize: 10 }}>{voice ? `Natural voice · ${voice.name}` : "Natural browser voice"}</span>
        </div>

        <div className="divider" />

        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            margin: "0 auto",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg,#8065ff,#4e38c8)",
            boxShadow: speaking ? "0 0 0 14px var(--soft),0 0 40px #8065ff66" : "0 0 0 10px var(--soft)",
            fontSize: 30
          }}>✦</div>

          <div className="muted" style={{ fontSize: 11, marginTop: 15 }}>
            {speaking ? "AI is speaking…" : listening ? "Microphone active — keep speaking" : "Ready"}
          </div>

          <h2 style={{ fontSize: 25, lineHeight: 1.4, maxWidth: 760, margin: "20px auto" }}>
            {currentQuestion.question}
          </h2>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <button className="secondary" onClick={speakQuestion} disabled={!ready || speaking}>🔊 Repeat question</button>
            {!listening ? (
              <button className="primary" onClick={() => startRecognition()} disabled={!ready || speaking}>🎙 Start answer</button>
            ) : (
              <span className="tag" style={{ padding: "10px 14px" }}>● Listening continuously</span>
            )}
          </div>

          <textarea
            className="input"
            value={answer}
            onChange={(event) => {
              transcriptRef.current = event.target.value;
              setAnswer(event.target.value);
            }}
            placeholder="Your live transcript appears here…"
            style={{ minHeight: 150, maxWidth: 760, margin: "20px auto 0", display: "block" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, maxWidth: 760, margin: "10px auto 0" }}>
            <span className="muted" style={{ fontSize: 10 }}>Live transcription automatically reconnects if the browser ends recognition.</span>
            <button className="primary" onClick={submitAnswer} disabled={!ready}>
              {questionIndex === questions.length - 1 ? "Submit & continue →" : "Submit answer →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
