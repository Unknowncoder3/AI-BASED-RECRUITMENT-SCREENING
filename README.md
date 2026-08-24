# 🤖 AI-Based Candidate Screening & Interview System

<p align="center">
  <b>End-to-end recruitment screening prototype combining deterministic scoring, GitHub analysis, local LLM assistance, interviews and lightweight integrity checks.</b>
</p>

<p align="center">
  <a href="https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING">Repository</a>
</p>

---

## 📌 Overview

This project explores how a recruitment workflow can combine structured candidate information with AI-assisted analysis in a single application.

The system accepts resume information, GitHub profile data, academic information and project details, then combines deterministic scoring with a **local LLM-based recommendation layer**. It also includes HR/technical interview workflows, voice interaction and lightweight webcam-based integrity signals.

> **Important:** This is a portfolio/research prototype, not a validated hiring system. Recruitment decisions should remain subject to qualified human review. The system should not be used as the sole basis for employment decisions.

---

## ✨ Core Features

### 📄 Resume Analysis
- PDF/text resume processing
- Technical skill extraction
- Normalization of common skill names

### 🐙 GitHub Analysis
- Accepts GitHub username or profile URL
- Repository/language information retrieval
- Portfolio-oriented scoring signals

### 🎓 Academic Evaluation
- Supports school percentages and CGPA inputs
- Converts structured academic information into scoring signals

### 🧩 Project Analysis
- Evaluates project descriptions
- Looks for practical/project-domain coverage
- Separates project-related signals from other candidate information

### 🤖 Local LLM Recommendation
- Uses Ollama for local inference
- Generates an AI-assisted candidate recommendation
- Avoids dependence on paid external LLM APIs

### 🎤 Multi-Round Interview
- HR interview workflow
- Technical interview workflow
- Context-aware follow-up questions
- Text and voice interaction

### 👁️ Lightweight Integrity Signals
- Webcam-based face detection
- Flags conditions such as no face or multiple faces
- Designed as an interview signal rather than a definitive behavioral judgment

### 🏁 Decision Engine
Produces configurable outcome categories such as:

`STRONG HIRE` · `HIRE` · `HOLD` · `REJECT`

The result should be treated as an **AI-assisted recommendation**, not an autonomous employment decision.

---

## 🏗️ System Architecture

```text
Candidate Inputs
     │
     ├── Resume PDF/Text
     ├── GitHub Profile
     ├── Academic Data
     └── Project Information
             │
             ▼
      Feature Extraction
             │
      ┌──────┼────────┐
      ▼      ▼        ▼
   Resume  GitHub  Academics
   Parser  Analyzer Analyzer
      └──────┼────────┘
             ▼
       Project Analyzer
             │
             ▼
      Deterministic Score
             │
             ▼
       Local LLM Layer
             │
             ▼
       AI Recommendation
             │
             ├──────────────┐
             ▼              ▼
      Interview Engine   Integrity Signals
             │              │
             └──────┬───────┘
                    ▼
             Final Decision
```

---

## 📊 Base Scoring Model

The current documented screening model uses:

| Component | Weight |
|---|---:|
| Resume Skills | 35% |
| GitHub Profile | 25% |
| Academics | 25% |
| Projects | 15% |

Interview and integrity-related signals are handled separately in the overall workflow.

> These weights are configurable design choices for the prototype, not evidence that they are predictive of real-world hiring outcomes.

---

## 🧰 Tech Stack

- **Python** — application and scoring logic
- **Streamlit** — user interface
- **Ollama** — local LLM inference
- **OpenCV** — webcam/vision processing
- **SpeechRecognition** — speech input
- **pyttsx3** — speech output
- **PDFMiner / regex** — document processing
- **GitHub Public API** — profile/repository information

---

## 📂 Project Structure

```text
AI-BASED-RECRUITMENT-SCREENING/
├── app.py
├── analyzers/
│   ├── resume_analyzer.py
│   ├── github_analyzer.py
│   ├── academic_analyzer.py
│   └── project_analyzer.py
├── interview/
│   ├── hr_interviewer.py
│   └── technical_interviewer.py
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
├── screenshots/
├── requirements.txt
└── README.md
```

---

## 📸 Application Screenshots

### Main Dashboard
![Main Dashboard](screenshots/first.png)

### Resume Analysis
![Resume Analysis](screenshots/second.png)

### GitHub Analysis
![GitHub Analysis](screenshots/third.png)

### Academic & Project Evaluation
![Academic and Project Evaluation](screenshots/fourth.png)

### AI Recommendation
![AI Recommendation](screenshots/fifth.png)

---

## ⚙️ Local Setup

```bash
git clone https://github.com/Unknowncoder3/AI-BASED-RECRUITMENT-SCREENING.git
cd AI-BASED-RECRUITMENT-SCREENING
python -m venv .venv
```

Activate the environment and install dependencies:

```bash
pip install -r requirements.txt
```

Install Ollama separately and pull a supported local model, for example:

```bash
ollama pull llama3
ollama serve
```

Start the application:

```bash
streamlit run app.py
```

Open `http://localhost:8501`.

---

## 🧪 Example Workflow

### Screening

1. Upload or provide resume information.
2. Enter a GitHub username/profile URL.
3. Provide academic information.
4. Add project information.
5. Run the screening workflow.

### Interview

1. Select HR or technical mode.
2. Answer questions through text or voice.
3. Continue through adaptive follow-ups.
4. Optionally enable lightweight webcam integrity checks.
5. Generate the final AI-assisted recommendation.

---

## 🔐 Privacy & Responsible AI

This project is designed as a local-first prototype, but responsible deployment requires additional controls.

- Candidate data should be handled with appropriate consent and access controls.
- Local LLM inference reduces dependence on external AI APIs but does not automatically guarantee privacy.
- Automated hiring decisions can introduce bias and should not replace qualified human review.
- Webcam signals should not be interpreted as reliable measurements of honesty, emotion, personality or job suitability.
- Any production deployment would require validation, auditing, security controls, data-retention policies and legal/compliance review.

---

## 🔮 Future Improvements

- Coding interview with executable test cases
- Structured interview scoring rubric
- Candidate report export
- Recruiter/admin dashboard
- Automated tests and CI
- Audit trail for scoring decisions
- Fairness and bias evaluation
- Stronger authentication and authorization
- Production deployment architecture

---

## 👨‍💻 Author

**Snehasish Das** — Data Analyst | Applied AI Developer

- GitHub: https://github.com/Unknowncoder3
- LinkedIn: https://www.linkedin.com/in/snehasish-das-b75a551b0/

---

⭐ Explore the implementation to see how the individual analyzers, scoring layer, interview modules and local LLM are connected.
