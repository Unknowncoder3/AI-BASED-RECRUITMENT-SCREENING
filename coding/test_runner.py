def run_tests(user_code, problem):
    local_env = {}
    exec(user_code, {}, local_env)

    func = local_env.get("reverse_string")
    passed = 0

    for inp, out in problem["tests"]:
        try:
            if func(inp) == out:
                passed += 1
        except:
            pass

    return passed, len(problem["tests"])
