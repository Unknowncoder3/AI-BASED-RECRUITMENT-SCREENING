from typing import Dict, List

CORE_KNOWLEDGE_KEYWORDS = {
    "machine_learning": ["machine learning", "classification", "regression", "scikit", "tensorflow", "pytorch"],
    "data_structures": ["array", "linked list", "stack", "queue", "tree", "graph", "hash", "algorithm"],
    "web_development": ["react", "flask", "fastapi", "django", "frontend", "backend", "api", "rest"],
    "databases": ["sql", "mysql", "postgres", "mongodb", "database", "redis"],
    "ai_llm": ["llm", "langchain", "ollama", "openai", "embedding", "faiss", "vector", "rag"],
    "data_analytics": ["pandas", "numpy", "power bi", "tableau", "visualization", "analytics"],
}

REAL_WORLD_TERMS = ["production", "scalable", "dashboard", "automation", "deployment", "application", "api", "real-world"]


def analyze_projects(project_descriptions: List[str], job_desc: str = "") -> Dict:
    """Score project breadth, real-world signals, and optional job relevance."""
    projects = [p.strip() for p in project_descriptions if p and p.strip()]
    if not projects:
        return {"score": 0.0, "strengths": [], "weaknesses": ["No projects provided"], "matched_skills": [], "summary": "No projects available for evaluation"}

    all_text = "\n".join(projects).lower()
    core_areas = {area for area, keywords in CORE_KNOWLEDGE_KEYWORDS.items() if any(k in all_text for k in keywords)}
    real_world_projects = sum(any(term in p.lower() for term in REAL_WORLD_TERMS) for p in projects)

    job_terms = {term for term in CORE_KNOWLEDGE_KEYWORDS if term.replace("_", " ") in job_desc.lower()}
    matched_job_areas = core_areas & job_terms

    breadth_score = min(len(core_areas) / 6 * 45, 45)
    real_world_score = min(real_world_projects / max(len(projects), 1) * 25, 25)
    relevance_score = (len(matched_job_areas) / max(len(job_terms), 1) * 30) if job_terms else min(len(projects) * 10, 30)
    total = round(breadth_score + real_world_score + relevance_score, 2)

    strengths = [f"Covers {len(core_areas)} technical areas"]
    if real_world_projects:
        strengths.append(f"{real_world_projects} project(s) show real-world/production signals")
    if matched_job_areas:
        strengths.append(f"Job-relevant areas: {', '.join(sorted(matched_job_areas))}")

    weaknesses = []
    if not real_world_projects:
        weaknesses.append("Projects do not clearly show deployment or real-world usage")
    if job_terms and not matched_job_areas:
        weaknesses.append("Projects have limited overlap with the target role")

    return {
        "score": total,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "matched_skills": sorted(matched_job_areas),
        "summary": f"Analyzed {len(projects)} projects across {len(core_areas)} technical areas",
    }
