import streamlit as st
import re

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
# NEW: Interview + Proctoring State
# -------------------------------
if "interview_scores" not in st.session_state:
    st.session_state.interview_scores = []

if "interview_history" not in st.session_state:
    st.session_state.interview_history = []

if "emotion_flags" not in st.session_state:
    st.session_state.emotion_flags = []

if "cheating_flags" not in st.session_state:
    st.session_state.cheating_flags = []

# ✅ NEW (INTERVIEW FLOW STATE)
if "interview_started" not in st.session_state:
    st.session_state.interview_started = False

if "current_question" not in st.session_state:
    st.session_state.current_question = ""

# -------------------------------
# Initialize Speech Engine
# -------------------------------
speech = SpeechEngine()

# -------------------------------
# Utility: GitHub Username Normalizer
# -------------------------------
def normalize_github_username(input_text: str) -> str:
    if not input_text:
        return ""
    input_text = input_text.strip()
    match = re.search(r"github\.com/([A-Za-z0-9_-]+)", input_text)
    return match.group(1) if match else input_text

# -------------------------------
# Page Config
# -------------------------------
st.set_page_config(
    page_title="AI-Based Candidate Screening System",
    layout="wide"
)

st.title("🤖 AI-Based Candidate Screening System")
st.caption("AI-assisted, privacy-first recruitment screening using local LLMs")

# -------------------------------
# MODE SWITCH
# -------------------------------
mode = st.radio(
    "Select Mode",
    ["Candidate Screening", "AI Interview"],
    horizontal=True
)

# ======================================================
# ================= SCREENING MODE =====================
# ======================================================
if mode == "Candidate Screening":

    @st.cache_data(ttl=3600)
    def cached_github_analysis(username: str):
        return analyze_github(username)

    st.header("📄 Resume")

    uploaded_resume = st.file_uploader("Upload Resume (PDF only)", type=["pdf"])
    resume_text = ""

    if uploaded_resume:
        resume_text = extract_text_from_pdf(uploaded_resume)
        st.success("Resume uploaded successfully")

    resume_text_manual = st.text_area("Or paste resume text manually", height=200)
    if resume_text_manual.strip():
        resume_text = resume_text_manual

    st.header("👤 Candidate Information")

    raw_github_input = st.text_input("GitHub Username or Profile URL")
    github_username = normalize_github_username(raw_github_input)

    st.subheader("🎓 Academic Details")
    tenth = st.number_input("10th Percentage", 0.0, 100.0)
    twelfth = st.number_input("12th Percentage", 0.0, 100.0)
    cgpa = st.number_input("CGPA", 0.0, 10.0)

    st.subheader("🧩 Projects")
    project_input = st.text_area("Describe projects (one per line)", height=150)

    if st.button("🚀 Evaluate Candidate"):

        resume_result = analyze_resume(resume_text, "")
        github_result = cached_github_analysis(github_username)
        academic_result = analyze_academics(tenth, twelfth, cgpa)

        project_list = [p.strip() for p in project_input.split("\n") if p.strip()]
        project_result = analyze_projects(project_list)

        score = final_score(
            resume_result["score"],
            github_result["score"],
            academic_result["score"]
        )

        st.session_state.screening_score = score

        st.metric("⭐ Overall Fit Score", score)

        prompt = candidate_prompt({
            "resume": resume_result,
            "github": github_result,
            "academics": academic_result,
            "projects": project_result
        })

        recommendation = run_llm(prompt)
        st.subheader("🤖 AI Hiring Recommendation")
        st.write(recommendation)
        speech.speak("Candidate screening completed.")

# ======================================================
# ================= INTERVIEW MODE =====================
# ======================================================
if mode == "AI Interview":

    if "screening_score" not in st.session_state:
        st.warning("Please complete Candidate Screening first.")
        st.stop()

    st.subheader("🧑‍💼 AI Interview")
    st.info(f"Screening Score: {st.session_state.screening_score}")

    round_type = st.selectbox(
        "Interview Round",
        ["HR Round", "Technical Round"]
    )

    # -------------------------------
    # START INTERVIEW (ASK FIRST QUESTION)
    # -------------------------------
    if not st.session_state.interview_started:
        base_prompt = HR_PROMPT if round_type == "HR Round" else TECH_PROMPT
        start_prompt = base_prompt + "\nStart the interview by asking the first question only."

        first_question = run_llm(start_prompt)

        st.session_state.interview_started = True
        st.session_state.current_question = first_question
        st.session_state.interview_history.append(first_question)

        st.subheader("🤖 Interviewer Question")
        st.write(first_question)
        speech.speak(first_question)

    # -------------------------------
    # SHOW CURRENT QUESTION
    # -------------------------------
    if st.session_state.current_question:
        st.subheader("🤖 Current Question")
        st.write(st.session_state.current_question)

    answer = st.text_area("Candidate Answer", height=150)

    col1, col2, col3 = st.columns(3)

    # -------------------------------
    # TEXT ANSWER
    # -------------------------------
    with col1:
        if st.button("📨 Submit Answer"):
            prompt = HR_PROMPT if round_type == "HR Round" else TECH_PROMPT
            response = run_llm(prompt + "\nCandidate Answer:\n" + answer)

            st.session_state.interview_history.append(answer)
            st.session_state.current_question = response

            score_prompt = f"""
            Score this answer from 0 to 10 and give 1-line feedback:
            {answer}
            """
            score_response = run_llm(score_prompt)

            try:
                score_value = int(re.search(r"\d+", score_response).group())
            except:
                score_value = 5

            st.session_state.interview_scores.append(score_value)

            st.subheader("🤖 Interviewer Response")
            st.write(response)
            speech.speak(response)

            st.subheader("🧪 Interview Evaluation")
            st.write(score_response)

    # -------------------------------
    # VOICE ANSWER
    # -------------------------------
    with col2:
        if st.button("🎤 Answer by Voice"):
            voice_answer = speech.listen()
            if voice_answer:
                st.write("🗣️ You said:", voice_answer)

                prompt = HR_PROMPT if round_type == "HR Round" else TECH_PROMPT
                response = run_llm(prompt + "\nCandidate Answer:\n" + voice_answer)

                st.session_state.interview_history.append(voice_answer)
                st.session_state.interview_scores.append(6)
                st.session_state.current_question = response

                st.write(response)
                speech.speak(response)

    # -------------------------------
    # PROCTORING
    # -------------------------------
    with col3:
        if st.button("👁️ Run Proctoring"):
            cam = CameraMonitor()
            flags = cam.run_proctoring(duration=10)
            cam.release()

            st.session_state.cheating_flags.extend(flags)

            if flags:
                st.warning("Proctoring Flags Detected")
                st.write(flags)
            else:
                st.success("No suspicious activity detected")

    # -------------------------------
    # FINAL DECISION
    # -------------------------------
    if st.button("🏁 Final Hiring Decision"):

        decision = final_decision(
            scores=st.session_state.interview_scores,
            emotion_flags=st.session_state.emotion_flags,
            cheating_flags=st.session_state.cheating_flags
        )

        st.success(f"🎯 Final Decision: **{decision}**")
        speech.speak(f"The final hiring decision is {decision}.")