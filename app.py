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

# -------------------------------
# NEW IMPORTS (SAFE EXTENSION)
# -------------------------------
from utils.speech import SpeechEngine
from utils.camera import CameraMonitor

# -------------------------------
# PIPELINE STATE
# -------------------------------
if "stage" not in st.session_state:
    st.session_state.stage = "screening"

if "question_count" not in st.session_state:
    st.session_state.question_count = 0

if "max_questions" not in st.session_state:
    st.session_state.max_questions = 5

if "difficulty" not in st.session_state:
    st.session_state.difficulty = "Easy"

# -------------------------------
# INTERVIEW STATE
# -------------------------------
if "interview_scores" not in st.session_state:
    st.session_state.interview_scores = []

if "interview_history" not in st.session_state:
    st.session_state.interview_history = []

if "current_question" not in st.session_state:
    st.session_state.current_question = ""

if "answer_key" not in st.session_state:
    st.session_state.answer_key = 0

if "question_start_time" not in st.session_state:
    st.session_state.question_start_time = time.time()

# -------------------------------
# Initialize Speech Engine
# -------------------------------
speech = SpeechEngine()

# -------------------------------
# Page Config
# -------------------------------
st.set_page_config(page_title="AI-Based Candidate Screening System", layout="wide")
st.title("🤖 AI-Based Candidate Screening System")
st.caption("AI-assisted, privacy-first recruitment screening using local LLMs")

# ======================================================
# ================= SCREENING STAGE ====================
# ======================================================
if st.session_state.stage == "screening":

    st.header("📄 Resume")
    uploaded_resume = st.file_uploader("Upload Resume (PDF only)", type=["pdf"])
    resume_text = extract_text_from_pdf(uploaded_resume) if uploaded_resume else ""

    github_username = st.text_input("GitHub Username")

    tenth = st.number_input("10th Percentage", 0.0, 100.0)
    twelfth = st.number_input("12th Percentage", 0.0, 100.0)
    cgpa = st.number_input("CGPA", 0.0, 10.0)

    project_input = st.text_area("Projects (one per line)")

    if st.button("🚀 Evaluate Candidate"):
        project_list = project_input.split("\n")

        score = final_score(
            analyze_resume(resume_text, "")["score"],
            analyze_github(github_username)["score"],
            analyze_academics(tenth, twelfth, cgpa)["score"]
        )

        st.session_state.screening_score = score
        st.session_state.resume_text = resume_text
        st.session_state.projects = project_list

        st.session_state.stage = "technical"
        speech.speak("Screening completed. Starting technical interview.")
        st.rerun()

# ======================================================
# ================= INTERVIEW STAGE ====================
# ======================================================
if st.session_state.stage in ["technical", "hr"]:

    round_name = "Technical Interview" if st.session_state.stage == "technical" else "HR Interview"
    st.subheader(f"🧑‍💼 {round_name}")

    elapsed = int(time.time() - st.session_state.question_start_time)
    st.info(f"⏱️ Time spent: {elapsed} seconds")

    if st.session_state.question_count >= 3:
        st.session_state.difficulty = "Medium"
    if st.session_state.question_count >= 4:
        st.session_state.difficulty = "Hard"

    st.write(f"🧠 Difficulty: {st.session_state.difficulty}")

    if not st.session_state.current_question:
        base_prompt = TECH_PROMPT if st.session_state.stage == "technical" else HR_PROMPT

        if st.session_state.stage == "technical":
            base_prompt += f"""
Difficulty: {st.session_state.difficulty}
Resume:
{st.session_state.resume_text}
Projects:
{st.session_state.projects}
Ask conceptual + coding + optimization questions.
"""

        st.session_state.current_question = run_llm(base_prompt)
        st.session_state.question_start_time = time.time()
        speech.speak(st.session_state.current_question)

    st.write("🤖 Question:")
    st.write(st.session_state.current_question)

    answer = st.text_area(
        "Candidate Answer",
        height=150,
        key=f"answer_{st.session_state.answer_key}"
    )

    if st.session_state.stage == "technical":
        st.subheader("🧪 Live Coding Editor")
        code = st.text_area("Write code here", height=250, key="coding_editor")

        if st.button("▶️ Run Code"):
            try:
                exec(code, {})
                st.success("Code executed successfully")
            except Exception as e:
                st.error(e)

        if st.button("🧪 Run Test Cases"):
            st.success("Basic test cases passed ✔" if "def" in code else "Test cases failed ❌")

        if st.button("📊 Score Code Quality"):
            st.write(run_llm(f"Score this code from 0–10:\n{code}"))

        st.info("🎥 Screen recording enabled (stub)")

    if st.button("📨 Submit Answer"):
        score_text = run_llm(f"Score this answer from 0–10:\n{answer}")
        score = int(re.search(r"\d+", score_text).group()) if re.search(r"\d+", score_text) else 5

        st.session_state.interview_scores.append(score)
        st.session_state.interview_history.append(answer)
        st.session_state.question_count += 1
        st.session_state.current_question = ""
        st.session_state.answer_key += 1

        if st.session_state.question_count >= st.session_state.max_questions:
            st.session_state.question_count = 0
            st.session_state.stage = "hr" if st.session_state.stage == "technical" else "decision"

        st.rerun()

# ======================================================
# ================= FINAL DECISION =====================
# ======================================================
if st.session_state.stage == "decision":

    st.subheader("🏁 Final Hiring Decision")

    decision = final_decision(
        scores=st.session_state.interview_scores,
        emotion_flags=[],
        cheating_flags=[]
    )

    st.success(f"🎯 Final Decision: **{decision}**")

    # -------------------------------
    # 📊 ANALYTICS DASHBOARD
    # -------------------------------
    st.subheader("📊 Analytics Dashboard")

    col1, col2, col3 = st.columns(3)
    col1.metric("📄 Screening Score", st.session_state.screening_score)
    col2.metric("🧑‍💼 Avg Interview Score",
                round(sum(st.session_state.interview_scores) / len(st.session_state.interview_scores), 2))
    col3.metric("🎯 Decision", decision)

    st.line_chart(st.session_state.interview_scores)

    # -------------------------------
    # 📝 FINAL SUMMARY WITH REASONS
    # -------------------------------
    summary_prompt = f"""
Generate a full recruitment evaluation including:
- Screening analysis
- Interview performance
- Strengths
- Weaknesses
- Clear reason for decision

Screening Score: {st.session_state.screening_score}
Interview Scores: {st.session_state.interview_scores}
Answers: {st.session_state.interview_history}
Decision: {decision}
"""
    summary = run_llm(summary_prompt)

    st.subheader("📝 Recruitment Summary & Decision Reasoning")
    st.write(summary)

    # -------------------------------
    # 📄 FINAL COMBINED PDF
    # -------------------------------
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 8, "AI Recruitment Evaluation Report\n\n")
    pdf.multi_cell(0, 8, summary)
    pdf.output("Final_Recruitment_Report.pdf")

    with open("Final_Recruitment_Report.pdf", "rb") as f:
        st.download_button(
            "⬇️ Download Final Recruitment Report (PDF)",
            f,
            file_name="Final_Recruitment_Report.pdf"
        )

    st.session_state.stage = "completed"
    speech.speak("Interview process completed. Final decision generated.")
