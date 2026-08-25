import re
from typing import Dict, List

SKILL_PATTERNS = {
    "Python": [r"\bpython\b"],
    "SQL": [r"\bsql\b", r"\bmysql\b", r"\bpostgres(?:ql)?\b"],
    "Machine Learning": [r"\bmachine learning\b", r"\bml\b", r"\bscikit[- ]learn\b"],
    "Data Science": [r"\bdata science\b", r"\bdata analysis\b", r"\bpandas\b", r"\bnumpy\b"],
    "NLP": [r"\bnlp\b", r"\bnatural language processing\b", r"\btransformers?\b"],
    "Deep Learning": [r"\bdeep learning\b", r"\btensorflow\b", r"\bpytorch\b"],
    "Web Development": [r"\breact(?:\.js)?\b", r"\bhtml\b", r"\bcss\b", r"\bjavascript\b"],
    "Backend Development": [r"\bflask\b", r"\bdjango\b", r"\bfastapi\b", r"\bnode(?:\.js)?\b", r"\brest(?:ful)? api\b"],
    "Databases": [r"\bsql\b", r"\bmysql\b", r"\bpostgres(?:ql)?\b", r"\bmongodb\b", r"\bredis\b"],
    "Cloud / DevOps": [r"\baws\b", r"\bazure\b", r"\bgcp\b", r"\bdocker\b", r"\bkubernetes\b", r"\bci/cd\b"],
    "Power BI": [r"\bpower bi\b", r"\bdax\b"],
    "Core CS": [r"\boperating systems\b", r"\bcomputer networks\b", r"\boop\b", r"\bobject[- ]oriented\b", r"\bdata structures?\b", r"\balgorithms?\b"],
    "Git / GitHub": [r"\bgit(?:hub)?\b"],
}


def normalize_text(text: str) -> str:
    """Normalize PDF extraction noise without destroying meaningful words."""
    text = text.replace("\x00", " ")
    text = re.sub(r"(?<=\b[A-Za-z])\s+(?=[A-Za-z]\b)", "", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def extract_required_skills(job_desc: str) -> List[str]:
    """Extract skills from a job description using the same controlled vocabulary."""
    if not job_desc:
        return []
    clean = normalize_text(job_desc)
    return sorted(skill for skill, patterns in SKILL_PATTERNS.items() if any(re.search(p, clean) for p in patterns))


def analyze_resume(text: str, job_desc: str = "") -> Dict:
    if not text or not isinstance(text, str):
        return {"skills": [], "required_skills": extract_required_skills(job_desc), "matched_skills": [], "missing_skills": extract_required_skills(job_desc), "score": 0.0, "summary": "No resume text provided"}

    clean_text = normalize_text(text)
    matched_skills = sorted({skill for skill, patterns in SKILL_PATTERNS.items() if any(re.search(pattern, clean_text) for pattern in patterns)})
    required_skills = extract_required_skills(job_desc)

    if required_skills:
        matched_required = sorted(set(matched_skills) & set(required_skills))
        score = round((len(matched_required) / len(required_skills)) * 100, 2)
        missing = sorted(set(required_skills) - set(matched_skills))
        summary = f"Matched {len(matched_required)}/{len(required_skills)} job-relevant skill areas"
    else:
        score = min(len(matched_skills) * 10.0, 100.0)
        matched_required = matched_skills
        missing = []
        summary = f"Detected {len(matched_skills)} technical skill areas"

    return {
        "skills": matched_skills,
        "required_skills": required_skills,
        "matched_skills": matched_required,
        "missing_skills": missing,
        "score": score,
        "summary": summary,
    }
