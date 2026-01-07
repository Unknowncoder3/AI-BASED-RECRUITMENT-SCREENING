from llm.ollama_client import ask_llm
from llm.prompts import TECH_PROMPT

def tech_round(answer, history):
    return ask_llm(TECH_PROMPT, answer, history)
