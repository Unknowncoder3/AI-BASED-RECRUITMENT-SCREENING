def final_decision(scores, emotion_flags, cheating_flags):
    avg_score = sum(scores) / len(scores)

    risk = 0
    if cheating_flags:
        risk += 2
    if "Angry" in emotion_flags or "Sad" in emotion_flags:
        risk += 1

    if avg_score >= 8 and risk == 0:
        return "STRONG HIRE"
    elif avg_score >= 6 and risk <= 1:
        return "HIRE"
    elif avg_score >= 5:
        return "HOLD"
    else:
        return "REJECT"
