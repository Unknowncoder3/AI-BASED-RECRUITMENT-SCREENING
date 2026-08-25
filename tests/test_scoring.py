from scoring.decision_engine import final_decision
from scoring.score_engine import final_score, score_breakdown


def test_weights_and_score_are_consistent():
    score = final_score(100, 80, 60, 40)
    assert score == 76.0
    assert score_breakdown(100, 80, 60, 40)["total"] == 76.0


def test_scores_are_clamped():
    assert final_score(120, -10, 60, 40) == 56.0


def test_decision_requires_screening_threshold():
    assert final_decision(59, [10, 10, 10]) == "REJECT"


def test_decision_combines_interview_and_screening():
    assert final_decision(90, [9, 9, 9]) == "STRONG MATCH"
    assert final_decision(70, [7, 7, 7]) == "MATCH"
    assert final_decision(55, [7, 7, 7]) == "REJECT"
