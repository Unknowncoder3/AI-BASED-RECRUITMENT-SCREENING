import json
import subprocess


def run_llm(prompt: str, model: str = "mistral", timeout: int = 30) -> str:
    """Run a local Ollama model with bounded execution and clear failures."""
    try:
        process = subprocess.run(
            ["ollama", "run", model],
            input=prompt,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        return process.stdout.strip() if process.returncode == 0 else ""
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return ""


def run_llm_json(prompt: str, model: str = "mistral", timeout: int = 30) -> dict:
    """Ask the local LLM for JSON and fail closed on malformed output."""
    raw = run_llm(prompt, model=model, timeout=timeout)
    if not raw:
        return {}
    cleaned = raw.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {}
