from __future__ import annotations

import re
from pathlib import Path

import streamlit as st
from fpdf import FPDF

from analyzers.academic_analyzer import analyze_academics
from analyzers.github_analyzer import analyze_github
from analyzers.project_analyzer import analyze_projects
from analyzers.resume_analyzer import analyze_resume
from llm.ollama_client import run_llm, run_llm_json
from scoring.decision_engine import final_decision
from scoring.score_engine import final_score, score_breakdown
from utils.pdf_parser import extract_text_from_pdf


st.set_page_config(page_title="Candidate Intelligence Platform", page_icon="🤖", layout="wide")

DEFAULTS = {
    "stage": "screening",
    "screening_score": 0.0,
    "score_breakdown": {},
    "resume_result": {},
    "project_result": {},
    "github_result": {},
    "interview_scores": [],
    "interview_history": [],
    "question_count": 0,
    "current_question": "",
    "recommendation": "",
}
for key, value in DEFAULTS.items():
    st.session_state.setdefault(key, value)


def ask_question(stage: str, resume: str, projects: list[str], job_desc: str, history: list[str], difficulty: str) -> str:
    prompt = f"""You are a professional {stage} interviewer.
Create exactly ONE interview question. Do not add numbering or explanation.
Difficulty: {difficulty}
Target job:
{job_desc[:5000]}
Candidate resume:
{resume[:6000]}
Projects:
{projects[:10]}
Previous questions/answers:
{history[-6:]}
Avoid repeating previous questions. Keep the question relevant to the target role."""
    result = run_llm(prompt)
    return result.strip() or "Describe a challenging technical problem you solved and how you evaluated your solution."


def evaluate_answer(answer: str, question: str, job_desc: str) -> dict:
    prompt = f"""Evaluate this interview answer for a recruitment screening workflow.
Return ONLY valid JSON with integer fields: technical_score (0-10), communication_score (0-10), and a short evidence string.
Do not score personality, accent, appearance, age, gender, ethnicity, disability, or other protected characteristics.
Question: {question}
Job description: {job_desc[:3000]}
Answer: {answer[:5000]}"""
    result = run_llm_json(prompt)
    try:
        return {
            "technical_score": max(0, min(10, int(result.get("technical_score", 5)))),
            "communication_score": max(0, min(10, int(result.get("communication_score", 5)))),
            "evidence": str(result.get("evidence", "No structured evidence returned."))[:500],
        }
    except (TypeError, ValueError):
        return {"technical_score": 5, "communication_score": 5, "evidence": "Fallback score used because the model response was invalid."}


def generate_report() -> str:
    summary_prompt = f"""Write a concise recruiter-facing candidate evaluation summary.
Recommendation: {st.session_state.recommendation}
Screening score: {st.session_state.screening_score}/100
Score breakdown: {st.session_state.score_breakdown}
Resume findings: {st.session_state.resume_result}
Project findings: {st.session_state.project_result}
GitHub findings: {st.session_state.github_result}
Interview history: {st.session_state.interview_history}
Job description: {st.session_state.get('job_desc', '')[:4000]}
Use evidence-based language. State that the result is an AI-assisted recommendation requiring human review."""
    return run_llm(summary_prompt) or "AI-assisted evaluation completed. Human review is required before any employment decision."


st.title("🤖 Candidate Intelligence Platform")
st.caption("AI-assisted screening • job-relevant matching • adaptive interviews • explainable recommendations")

if st.session_state.stage == "screening":
    st.header("1. Candidate Screening")
    col1, col2 = st.columns(2)
    with col1:
        uploaded_resume = st.file_uploader("Candidate resume (PDF)", type=["pdf"])
        github = st.text_input("GitHub username", placeholder="octocat")
        tenth = st.number_input("10th percentage", 0.0, 100.0, 75.0)
        twelfth = st.number_input("12th percentage", 0.0, 100.0, 75.0)
        cgpa = st.number_input("CGPA", 0.0, 10.0, 7.5)
    with col2:
        job_desc = st.text_area("Target job description", height=180, placeholder="Paste the job description here for role-specific matching...")
        projects_text = st.text_area("Projects", height=150, placeholder="One project per line")

    if st.button("🚀 Evaluate Candidate", type="primary", use_container_width=True):
        if not uploaded_resume:
            st.error("Upload a resume before evaluating the candidate.")
            st.stop()
        resume_text = extract_text_from_pdf(uploaded_resume) or ""
        projects = [p.strip() for p in projects_text.splitlines() if p.strip()]

        resume_result = analyze_resume(resume_text, job_desc)
        github_result = analyze_github(github) if github else {"score": 0.0, "summary": "No GitHub username provided"}
        academic_result = analyze_academics(tenth, twelfth, cgpa)
        project_result = analyze_projects(projects, job_desc)
        total = final_score(resume_result["score"], github_result["score"], academic_result["score"], project_result["score"])

        st.session_state.update({
            "stage": "interview" if total >= 60 else "decision",
            "screening_score": total,
            "score_breakdown": score_breakdown(resume_result["score"], github_result["score"], academic_result["score"], project_result["score"]),
            "resume_result": resume_result,
            "project_result": project_result,
            "github_result": github_result,
            "job_desc": job_desc,
            "resume_text": resume_text,
            "projects": projects,
            "interview_scores": [],
            "interview_history": [],
            "question_count": 0,
            "current_question": "",
        })
        st.rerun()

