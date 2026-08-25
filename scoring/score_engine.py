from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScreeningWeights:
    resume: float = 0.35
    github: float = 0.25
    academics: float = 0.25
    projects: float = 0.15

    def validate(self) -> None:
        total = self.resume + self.github + self.academics + self.projects
        if abs(total - 1.0) > 1e-9:
            raise ValueError(f"Screening weights must sum to 1.0, got {total:.4f}")


DEFAULT_WEIGHTS = ScreeningWeights()


def _clamp(score: float) -> float:
    return max(0.0, min(float(score), 100.0))


def final_score(resume: float, github: float, academics: float, projects: float = 0.0, weights: ScreeningWeights = DEFAULT_WEIGHTS) -> float:
    """Return a normalized 0-100 pre-interview screening score."""
    weights.validate()
    values = (_clamp(resume), _clamp(github), _clamp(academics), _clamp(projects))
    weighted = (
        values[0] * weights.resume
        + values[1] * weights.github
        + values[2] * weights.academics
        + values[3] * weights.projects
    )
    return round(weighted, 2)


def score_breakdown(resume: float, github: float, academics: float, projects: float, weights: ScreeningWeights = DEFAULT_WEIGHTS) -> dict[str, float]:
    """Return component scores and weighted contributions for explainability."""
    weights.validate()
    values = {
        "resume": _clamp(resume),
        "github": _clamp(github),
        "academics": _clamp(academics),
        "projects": _clamp(projects),
    }
    contributions = {
        key: round(values[key] * getattr(weights, key), 2) for key in values
    }
    return {
        **values,
        **{f"{key}_contribution": value for key, value in contributions.items()},
        "total": round(sum(contributions.values()), 2),
    }
