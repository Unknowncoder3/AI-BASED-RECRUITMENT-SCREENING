from analyzers.project_analyzer import analyze_projects
from analyzers.resume_analyzer import analyze_resume


def test_resume_matches_job_description():
    resume = "Python, SQL, pandas, scikit-learn, Power BI"
    result = analyze_resume(resume, "Data Scientist: Python, SQL, Machine Learning, Power BI")
    assert result["score"] > 0
    assert "Python" in result["matched_skills"]
    assert "Power BI" in result["matched_skills"]


def test_project_analyzer_returns_relevance_signal():
    result = analyze_projects(
        ["Built a production Flask API using Python and PostgreSQL"],
        "Backend Engineer Python Flask PostgreSQL",
    )
    assert result["score"] > 0
    assert result["matched_skills"]
