import streamlit as st
import re
import time
from fpdf import FPDF

from analyzers.resume_analyzer import analyze_resume
from analyzers.github_analyzer import analyze_github
from analyzers.academic_analyzer import analyze_academics

from scoring.score_engine import final_score
from scoring.decision_engine import final_decision

from llm.ollama_client import run_llm
from llm.prompts import HR_PROMPT, TECH_PROMPT

from utils.pdf_parser import extract_text_from_pdf
from utils.speech import SpeechEngine
from utils.camera import CameraMonitor

# -------------------------------
# ⚡ FAST LLM
# -------------------------------
@st.cache_data(show_spinner=False)
def fast_llm(prompt: str):
    return run_llm(prompt)

# -------------------------------
# SPEAK AFTER RENDER
# -------------------------------
def speak_after_render(text):
    st.session_state["_speak_text"] = text

# -------------------------------
# PIPELINE STATE
# -------------------------------
defaults = {
    "stage": "screening",
    "question_count": 0,
    "max_questions": 6,
    "difficulty": "Easy",
    "announcement_done": False,
    "screening_failed": False,
    "interview_scores": [],
    "interview_history": [],
    "emotion_flags": [],
    "replay_log": [],
    "current_question": "",
    "answer_key": 0,
    "intro_done": False,
    "intro_answer": "",
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

speech = SpeechEngine()

# -------------------------------
# HELPERS
# -------------------------------
def structured_technical_prompt(resume, projects, difficulty, q_index):
    topics = [
        "Python fundamentals",
        "OOP concepts",
        "DBMS",
        "Operating Systems",
        "Computer Networks",
        "Coding & Optimization"
    ]
    topic = topics[min(q_index, len(topics) - 1)]
    return f"""
Ask ONE interview question.

Topic: {topic}
Difficulty: {difficulty}

Resume:
{resume}

Projects:
{projects}

Ask ONLY the question.
"""

def next_hr_question(history, q_index):
    return fast_llm(f"""
You are an HR interviewer.

Previous Q&A:
{history}

Rules:
- Do NOT repeat questions
- Ask a NEW behavioral question
- Focus on teamwork, ethics, leadership, conflict

HR Question {q_index + 1}.
Ask ONLY ONE question.
""")

def evaluate_answer(answer):
    return fast_llm(f"""
Evaluate interview answer.

Return:
technical_score (0-10)
communication_score (0-10)
nervousness (LOW/MODERATE/HIGH)

Answer:
{answer}
""")

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
        score = final_score(
            analyze_resume(resume_text, "")["score"],
            analyze_github(github)["score"],
            analyze_academics(tenth, twelfth, cgpa)["score"]
        )

        st.session_state.screening_score = score
        st.session_state.resume_text = resume_text
        st.session_state.projects = projects.split("\n")

        if score < 60:
            st.session_state.screening_failed = True
            st.session_state.stage = "decision"
            speak_after_render("Screening failed. You will not proceed to interviews.")
        else:
            st.session_state.stage = "hr"
            st.session_state.announcement_done = False
            speak_after_render("Screening cleared. HR interview will begin.")

        st.rerun()

# ======================================================
# INTERVIEW
# ======================================================
if st.session_state.stage in ["hr", "technical"]:

    if not st.session_state.announcement_done:

        name = "HR" if st.session_state.stage == "hr" else "Technical"
        st.subheader("📢 Interview Announcement")
        st.info(f"Your {name} interview will begin now.")
        speak_after_render(f"Your {name} interview will begin now.")
        st.session_state.announcement_done = True
        st.rerun()


    with st.sidebar:
        st.subheader("📷 Live Camera")
        try:
            cam = CameraMonitor()
            frame = cam.get_frame()
            if frame is not None:
                st.image(frame, channels="BGR")
        except:
            st.warning("Camera unavailable")

    if not st.session_state.intro_done:
        q = "Tell me about yourself. Focus on what is not written in your resume."
        st.write(q)
        speak_after_render(q)
        ans = st.text_area("Your Answer", height=150)
        if st.button("Continue"):
            st.session_state.intro_done = True
            st.session_state.intro_answer = ans
            st.session_state.interview_history.append(f"INTRO: {ans}")
            st.rerun()
        st.stop()

    if st.session_state.question_count >= 3:
        st.session_state.difficulty = "Medium"
    if st.session_state.question_count >= 5:
        st.session_state.difficulty = "Hard"

    st.subheader("🧑‍💼 HR Interview" if st.session_state.stage == "hr" else "🧑‍💼 Technical Interview")

    if not st.session_state.current_question:
        if st.session_state.stage == "hr":
            q = next_hr_question(st.session_state.interview_history, st.session_state.question_count)
        else:
            q = fast_llm(
                structured_technical_prompt(
                    st.session_state.resume_text,
                    st.session_state.projects,
                    st.session_state.difficulty,
                    st.session_state.question_count
                )
            )
        st.session_state.current_question = q
        speak_after_render(q)

    st.write("🤖 Question:")
    st.write(st.session_state.current_question)

    if st.button("🎙️ Answer by Voice"):
        answer = speech.listen(timeout=15, phrase_time_limit=40)
        st.success(answer)
    else:
        answer = st.text_area("Answer", key=f"answer_{st.session_state.answer_key}", height=150)

    if st.button("Submit Answer"):
        resp = evaluate_answer(answer)

        def safe(pattern, default):
            m = re.search(pattern, resp, re.I)
            return int(m.group(1)) if m else default

        tech = safe(r"technical_score.*?(\d+)", 5)
        comm = safe(r"communication_score.*?(\d+)", 5)
        nerv = re.search(r"(LOW|MODERATE|HIGH)", resp, re.I)
        nerv = nerv.group(1) if nerv else "MODERATE"

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
            st.session_state.question_count = 0
            st.session_state.stage = "technical" if st.session_state.stage == "hr" else "decision"
            st.session_state.announcement_done = False

        st.rerun()

# ======================================================
# FINAL DECISION
# ======================================================
if st.session_state.stage == "decision":

    if st.session_state.screening_failed:
        st.error("❌ Candidate failed screening round.")
        st.stop()

    if not st.session_state.interview_scores:
        st.error("No interview data available.")
        st.stop()

    decision = final_decision(
        scores=st.session_state.interview_scores,
        emotion_flags=st.session_state.emotion_flags,
        cheating_flags=[]
    )

    st.success(f"🎯 Final Decision: {decision}")
    st.line_chart(st.session_state.interview_scores)

    summary = fast_llm(f"""
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

    # -------- PDF (UNICODE SAFE) --------
    pdf = FPDF()
    pdf.add_page()
    pdf.add_font("DejaVu", "", "assets/DejaVuSans.ttf", uni=True)
    pdf.set_font("DejaVu", size=12)
    pdf.multi_cell(0, 8, "AI Recruitment Evaluation Report\n\n")
    pdf.multi_cell(0, 8, summary)
    pdf.output("Final_Recruitment_Report.pdf")

    with open("Final_Recruitment_Report.pdf", "rb") as f:
        st.download_button(
            "⬇️ Download Final Recruitment Report",
            f,
            file_name="Final_Recruitment_Report.pdf",
            mime="application/pdf"
        )

    speak_after_render("Interview completed. Final decision generated.")

# -------------------------------
# 🔊 EXECUTE SPEECH
# -------------------------------
if "_speak_text" in st.session_state:
    speech.speak(st.session_state["_speak_text"])
    del st.session_state["_speak_text"]
