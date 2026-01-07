def evaluate_code(passed, total):
    score = int((passed / total) * 10)
    return score, f"{passed}/{total} test cases passed"
