import streamlit as st
import re
import time
from fpdf import FPDF

# -------------------------------
# Imports (EXISTING)
# -------------------------------
from analyzers.resume_analyzer import analyze_resume
from analyzers.github_analyzer import analyze_github
from analyzers.academic_analyzer import analyze_academics
from analyzers.project_analyzer import analyze_projects

from scoring.score_engine import final_score
from scoring.decision_engine import final_decision

from llm.ollama_client import run_llm
from llm.prompts import candidate_prompt, HR_PROMPT, TECH_PROMPT

from utils.pdf_parser import extract_text_from_pdf
from utils.speech import SpeechEngine
from utils.camera import CameraMonitor

# -------------------------------
# ⚡ FAST LLM (CACHE)
# -------------------------------
@st.cache_data(show_spinner=False)
def fast_llm(prompt: str):
    return run_llm(prompt)

# -------------------------------
# SPEAK AFTER RENDER (FIX TTS)
# -------------------------------
def speak_after_render(text):
    st.session_state["_speak_text"] = text

# -------------------------------
# PIPELINE STATE
# -------------------------------
if "stage" not in st.session_state:
    st.session_state.stage = "screening"

if "question_count" not in st.session_state:
    st.session_state.question_count = 0

if "max_questions" not in st.session_state:
    st.session_state.max_questions = 6

if "difficulty" not in st.session_state:
    st.session_state.difficulty = "Easy"

# -------------------------------
# INTERVIEW STATE
# -------------------------------
for key, default in {
    "interview_scores": [],
    "interview_history": [],
    "emotion_flags": [],
    "replay_log": [],
    "current_question": "",
    "answer_key": 0,
    "question_start_time": time.time(),
    "intro_done": False,
    "intro_answer": ""
}.items():
    if key not in st.session_state:
        st.session_state[key] = default

speech = SpeechEngine()

# -------------------------------
# HELPERS
# -------------------------------
def structured_technical_prompt(resume, projects, difficulty, q_index):
    topics = [
        "Python fundamentals (theory)",
        "Object-Oriented Programming",
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "Coding and optimization"
    ]
    topic = topics[min(q_index, len(topics)-1)]
    return f"""
Ask ONE interview question.

Topic: {topic}
Difficulty: {difficulty}

Candidate Resume:
{resume}

Projects:
{projects}

If Coding:
- Ask to write code
- Ask time & space complexity

Ask ONLY the question.
"""

def evaluate_answer_fast(answer):
    prompt = f"""
Evaluate the interview answer.

Return JSON with:
technical_score (0-10),
communication_score (0-10),
nervousness (LOW/MODERATE/HIGH)

Answer:
{answer}
"""
    return fast_llm(prompt)

# -------------------------------
# UI CONFIG
# -------------------------------
st.set_page_config(page_title="AI-Based Candidate Screening System", layout="wide")
st.title("🤖 AI-Based Candidate Screening System")
st.caption("AI-assisted, privacy-first recruitment screening using local LLMs")

# ======================================================
# SCREENING
# ======================================================
if st.session_state.stage == "screening":

    st.header("📄 Resume")
    uploaded_resume = st.file_uploader("Upload Resume (PDF)", type=["pdf"])
    resume_text = extract_text_from_pdf(uploaded_resume) if uploaded_resume else ""

    github = st.text_input("GitHub Username")
    tenth = st.number_input("10th %", 0.0, 100.0)
    twelfth = st.number_input("12th %", 0.0, 100.0)
    cgpa = st.number_input("CGPA", 0.0, 10.0)
    projects = st.text_area("Projects (one per line)")

    if st.button("🚀 Evaluate Candidate"):
        st.session_state.screening_score = final_score(
            analyze_resume(resume_text, "")["score"],
            analyze_github(github)["score"],
            analyze_academics(tenth, twelfth, cgpa)["score"]
        )
        st.session_state.resume_text = resume_text
        st.session_state.projects = projects.split("\n")
        st.session_state.stage = "technical"
        speak_after_render("Screening completed. Interview starting.")
        st.rerun()

