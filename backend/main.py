from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

from analyzers.academic_analyzer import analyze_academics
from analyzers.github_analyzer import analyze_github
from analyzers.project_analyzer import analyze_projects
from analyzers.resume_analyzer import analyze_resume
from scoring.score_engine import final_score, score_breakdown

app = FastAPI(
    title="Candidate Intelligence API",
    version="1.0.0",
    description="Job-aware candidate screening API for the AI Candidate Intelligence Platform.",
)


class CandidateInput(BaseModel):
    resume_text: str = Field(default="", max_length=100_000)
    github_username: str = Field(default="", max_length=100)
    tenth: float = Field(default=0, ge=0, le=100)
    twelfth: float = Field(default=0, ge=0, le=100)
    cgpa: float = Field(default=0, ge=0, le=10)
    projects: list[str] = Field(default_factory=list, max_length=50)
    job_description: str = Field(default="", max_length=30_000)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "candidate-intelligence-api"}


@app.post("/api/v1/screen")
def screen_candidate(candidate: CandidateInput) -> dict[str, Any]:
    resume = analyze_resume(candidate.resume_text, candidate.job_description)
    github = analyze_github(candidate.github_username) if candidate.github_username else {
        "score": 0.0,
        "summary": "No GitHub username provided",
    }
    academics = analyze_academics(candidate.tenth, candidate.twelfth, candidate.cgpa)
    projects = analyze_projects(candidate.projects, candidate.job_description)

    score = final_score(resume["score"], github["score"], academics["score"], projects["score"])
    return {
        "screening_score": score,
        "breakdown": score_breakdown(
            resume["score"], github["score"], academics["score"], projects["score"]
        ),
        "resume": resume,
        "github": github,
        "academics": academics,
        "projects": projects,
        "human_review_required": True,
    }