elif st.session_state.stage == "interview":
    st.header("2. Adaptive Interview")
    score = st.session_state.screening_score
    st.metric("Pre-interview screening score", f"{score:.1f}/100")

    difficulty = "Easy" if st.session_state.question_count < 2 else "Medium" if st.session_state.question_count < 4 else "Hard"
    st.caption(f"Question {st.session_state.question_count + 1} of 6 • Difficulty: {difficulty}")

    if not st.session_state.current_question:
        st.session_state.current_question = ask_question(
            "technical", st.session_state.resume_text, st.session_state.projects,
            st.session_state.job_desc, st.session_state.interview_history, difficulty
        )

    st.info(st.session_state.current_question)
    answer = st.text_area("Candidate answer", height=180, key=f"answer_{st.session_state.question_count}")

    if st.button("Submit answer", type="primary"):
        if not answer.strip():
            st.warning("Please provide an answer.")
            st.stop()
        evaluation = evaluate_answer(answer, st.session_state.current_question, st.session_state.job_desc)
        st.session_state.interview_scores.append(evaluation["technical_score"])
        st.session_state.interview_history.append({"question": st.session_state.current_question, "answer": answer, **evaluation})
        st.session_state.question_count += 1
        st.session_state.current_question = ""
        if st.session_state.question_count >= 6:
            st.session_state.stage = "decision"
            st.session_state.recommendation = final_decision(st.session_state.screening_score, st.session_state.interview_scores)
        st.rerun()

elif st.session_state.stage == "decision":
    st.header("3. Explainable Candidate Recommendation")
    recommendation = st.session_state.recommendation or final_decision(st.session_state.screening_score, st.session_state.interview_scores)
    st.session_state.recommendation = recommendation

    c1, c2, c3 = st.columns(3)
    c1.metric("Screening", f"{st.session_state.screening_score:.1f}/100")
    interview_avg = (sum(st.session_state.interview_scores) / len(st.session_state.interview_scores) * 10) if st.session_state.interview_scores else 0
    c2.metric("Interview", f"{interview_avg:.1f}/100")
    c3.metric("Recommendation", recommendation)

    st.subheader("Score breakdown")
    breakdown = st.session_state.score_breakdown
    st.bar_chart({k.title(): breakdown.get(k, 0) for k in ["resume", "github", "academics", "projects"]})

    r1, r2 = st.columns(2)
    with r1:
        st.subheader("Resume / JD match")
        st.write(st.session_state.resume_result.get("summary", ""))
        if st.session_state.resume_result.get("missing_skills"):
            st.warning("Missing: " + ", ".join(st.session_state.resume_result["missing_skills"]))
    with r2:
        st.subheader("Project relevance")
        st.write(st.session_state.project_result.get("summary", ""))
        for item in st.session_state.project_result.get("strengths", []):
            st.write("✓ " + item)

    st.subheader("Interview evidence")
    for index, item in enumerate(st.session_state.interview_history, 1):
        with st.expander(f"Question {index} • Technical {item['technical_score']}/10"):
            st.write("**Question:**", item["question"])
            st.write("**Answer:**", item["answer"])
            st.write("**Evidence:**", item["evidence"])

    st.info("This is an AI-assisted recommendation, not an autonomous hiring decision. Human review is required.")

    if st.button("Generate recruiter report", type="primary"):
        report = generate_report()
        st.session_state["report"] = report
        st.rerun()

    if st.session_state.get("report"):
        st.subheader("Recruiter report")
        st.write(st.session_state["report"])
        pdf = FPDF()
        pdf.add_page()
        font_path = Path("assets/DejaVuSans.ttf")
        if font_path.exists():
            pdf.add_font("DejaVu", "", str(font_path), uni=True)
            pdf.set_font("DejaVu", size=11)
        else:
            pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 7, "AI-Assisted Candidate Evaluation Report\n\n")
        pdf.multi_cell(0, 7, st.session_state["report"])
        output = pdf.output(dest="S").encode("latin-1", "replace")
        st.download_button("⬇️ Download report", output, "candidate_evaluation_report.pdf", "application/pdf")