# ======================================================
# INTERVIEW
# ======================================================
if st.session_state.stage in ["technical", "hr"]:

    # 📷 Camera preview
    with st.sidebar:
        st.subheader("📷 Live Camera")
        cam = CameraMonitor()
        frame = cam.get_frame()
        if frame is not None:
            st.image(frame, channels="BGR")
        if st.button("Stop Camera"):
            cam.release()

    # INTRO
    if not st.session_state.intro_done:
        st.subheader("👋 Introduction")
        intro_q = "Tell me about yourself. Focus on what is NOT written in your resume."
        st.write(intro_q)
        speak_after_render(intro_q)

        intro_ans = st.text_area("Your Answer", height=150)
        if st.button("Continue"):
            st.session_state.intro_answer = intro_ans
            st.session_state.interview_history.append(f"INTRO: {intro_ans}")
            st.session_state.intro_done = True
            st.rerun()
        st.stop()

    if st.session_state.question_count >= 3:
        st.session_state.difficulty = "Medium"
    if st.session_state.question_count >= 5:
        st.session_state.difficulty = "Hard"

    st.subheader(
        "🧑‍💼 Technical Interview"
        if st.session_state.stage == "technical"
        else "🧑‍💼 HR Interview"
    )

    if not st.session_state.current_question:
        if st.session_state.stage == "technical":
            st.session_state.current_question = fast_llm(
                structured_technical_prompt(
                    st.session_state.resume_text,
                    st.session_state.projects,
                    st.session_state.difficulty,
                    st.session_state.question_count
                )
            )
        else:
            st.session_state.current_question = fast_llm(HR_PROMPT)

        speak_after_render(st.session_state.current_question)
        st.session_state.question_start_time = time.time()

    st.write("🤖 Question:")
    st.write(st.session_state.current_question)

    # 🎤 Voice input
    if st.button("🎙️ Answer by Voice"):
        answer = speech.listen(timeout=10, phrase_time_limit=25)
        st.success(f"You said: {answer}")
    else:
        answer = st.text_area(
            "Answer",
            height=150,
            key=f"answer_{st.session_state.answer_key}"
        )

    if st.button("Submit Answer"):
        eval_resp = evaluate_answer_fast(answer)

        tech = int(re.search(r"technical_score.*?(\d+)", eval_resp, re.I).group(1))
        comm = int(re.search(r"communication_score.*?(\d+)", eval_resp, re.I).group(1))
        nerv = re.search(r"(LOW|MODERATE|HIGH)", eval_resp, re.I).group(1)

        st.session_state.interview_scores.append(tech)
        st.session_state.emotion_flags.append(nerv)
        st.session_state.interview_history.append(answer)

        st.session_state.replay_log.append({
            "question": st.session_state.current_question,
            "answer": answer,
            "technical": tech,
            "communication": comm,
            "nervousness": nerv
        })

        st.session_state.current_question = ""
        st.session_state.answer_key += 1
        st.session_state.question_count += 1

        if st.session_state.question_count >= st.session_state.max_questions:
            st.session_state.stage = "hr" if st.session_state.stage == "technical" else "decision"
            st.session_state.question_count = 0

        st.rerun()

# ======================================================
# FINAL DECISION
# ======================================================
if st.session_state.stage == "decision":

    decision = final_decision(
        scores=st.session_state.interview_scores,
        emotion_flags=st.session_state.emotion_flags,
        cheating_flags=[]
    )

    st.success(f"🎯 Final Decision: {decision}")

    st.subheader("📊 Analytics")
    st.line_chart(st.session_state.interview_scores)

    summary = fast_llm(f"""
Evaluate the candidate holistically.

Intro:
{st.session_state.intro_answer}

Answers:
{st.session_state.interview_history}

Decision:
{decision}
""")

    st.subheader("📝 Final Recruitment Summary")
    st.write(summary)

    st.subheader("🎥 Recruiter Replay")
    for i, r in enumerate(st.session_state.replay_log, 1):
        with st.expander(f"Q{i}"):
            st.write(r)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 8, summary)
    pdf.output("Final_Recruitment_Report.pdf")

    with open("Final_Recruitment_Report.pdf", "rb") as f:
        st.download_button(
            "⬇️ Download Final Recruitment Report",
            f,
            file_name="Final_Recruitment_Report.pdf"
        )

    speak_after_render("Interview completed. Final decision generated.")

# -------------------------------
# 🔊 SPEAK AFTER RENDER EXECUTOR
# -------------------------------
if "_speak_text" in st.session_state:
    speech.speak(st.session_state["_speak_text"])
    del st.session_state["_speak_text"]
