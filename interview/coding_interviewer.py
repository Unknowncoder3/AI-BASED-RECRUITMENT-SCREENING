from coding.problems import CODING_PROBLEMS
from coding.test_runner import run_tests
from coding.evaluator import evaluate_code

def conduct_coding_round(user_code):
    problem = CODING_PROBLEMS["easy"]
    passed, total = run_tests(user_code, problem)
    return evaluate_code(passed, total)
