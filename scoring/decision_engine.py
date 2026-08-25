from __future__ import annotations


def final_decision(screening_score: float, interview_scores: list[float]) -> str:
    """Return an explainable recommendation; never treat it as an autonomous hiring decision."""
    if screening_score < 60:
        return "REJECT"
    if not interview_scores:
        return "HOLD"

    interview_score = sum(interview_scores) / len(interview_scores) * 10
    combined = screening_score * 0.6 + interview_score * 0.4

    if combined >= 80:
        return "STRONG MATCH"
    if combined >= 65:
        return "MATCH"
    if combined >= 50:
        return "HOLD"
    return "REJECT"
