# Candidate Intelligence API

FastAPI service layer for the AI Candidate Intelligence Platform.

The existing Streamlit prototype remains available at the repository root. This backend establishes the production-style API boundary for the new web application.

## Run

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Open `/docs` for the interactive API documentation.
