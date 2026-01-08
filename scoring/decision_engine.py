def final_decision(scores, emotion_flags, cheating_flags):
    # 🚫 No interview conducted
    if not scores:
        return "REJECT"

    avg_score = sum(scores) / len(scores)

    if avg_score >= 7:
        return "HIRE"
    elif avg_score >= 5:
        return "HOLD"
    else:
        return "REJECT"
