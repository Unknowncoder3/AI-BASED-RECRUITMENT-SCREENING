from __future__ import annotations

from typing import Dict, List

import requests
from bs4 import BeautifulSoup

GITHUB_API_BASE = "https://api.github.com"


def fetch_repositories_api(username: str, max_pages: int = 4) -> List[Dict]:
    """Fetch up to 400 public repositories through the GitHub API."""
    repos: List[Dict] = []
    username = username.strip().lstrip("/")
    if not username:
        return repos

    for page in range(1, max_pages + 1):
        try:
            response = requests.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                params={"per_page": 100, "page": page, "type": "owner", "sort": "updated"},
                headers={"Accept": "application/vnd.github+json"},
                timeout=10,
            )
            if response.status_code != 200:
                return []
            data = response.json()
            if not isinstance(data, list):
                return []
            repos.extend(item for item in data if isinstance(item, dict))
            if len(data) < 100:
                break
        except (requests.RequestException, ValueError):
            return []
    return repos


def fetch_repositories_scrape(username: str) -> Dict:
    """Best-effort public profile fallback when the API is unavailable."""
    try:
        response = requests.get(
            f"https://github.com/{username.strip().lstrip('/')}",
            headers={"User-Agent": "candidate-intelligence-platform"},
            timeout=10,
        )
        if response.status_code != 200:
            return {}

        soup = BeautifulSoup(response.text, "html.parser")
        repo_tag = soup.find("span", class_="Counter")
        repo_count = int(repo_tag.text.strip()) if repo_tag and repo_tag.text.strip().isdigit() else 0
        languages = {span.text.strip() for span in soup.find_all("span", itemprop="programmingLanguage") if span.text.strip()}
        return {"repo_count": repo_count, "languages": sorted(languages)}
    except (requests.RequestException, ValueError):
        return {}


def fetch_github_data(username: str) -> Dict:
    """Use the API first, then a public-profile fallback."""
    repos = fetch_repositories_api(username)
    if repos:
        languages = sorted({repo.get("language") for repo in repos if repo.get("language")})
        return {"repo_count": len(repos), "languages": languages, "source": "api"}

    scraped = fetch_repositories_scrape(username)
    scraped["source"] = "scrape"
    return scraped
