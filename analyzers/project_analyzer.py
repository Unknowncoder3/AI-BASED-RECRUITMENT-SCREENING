from typing import Dict, List

CORE_KNOWLEDGE_KEYWORDS = {
    "machine_learning": ["machine learning", "classification", "regression", "scikit", "tensorflow", "pytorch", "recommender", "recommendation", "candidate screening", "recruitment screening"],
    "data_structures": ["array", "linked list", "stack", "queue", "tree", "graph", "hash", "algorithm"],
    "web_development": ["react", "flask", "fastapi", "django", "frontend", "backend", "api", "rest", "web app", "website", "planner"],
    "databases": ["sql", "mysql", "postgres", "mongodb", "database", "redis", "data storage"],
    "ai_llm": ["llm", "langchain", "ollama", "openai", "embedding", "faiss", "vector", "rag", "artificial intelligence", "ai-based", "ai based"],
    "data_analytics": ["pandas", "numpy", "power bi", "tableau", "visualization", "analytics", "dashboard", "data analysis"],
}

# Common project-title signals. These make title-only project entries useful instead of
# scoring them as zero when a recruiter provides project names rather than full descriptions.
PROJECT_TITLE_SIGNALS = {
    "travel planner": ["web_development", "data_analytics"],
    "recruitment screening": ["machine_learning", "ai_llm", "web_development", "data_analytics"],
    "candidate screening": ["machine_learning", "ai_llm", "web_development"],
    "book recommendation": ["machine_learning", "data_analytics"],
    "movie recommendation": ["machine_learning", "data_analytics"],
    "recommendation system": ["machine_learning", "data_analytics"],
}

REAL_WORLD_TERMS = ["production", "scalable", "dashboard", "automation", "deployment", "application", "api", "real-world", "deployed", "netlify", "render"]


def _areas_from_text(text: str) -> set[str]:
    areas = {area for area, keywords in CORE_KNOWLEDGE_KEYWORDS.items() if any(k in text for k in keywords)}
    for signal, signal_areas in PROJECT_TITLE_SIGNALS.items():
        if signal in text:
            areas.update(signal_areas)
    return areas


def analyze_projects(project_descriptions: List[str], job_desc: str = "") -> Dict:
    """Score project breadth, real-world signals, and optional job relevance.

    Accepts either detailed descriptions or project titles. Title aliases are intentionally
    conservative and explainable so a project named "Book Recommendation System" still
    receives ML evidence without inventing implementation details.
    """
    projects = [p.strip() for p in project_descriptions if p and p.strip()]
    if not projects:
        return {"score": 0.0, "strengths": [], "weaknesses": ["No projects provided"], "matched_skills": [], "summary": "No projects available for evaluation"}

    all_text = "\n".join(projects).lower()
    core_areas = _areas_from_text(all_text)
    real_world_projects = sum(any(term in p.lower() for term in REAL_WORLD_TERMS) for p in projects)

    job_lower = job_desc.lower()
    job_terms = {area for area, keywords in CORE_KNOWLEDGE_KEYWORDS.items() if any(k in job_lower for k in keywords)}
    matched_job_areas = core_areas & job_terms

    breadth_score = min(len(core_areas) / 6 * 45, 45)
    real_world_score = min(real_world_projects / max(len(projects), 1) * 25, 25)
    relevance_score = (len(matched_job_areas) / max(len(job_terms), 1) * 30) if job_terms else min(len(projects) * 10, 30)
    total = round(min(breadth_score + real_world_score + relevance_score, 100), 2)

    strengths = [f"Covers {len(core_areas)} technical areas"]
    if real_world_projects:
        strengths.append(f"{real_world_projects} project(s) show real-world/production signals")
    if matched_job_areas:
        strengths.append(f"Job-relevant areas: {', '.join(sorted(matched_job_areas))}")

    weaknesses = []
    if not real_world_projects:
        weaknesses.append("Project entries do not clearly show deployment or real-world usage")
    if job_terms and not matched_job_areas:
        weaknesses.append("Projects have limited overlap with the target role")

    return {
        "score": total,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "matched_skills": sorted(matched_job_areas),
        "summary": f"Analyzed {len(projects)} projects across {len(core_areas)} technical areas",
    }
