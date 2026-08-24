from analyzers.academic_analyzer import analyze_academics


def test_academic_score():
    result = analyze_academics(80, 85, 8.0)
    assert result["score"] == 81.0
    assert result["summary"] == "Academic consistency evaluated"


def test_academic_score_is_rounded():
    result = analyze_academics(81, 82, 8.13)
    assert result["score"] == 81.64
