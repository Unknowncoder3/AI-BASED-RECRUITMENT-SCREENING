def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(float(value), high))


def analyze_academics(tenth: float, twelfth: float, cgpa: float) -> dict:
    """Normalize academic inputs into a 0-100 screening signal."""
    tenth = _clamp(tenth, 0, 100)
    twelfth = _clamp(twelfth, 0, 100)
    cgpa = _clamp(cgpa, 0, 10)
    score = (tenth * 0.3) + (twelfth * 0.3) + (cgpa * 10 * 0.4)
    return {
        "score": round(score, 2),
        "summary": "Academic consistency evaluated from normalized inputs",
    }
