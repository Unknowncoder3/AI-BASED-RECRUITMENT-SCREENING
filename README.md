![GitHub stars](https://img.shields.io/github/stars/Unknowncoder3/ai-recruitment-screening)
![License](https://img.shields.io/github/license/Unknowncoder3/ai-recruitment-screening)
![Issues](https://img.shields.io/github/issues/Unknowncoder3/ai-recruitment-screening)

# 🤖 AI-Based Candidate Screening System

An **AI-powered, privacy-first recruitment screening tool** that helps recruiters evaluate candidates using **resume analysis, GitHub profile analysis, academic performance, and project experience**, with **local LLM-based hiring recommendations**.

> 🚀 Built with **Streamlit + Python + Ollama (Local LLM)** — no paid APIs required.

---

## ✨ Key Features

* 📄 **Resume Analysis**
  * Handles noisy PDF text (real ATS-style parsing)
  * Extracts technical skills using robust normalization

* 🐙 **GitHub Profile Analysis**
  * Works with **username or full GitHub URL**
  * API + graceful fallback handling (no API key required)
  * Repository count, languages, and quality-based scoring

* 🎓 **Academic Evaluation**
  * Considers 10th, 12th percentages & CGPA

* 🧩 **Project Analysis**
  * Detects real-world vs academic projects
  * Evaluates core CS & domain coverage

* 🤖 **AI Hiring Recommendation**
  * Uses **local LLM (Ollama)**
  * Non-blocking, timeout-safe inference

* 🔒 **Privacy First**
  * No external AI APIs
  * Runs completely on local machine

---

## 🧑‍💼 NEW: AI Interview System (Multi-Round)

The project now includes a **fully integrated AI Interview System**, turning it into an **end-to-end recruitment platform**.

### 🎤 Interview Rounds
* **HR Interview**
  * Communication skills
  * Cultural fit
  * Confidence & clarity
* **Technical Interview**
  * Core CS fundamentals
  * Problem-solving depth
  * Follow-up questions based on answers

### 🧠 Interview Intelligence
* Interviewer **asks the first question automatically**
* Adaptive follow-up questions
* Difficulty progression
* Context-aware questioning using chat history

### 🔊 Voice-Based Interview
* Speech-to-text for candidate answers
* Text-to-speech for interviewer questions
* Hands-free interview experience

---

## 👁️ Proctoring & Integrity Checks

To simulate real interview conditions, the system includes **basic proctoring**:

* Webcam-based face detection
* Flags raised for:
  * No face detected
  * Multiple faces detected
* Proctoring signals are fed into final hiring decision

> ⚠️ Lightweight & privacy-safe (no video uploaded or stored)

---

## 🏁 Final Hiring Decision Engine

After screening + interview:

* Combines:
  * Screening score
  * Interview performance
  * Proctoring flags
* Outputs:
  * **STRONG HIRE**
  * **HIRE**
  * **HOLD**
  * **REJECT**

Decision logic is explainable and configurable.

---

## 📸 Application Screenshots

> A quick visual walkthrough of the system

### 🏠 Main Dashboard
![Main Dashboard](screenshots/first.png)

### 📄 Resume Analysis & Skill Extraction
![Resume Analysis](screenshots/second.png)

### 🐙 GitHub Profile Analysis
![GitHub Analysis](screenshots/third.png)

### 🎓 Academic & 🧩 Project Evaluation
![Academic & Project Analysis](screenshots/fourth.png)

### 🤖 AI Hiring Recommendation (LLM Output)
![AI Recommendation](screenshots/fifth.png)

---

## 🛠️ Tech Stack

* **Frontend / UI:** Streamlit
* **Backend:** Python
* **AI / LLM:** Ollama (LLaMA3 / Mistral)
* **Speech:** SpeechRecognition, pyttsx3
* **Vision / Proctoring:** OpenCV
* **Parsing:** PDFMiner / regex-based NLP
* **APIs:** GitHub Public API (unauthenticated)

---

## 📂 Project Structure

```

ai-recruitment-screening/
│
├── app.py
│
├── analyzers/
│   ├── resume_analyzer.py
│   ├── github_analyzer.py
│   ├── academic_analyzer.py
│   └── project_analyzer.py
│
├── interview/
│   ├── hr_interviewer.py
│   └── technical_interviewer.py
│
├── llm/
│   ├── ollama_client.py
│   └── prompts.py
│
├── scoring/
│   ├── score_engine.py
│   └── decision_engine.py
│
├── utils/
│   ├── pdf_parser.py
│   ├── speech.py
│   └── camera.py
│
├── screenshots/
├── requirements.txt
└── README.md

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/ai-recruitment-screening.git
cd ai-recruitment-screening
````

---

### 2️⃣ Create Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
```

---

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4️⃣ Install & Run Ollama (Local LLM)

Download Ollama from: [https://ollama.com](https://ollama.com)

```bash
ollama pull llama3
ollama serve
```

> ⚠️ Keep Ollama running in a separate terminal

---

### 5️⃣ Run the Application

```bash
streamlit run app.py
```

Open in browser:

```
http://localhost:8501
```

---

## 🧪 How to Use

### Candidate Screening

1. Upload **resume PDF** or paste resume text
2. Enter **GitHub username or profile URL**
3. Fill academic details
4. Add project descriptions
5. Click **Evaluate Candidate**

### AI Interview

1. Switch to **AI Interview mode**
2. Select **HR or Technical round**
3. Answer via **text or voice**
4. Run optional **proctoring**
5. Generate **final hiring decision**

---

## 📊 Scoring Logic (High-Level)

| Component      | Weight |
| -------------- | ------ |
| Resume Skills  | 35%    |
| GitHub Profile | 25%    |
| Academics      | 25%    |
| Projects       | 15%    |

Interview and proctoring signals are layered on top of this base score.

---

## 🚀 Future Enhancements

* Coding interview round with test cases
* Emotion detection & confidence analysis
* Interview transcript export
* Full interview PDF report
* Admin dashboard for recruiters
* Cloud deployment (Streamlit Cloud / AWS)

---

## 👤 Author

**Snehasish Das**
Final Year CSBS Student | AI & Full-Stack Developer

* GitHub: [https://github.com/Unknowncoder3](https://github.com/Unknowncoder3)
* LinkedIn: [https://www.linkedin.com/in/snehasish-das-7a9803219](https://www.linkedin.com/in/snehasish-das-7a9803219)

---

## ⭐ If you like this project

Give it a **star ⭐** — it really helps!

