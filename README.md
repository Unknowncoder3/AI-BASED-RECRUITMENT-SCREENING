# 🤖 CandidateIQ — AI Candidate Intelligence Platform

<p align="center"><b>Job-aware candidate screening, portfolio evidence, explainable scoring and recruiter workflows in one modern workspace.</b></p>

<p align="center"><a href="https://candidateiq-recruitment.netlify.app/">🚀 Live Demo</a> · <a href="https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING">Repository</a> · <a href="https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING/actions">CI</a></p>

---

## 🎯 Product vision

CandidateIQ is a portfolio-grade recruitment intelligence prototype that helps a recruiter combine a job description with resume, GitHub, academic and project evidence. The product deliberately treats AI as **decision support**, not an autonomous hiring authority: every recommendation remains human-reviewed.

## ✨ Product capabilities

- **Recruiter dashboard** with pipeline KPIs, screening trends, status distribution, top jobs and AI insights.
- **Candidate intake workflow** with PDF resume extraction, structured academic inputs, GitHub username and project evidence.
- **Explainable scoring** with Resume/JD, GitHub, Academics and Projects components.
- **GitHub portfolio analysis** for repository and language signals.
- **Adaptive interview workflow** and local LLM evaluation in the existing backend.
- **Recruiter-facing reporting** and evidence summaries.
- **Responsive dark-mode UI** designed like a real internal hiring product rather than a demo form.
- **CI validation** for backend imports/tests and frontend production builds.

## 🖥️ Product screenshots

### Candidate profile & interview journey

The live CandidateIQ interface uses a structured interview journey with profile, AI screening, behavioral, motivation, technical, coding, HR and report stages.

![CandidateIQ — live interview journey](https://image.thum.io/get/width/1400/crop/900/https://candidateiq-recruitment.netlify.app/)

### Candidate intake workflow

The candidate intake experience captures role, academic information, GitHub, resume, projects and resume text before assessment begins.

![CandidateIQ — live candidate intake](https://image.thum.io/get/width/1400/crop/1200/https://candidateiq-recruitment.netlify.app/)

## 🌐 Live application

**CandidateIQ is deployed on Netlify:**

👉 https://candidateiq-recruitment.netlify.app/

The live application demonstrates the candidate practice flow and recruiter-oriented interview workspace. Backend-dependent features may require the configured deployment environment.

## 🏗️ Architecture

```text
React + Vite Recruiter Workspace
        │
        ├── Dashboard / Pipeline / Jobs / Interviews / Reports
        │
        └── Candidate Intake
              │
              ▼
        FastAPI Screening API
              │
       ┌──────┼─────────┐
       ▼      ▼         ▼
    Resume  GitHub   Academics + Projects
       │      │         │
       └──────┼─────────┘
              ▼
       Explainable Score
       35% / 25% / 25% / 15%
              │
              ▼
       Interview + Local LLM
              │
              ▼
       Human Review Recommendation
```

## 📊 Screening model

| Signal | Weight | Purpose |
|---|---:|---|
| Resume / JD match | 35% | Job-relevant technical skills |
| GitHub | 25% | Portfolio and engineering signals |
| Academics | 25% | Structured academic consistency |
| Projects | 15% | Technical breadth and relevance |

These weights are prototype assumptions, **not validated predictors of hiring success**.

## 🧠 AI design

The system uses a hybrid architecture:

1. Deterministic analyzers extract reproducible signals.
2. A transparent weighted score combines those signals.
3. A local Ollama model handles contextual interview reasoning.
4. Structured JSON validation keeps LLM output machine-readable.
5. The recruiter UI exposes evidence and score components instead of hiding the decision behind a single AI label.

## 🔐 Responsible AI

Recruitment is a high-impact domain. This project is a portfolio/research prototype and should not be used as the sole basis for employment decisions.

- Human review is required for every recommendation.
- Protected characteristics must not be used as screening signals.
- Webcam functionality is preview-only; it is not a validated emotion, honesty or cheating detector.
- Production deployment would require consent, access control, retention policies, security testing, fairness evaluation, monitoring and legal/compliance review.

## 🛠️ Tech stack

### Frontend
- React 19
- Vite 8
- Responsive CSS
- SVG-based analytics visuals

### Backend
- Python
- FastAPI
- PyPDF / PDF extraction
- GitHub API
- Ollama / local LLM inference
- Deterministic scoring analyzers
- Pytest

## 📁 Project structure

```text
AI-BASED-RECRUITMENT-SCREENING/
├── backend/
│   ├── main.py
│   ├── analyzers/
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── styles.css
├── analyzers/
├── interview/
├── llm/
├── scoring/
├── tests/
├── screenshots/              # optional local screenshots for repository documentation
├── .github/workflows/ci.yml
├── requirements.txt
└── README.md
```

## 🚀 Local setup

### Backend

```bash
git clone https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING.git
cd AI-BASED-RECRUITMENT-SCREENING
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown by the terminal. For a deployed backend, set `VITE_API_BASE_URL` in `frontend/.env`.

### Tests

```bash
pytest -q
```

## 🧪 Example recruiter workflow

1. Open the CandidateIQ dashboard.
2. Create or select a target role.
3. Add a candidate and upload the resume.
4. Provide GitHub, academic and project evidence.
5. Run AI Screening.
6. Inspect the score breakdown, missing skills and evidence summaries.
7. Continue to interview/report workflows.
8. Make the final decision with human review.

## 🔮 Roadmap

- Semantic embedding-based JD matching
- Job-specific scoring profiles
- Evidence extraction with source locations from resumes
- Candidate comparison and shortlist views
- Secure coding assessment sandbox
- Authentication and RBAC
- Persistent audit trail
- Fairness benchmark and bias monitoring
- Model evaluation benchmark
- Containerized production deployment

## 👨‍💻 Author

**Snehasish Das** — Data Analyst | Applied AI Developer

- GitHub: https://github.com/Unknowncoder3
- LinkedIn: https://www.linkedin.com/in/snehasish-das-b75a551b0/

---

⭐ The recommended entry point is `frontend/src/main.jsx` for the recruiter experience and `backend/main.py` for the screening API.
