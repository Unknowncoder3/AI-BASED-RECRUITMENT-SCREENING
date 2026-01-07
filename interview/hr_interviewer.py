from llm.ollama_client import ask_llm
from llm.prompts import HR_PROMPT

def hr_round(answer, history):
    return ask_llm(HR_PROMPT, answer, history)
