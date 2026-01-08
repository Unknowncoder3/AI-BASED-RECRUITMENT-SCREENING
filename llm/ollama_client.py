import subprocess
import json
import shlex


def run_llm(prompt: str, model: str = "mistral", timeout: int = 30) -> str:
    """
    Run Ollama LLM safely with timeout.
    Prevents Streamlit from hanging forever.
    """

    try:
        command = f"ollama run {model}"
        process = subprocess.run(
            shlex.split(command),
            input=prompt,
            text=True,
            capture_output=True,
            timeout=timeout
        )

        if process.returncode != 0:
            return "⚠️ LLM failed to generate recommendation."

        output = process.stdout.strip()

        if not output:
            return "⚠️ LLM returned empty response."

        return output

    except subprocess.TimeoutExpired:
        return "⚠️ LLM timed out. Try a smaller input or ensure Ollama is running."

    except Exception as e:
        return f"⚠️ LLM error: {str(e)}"
