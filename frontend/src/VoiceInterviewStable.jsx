import React, { useEffect, useRef, useState } from "react";
import ProctorPanel from "./ProctorPanel.jsx";
import { HR_BANK, PROJECT_BANK, selectQuestions } from "./questionBank.js";

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

const MOTIVATION = [
  "Why do you want this role, and why is it a good match for your current skills?",
  "What part of this role would you be most excited to work on in your first six months?",
  "How does this role fit into the direction you want your career to take?",
  "What do you expect to learn in this role, and what value can you contribute immediately?",
  "What keeps you motivated when a problem is difficult or ambiguous?"
];

const FIRST_QUESTION = {
  id: "BEH-SELF",
  question: "Tell me about yourself. Walk me through your background, skills, and experiences that are most relevant to this role."
};

function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function keyFor(profile, phase) {
  return "candidateiq-" + profile.role + "-" + profile.branch + "-" + phase + "-interview-history";
}

function readHistory(profile, phase) {
  try {
    return JSON.parse(sessionStorage.getItem(keyFor(profile, phase)) || "[]");
  } catch (error) {
    return [];
  }
}

function writeHistory(profile, phase, ids) {
  try {
    sessionStorage.setItem(keyFor(profile, phase), JSON.stringify(Array.from(new Set(ids)).slice(-500)));
  } catch (error) {
    // Ignore storage errors.
  }
}

function scoreAnswer(text, phase, role) {
  const value = String(text || "").trim().toLowerCase();
  const count = value ? value.split(/\s+/).length : 0;
  if (!count) return 0;
  if (count < 8) return 18;

  let words = ["project", "experience", "learn", "team", "result", "skill"];
  if (phase === "technical") words = ROLE_WORDS[role] || words;
  if (phase === "motivation") words = ["role", "company", "learn", "career", "impact", "contribute"];
  if (phase === "hr") words = ["team", "feedback", "problem", "learn", "communication", "ownership"];

  const hits = words.filter(function (word) { return value.indexOf(word) !== -1; }).length;
  return Math.min(95, Math.round(28 + Math.min(38, count * 1.05) + hits * 6));
}

function followUpFor(answer, role) {
  const text = String(answer || "").toLowerCase();
  const roleWords = ROLE_WORDS[role] || ["project", "technology", "testing", "api", "database"];
  const mentioned = roleWords.find(function (word) { return text.indexOf(word) !== -1; });

  if (mentioned) {
    return {
      id: "FOLLOW-" + Date.now(),
      question: "You mentioned " + mentioned + ". Give me one concrete example of how you used it, what you personally did, and what result you achieved."
    };
  }

  return {
    id: "FOLLOW-" + Date.now(),
    question: "Which experience best demonstrates that you are ready for this role, and why?"
  };
}

function makeQuestions(profile, phase, history) {
  const asked = new Set(history);

  if (phase === "behavioral") {
    const extra = shuffle(HR_BANK.map(function (question, index) {
      return { id: "BEH-" + (index + 1), question: question };
    }).filter(function (item) {
      return !asked.has(item.id) && !/tell me about yourself|why this role|why this company/i.test(item.question);
    })).slice(0, 2);
    return [FIRST_QUESTION].concat(extra);
  }

  if (phase === "motivation") {
    return shuffle(MOTIVATION.map(function (question, index) {
      return { id: "MOT-" + (index + 1), question: question };
    }).filter(function (item) { return !asked.has(item.id); })).slice(0, 3);
  }

  if (phase === "technical") {
    return selectQuestions({
      phase: "technical",
      branch: profile.branch || "CSE",
      askedIds: history,
      limit: 4
    });
  }

  if (phase === "project") {
    return selectQuestions({
      phase: "project",
      branch: profile.branch || "CSE",
      askedIds: history,
      limit: 4
    });
  }

  return selectQuestions({
    phase: "hr",
    branch: profile.branch || "CSE",
    askedIds: history,
    limit: 4
  });
}

function getVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const english = voices.filter(function (voice) { return /^en(-|_)/i.test(voice.lang); });
  return english[0] || voices[0] || null;
}

export default function VoiceInterviewStable(props) {
  const p = props.p;
  const phase = props.phase;
  const onComplete = props.onComplete;

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const [voice, setVoice] = useState(null);
  const [events, setEvents] = useState([]);
  const [terminated, setTerminated] = useState(false);
  const [reason, setReason] = useState("");

  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const runningRef = useRef(false);
  const questionRef = useRef(0);
  const generationRef = useRef(0);
  const timerRef = useRef(null);
  const askedRef = useRef([]);

  function emit(event) {
    setEvents(function (current) {
      return current.concat([{ type: event.type, detail: event.detail, time: new Date().toISOString() }]);
    });
  }

  function stopListening() {
    runningRef.current = false;
    generationRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (error) { /* already stopped */ }
    }
    recognitionRef.current = null;
    setListening(false);
  }

  useEffect(function () {
    const history = readHistory(p, phase);
    askedRef.current = history;
    setQuestions(makeQuestions(p, phase, history));
    setIndex(0);
    setAnswers([]);
    setAnswer("");
    setReady(false);
    setTerminated(false);
    setReason("");
  }, [p.role, p.branch, phase]);

  useEffect(function () {
    const updateVoice = function () { setVoice(getVoice()); };
    updateVoice();
    if (window.speechSynthesis) window.speechSynthesis.addEventListener("voiceschanged", updateVoice);
    return function () {
      if (window.speechSynthesis) window.speechSynthesis.removeEventListener("voiceschanged", updateVoice);
    };
  }, []);

  function speakQuestion() {
    if (!window.speechSynthesis || !questions[index]) return;
    stopListening();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(questions[index].question);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    if (voice) utterance.voice = voice;
    utterance.onstart = function () { setSpeaking(true); };
    utterance.onend = function () { setSpeaking(false); };
    utterance.onerror = function () { setSpeaking(false); };
    window.speechSynthesis.speak(utterance);
  }

  function startListening(restart) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || terminated) {
      emit({ type: "voice_unavailable", detail: "Speech recognition is unavailable in this browser." });
      return;
    }
    if (runningRef.current && !restart) return;

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const questionNumber = questionRef.current;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = function (event) {
      if (generation !== generationRef.current || questionNumber !== questionRef.current) return;
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0] ? event.results[i][0].transcript : "";
        if (event.results[i].isFinal) finalText += text + " ";
        else interim += text + " ";
      }
      if (finalText) transcriptRef.current = (transcriptRef.current + " " + finalText).replace(/\s+/g, " ").trim();
      setAnswer((transcriptRef.current + " " + interim).replace(/\s+/g, " ").trim());
    };

    recognition.onend = function () {
      if (!runningRef.current || terminated || generation !== generationRef.current || questionNumber !== questionRef.current) return;
      runningRef.current = false;
      timerRef.current = setTimeout(function () { startListening(true); }, 200);
    };

    recognition.onerror = function (event) {
      if (event.error !== "aborted" && event.error !== "no-speech" && event.error !== "not-allowed") {
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
    } catch (error) {
      runningRef.current = false;
      timerRef.current = setTimeout(function () { startListening(true); }, 250);
    }
  }

  useEffect(function () {
    stopListening();
    questionRef.current = index;
    transcriptRef.current = "";
    setAnswer("");
    setSpeaking(false);
    if (!questions[index] || terminated) return undefined;
    timerRef.current = setTimeout(function () { speakQuestion(); }, 250);
    return function () { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, questions, terminated, voice]);

  function terminate(info) {
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    const detail = info && info.detail ? info.detail : "Integrity policy violation detected.";
    setTerminated(true);
    setReason(detail);
    emit({ type: "interview_terminated", detail: detail });
  }

  function submit() {
    if (terminated) return;
    const value = (transcriptRef.current || answer).trim();
    if (!value) {
      emit({ type: "empty_answer", detail: "Question " + (index + 1) + " submitted without an answer" });
      return;
    }

    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const current = questions[index];
    const nextAnswers = answers.concat([{ id: current.id, question: current.question, answer: value }]);
    const nextAsked = askedRef.current.concat([current.id]);

    if (phase === "behavioral" && index === 0) {
      const followUp = followUpFor(value, p.role);
      setQuestions(function (currentQuestions) {
        return [currentQuestions[0], followUp].concat(currentQuestions.slice(1));
      });
      nextAsked.push(followUp.id);
    }

    askedRef.current = nextAsked;
    writeHistory(p, phase, nextAsked);

    if (index < questions.length - 1) {
      setAnswers(nextAnswers);
      setIndex(function (currentIndex) { return currentIndex + 1; });
      return;
    }

    const scores = nextAnswers.map(function (item) { return scoreAnswer(item.answer, phase, p.role); });
    const total = scores.reduce(function (sum, valueToAdd) { return sum + valueToAdd; }, 0);
    const score = scores.length ? Math.round(total / scores.length) : 0;
    onComplete({ score: score, answers: nextAnswers, events: events, askedIds: nextAsked });
  }

  if (!questions.length) {
    return <div className="card" style={{ padding: 42, textAlign: "center" }}><h2>Preparing interview questions...</h2><p className="muted">Selecting fresh role-aware questions.</p></div>;
  }

  if (terminated) {
    return <div className="card" style={{ padding: 42, textAlign: "center" }}><h1>Interview stopped</h1><p className="muted">{reason}</p><span className="tag">SESSION FLAGGED FOR REVIEW</span></div>;
  }

  const currentQuestion = questions[index];
  const title = phase === "behavioral" ? "Start with your story." : phase === "motivation" ? "Now let's talk about the role." : phase === "technical" ? "Show your technical depth." : "Let's finish with HR.";

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">VOICE INTERVIEW · {String(phase).toUpperCase()}</span>
        <h1 style={{ fontSize: 40, margin: "14px 0 6px" }}>{title}</h1>
        <p className="muted">Question {index + 1} of {questions.length} · Speak naturally and submit when finished.</p>
      </div>

      <ProctorPanel onReady={function () { setReady(true); }} onEvent={emit} onTerminate={terminate} />

      <div className="card" style={{ maxWidth: 960, margin: "auto", opacity: ready ? 1 : 0.55 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span className="tag">AI INTERVIEWER</span>
          <span className="muted" style={{ fontSize: 10 }}>{voice ? "Browser voice · " + voice.name : "Browser voice"}</span>
        </div>
        <div className="divider" />

        <div style={{ textAlign: "center" }}>
          <div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#8065ff,#4e38c8)", fontSize: 30 }}>✦</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 15 }}>{speaking ? "AI is speaking..." : listening ? "Microphone active" : "Ready"}</div>
          <h2 style={{ fontSize: 25, lineHeight: 1.4, maxWidth: 760, margin: "20px auto" }}>{currentQuestion.question}</h2>

          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <button className="secondary" onClick={speakQuestion} disabled={!ready || speaking}>Repeat question</button>
            <button className="primary" onClick={function () { startListening(false); }} disabled={!ready || speaking || listening}>Start answer</button>
            {listening && <span className="tag">Listening continuously</span>}
          </div>

          <textarea
            className="input"
            value={answer}
            onChange={function (event) { transcriptRef.current = event.target.value; setAnswer(event.target.value); }}
            placeholder="Your live transcript appears here..."
            style={{ minHeight: 150, maxWidth: 760, margin: "20px auto 0", display: "block" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, maxWidth: 760, margin: "10px auto 0" }}>
            <span className="muted" style={{ fontSize: 10 }}>Speech recognition reconnects automatically when the browser ends a recognition segment.</span>
            <button className="primary" onClick={submit} disabled={!ready}>{index === questions.length - 1 ? "Submit & continue" : "Submit answer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
