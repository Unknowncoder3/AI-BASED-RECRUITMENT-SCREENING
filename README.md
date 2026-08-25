# 🤖 AI Candidate Intelligence Platform

<p align="center">
  <b>Job-aware candidate screening and adaptive interviewing with deterministic scoring, GitHub evidence, local LLM reasoning, and explainable recommendations.</b>
</p>

<p align="center">
  <a href="https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING">Repository</a>
  ·
  <a href="https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING/actions">CI</a>
</p>

---

## 🎯 What problem does it solve?

Recruiters often have to combine resumes, job descriptions, project claims, GitHub activity, academic information, and interview notes manually. This project turns those inputs into a **structured candidate evidence profile** and an AI-assisted recommendation.

The platform is intentionally designed as a **decision-support system**, not an autonomous hiring system. A human reviewer remains responsible for the employment decision.

## ✨ Current capabilities

- **Job-aware resume matching** — extracts technical skill areas and compares them with the target job description.
- **GitHub portfolio analysis** — retrieves repository/language signals through the GitHub API with a public-profile fallback.
- **Project relevance scoring** — measures technical breadth, practical signals, and overlap with the target role.
- **Academic scoring** — converts 10th, 12th, and CGPA inputs into a normalized signal.
- **Explainable screening score** — Resume 35%, GitHub 25%, Academics 25%, Projects 15%.
- **Adaptive technical interview** — questions progress from Easy → Medium → Hard and use candidate/job context.
- **Structured LLM evaluation** — local Ollama inference returns validated JSON rather than fragile text parsing.
- **Recruiter evidence view** — shows score components, missing skills, project strengths, and interview evidence.
- **PDF report generation** — exports a recruiter-facing evaluation summary.
- **Automated tests + CI** — core scoring and analyzer behavior is covered by pytest and GitHub Actions.

## 🏗️ Architecture

```text
                  ┌──────────────────────┐
                  │   Job Description    │
                  └──────────┬───────────┘
                             │
Candidate ───────────────────┼───────────────────────┐
   │                         │                       │
   ├── Resume PDF ──► Resume/JD Matcher              │
   ├── GitHub ──────► Portfolio Analyzer             │
   ├── Projects ────► Project Relevance Analyzer     │
   └── Academics ───► Academic Analyzer              │
                             │                       │
                             ▼                       │
                    Explainable Score                │
                   35 / 25 / 25 / 15                 │
                             │                       │
                             ▼                       │
                    Adaptive Interview ◄─────────────┘
                             │
                             ▼
                    Local LLM Evaluation
                             │
                             ▼
                  Human-review Recommendation
                             │
                             ▼
                    Recruiter PDF Report
```

## 📊 Screening model

| Signal | Weight | Purpose |
|---|---:|---|
| Resume / JD match | 35% | Job-relevant technical skills |
| GitHub | 25% | Portfolio and engineering signals |
| Academics | 25% | Structured academic consistency |
| Projects | 15% | Technical breadth and practical relevance |

The weights are configurable prototype assumptions, **not validated predictors of hiring success**.

After screening, the interview contributes additional evidence. The final output is a recommendation such as **STRONG MATCH, MATCH, HOLD, or REJECT** and must be reviewed by a qualified human.

## 🧠 AI design

The project uses a hybrid approach:

1. **Deterministic analyzers** extract reproducible signals.
2. **A transparent weighted score** combines those signals.
3. **A local Ollama model** generates interview questions and evaluates answers.
4. **Structured JSON validation** prevents malformed model output from silently corrupting scores.
5. **Evidence is displayed with the recommendation** so a recruiter can inspect why the system reached it.

This separation makes the system easier to test and debug than an LLM-only screening workflow.

## 🔐 Responsible AI

Recruitment is a high-impact domain. This project is a portfolio/research prototype and should not be used as the sole basis for employment decisions.

- Human review is required for every recommendation.
- The interview evaluator is instructed not to score protected characteristics or appearance.
- Webcam functionality is **preview-only**; it is not a validated emotion, honesty, or cheating detector.
- Local LLM inference reduces external AI dependency but does not by itself guarantee privacy.
- Production use would require consent, access control, security testing, retention policies, model validation, fairness testing, monitoring, and legal/compliance review.

## 🛠️ Tech stack

- Python
- Streamlit
- Ollama / local LLM inference
- PyPDF
- FPDF2
- GitHub Public API
- BeautifulSoup fallback parsing
- Pytest
- GitHub Actions

## 📁 Project structure

```text
AI-BASED-RECRUITMENT-SCREENING/
├── app.py
├── analyzers/
│   ├── resume_analyzer.py
│   ├── github_analyzer.py
│   ├── academic_analyzer.py
│   └── project_analyzer.py
├── interview/
├── llm/
│   ├── ollama_client.py
│   └── prompts.py
├── scoring/
│   ├── score_engine.py
│   └── decision_engine.py
├── utils/
│   ├── pdf_parser.py
│   ├── speech.py
│   └── camera.py
├── tests/
│   ├── test_scoring.py
│   └── test_analyzers.py
├── .github/workflows/ci.yml
├── requirements.txt
└── README.md
```

## 🚀 Local setup

```bash
git clone https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING.git
cd AI-BASED-RECRUITMENT-SCREENING
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Install and start Ollama separately, then pull the model configured by the application (for example `mistral`):

```bash
ollama pull mistral
ollama serve
```

Run the app:

```bash
streamlit run app.py
```

Run tests:

```bash
pytest -q
```

## 🧪 Example workflow

1. Paste the target **job description**.
2. Upload a candidate resume.
3. Enter GitHub and academic information.
4. Add project descriptions.
5. Review the explainable screening score and missing skills.
6. Run the adaptive technical interview.
7. Review interview evidence and the AI-assisted recommendation.
8. Generate a recruiter PDF report.

## 🔮 Roadmap

- Semantic embedding-based JD matching
- Job-specific weighting profiles
- Evidence extraction with source locations from resumes
- Secure isolated coding sandbox
- Candidate comparison dashboard
- Fairness benchmark and bias monitoring
- Authentication / RBAC
- Persistent audit trail
- Model evaluation benchmark
- Containerized deployment

## 👨‍💻 Author

**Snehasish Das** — Data Analyst | Applied AI Developer

- GitHub: https://github.com/Unknowncoder3
- LinkedIn: https://www.linkedin.com/in/snehasish-das-b75a551b0/

---

⭐ If you explore the project, start with `app.py`, then follow the analyzers → scoring → LLM → interview flow.
