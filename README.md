# 🎓 DropGuard — Student Dropout Prediction & Counseling System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Contract--First-orange.svg)]()

> An Early Warning and Actionable Intervention Decision Support System for Higher Education. Predicts student dropout risk using tabular machine learning, explains critical risk drivers with SHAP, and automatically synthesizes personalized, empathetic counseling recommendations via Generative AI.

---

## 📌 Problem Statement
Colleges and universities struggle to identify at-risk students early enough in the semester to mount timely academic, financial, or personal interventions. **DropGuard** bridges the gap between predictive tabular ML and actionable counseling workflows.

---

## 📂 Repository Structure

This repository uses a **Contract-First, Decoupled Architecture**. Each team member owns their dedicated folder to guarantee zero merge conflicts and 100% parallel development.

```text
DropGuard/
│
├── contracts/                        # [SHARED DATA CONTRACTS]
│   ├── student_schema.json          # Universal JSON schema for data exchange
│   └── mock_students.json           # 10 realistic test student profiles
│
├── ml_engine/                       # [MEMBER 1: ML & XAI ENGINE]
│   ├── data/                        # UCI dataset storage
│   ├── 01_eda_and_training.ipynb    # Exploration & model comparison
│   ├── train_pipeline.py            # Automated training script
│   ├── predict.py                   # Inference + SHAP top-factor extraction
│   └── requirements_ml.txt          # ML-specific dependencies
│
├── counseling_engine/               # [MEMBER 2: GENAI COUNSELING ENGINE]
│   ├── prompts/
│   │   └── counselor_prompt.txt     # System prompt template
│   ├── advisor.py                   # LLM client & memo synthesis logic
│   ├── test_counseling.py           # Unit tests on mock profiles
│   ├── sample_counseling_notes.md   # Official deliverable (5-10 test cases)
│   └── requirements_ai.txt          # GenAI dependencies
│
├── frontend/                        # [MEMBER 3: DASHBOARD & UI]
│   ├── index.html                   # Responsive SaaS-style analytics UI
│   ├── styles.css                   # Custom theme & badges
│   ├── js/
│   │   ├── app.js                   # Table controller & search/filter
│   │   ├── charts.js                # Risk gauge & SHAP bar charts
│   │   └── modal.js                 # Student deep-dive drawer & PDF export
│   └── mock_students.json           # Local mock data for standalone preview
│
├── server/                          # [INTEGRATION BRIDGE]
│   ├── main.py                      # FastAPI REST application
│   └── requirements_server.txt      # API dependencies
│
├── DropGuard_Work_Division_and_Architecture.pdf  # Project blueprint PDF
├── .gitignore
└── README.md
```

---

## 👥 3-Person Team Division & Boundaries

| Member | Focus Area | Owned Folder | Primary Tech Stack |
| :--- | :--- | :--- | :--- |
| **Member 1** | Machine Learning & Explainability (XAI) | `/ml_engine/` | `pandas`, `scikit-learn`, `xgboost`, `shap` |
| **Member 2** | GenAI Counseling Recommendation Engine | `/counseling_engine/` | Python, Gemini API / OpenAI, Prompt Eng |
| **Member 3** | Web Dashboard & User Experience | `/frontend/` | HTML5, Tailwind CSS, JavaScript, Chart.js |

---

## 📅 Day-by-Day Parallel Execution Plan

```
Day 1 ──► Alignment, lock contracts/student_schema.json, setup environments
Day 2 ──► EDA & preprocessing (M1) │ System prompt design (M2) │ Dashboard layout (M3)
Day 3 ──► Train baseline models (M1) │ Build advisor.py (M2) │ Dynamic roster table (M3)
Day 4 ──► SHAP feature extraction (M1) │ Edge-case testing (M2) │ Risk gauges & charts (M3)
Day 5 ──► Package predict.py (M1) │ sample_counseling_notes.md (M2) │ Modal & PDF export (M3)
Day 6 ──► 30-Minute Final Integration via server/main.py (FastAPI)
Day 7 ──► Benchmark metric logging, slides preparation & demo rehearsal
```

---

## 🔒 Non-Contradiction Contract Rules

To ensure that the 3 independent streams assemble flawlessly:
1. **Risk Score:** Formatted strictly as a float between `0.00` and `1.00`.
2. **Risk Levels:** Strictly categorized into `"High"` ($\ge 0.65$), `"Medium"` ($0.35 - 0.64$), and `"Low"` ($< 0.35$).
3. **SHAP Factors:** Member 1 returns a list of 3 human-readable strings (e.g. `["18 unexcused absences", ...]`).
4. **Counseling Output:** Member 2 guarantees returning a dictionary containing exactly: `summary`, `action_items` (list), and `meeting_talking_points` (list).
5. **No File Overlaps:** Teammates work only within their assigned directories.

---

## 🚀 Quickstart Guide

### 1. Preview the Frontend (Member 3 / Standalone)
No backend is needed to test the UI! Simply open `frontend/index.html` in your browser (or use VS Code Live Server). It reads directly from `frontend/mock_students.json`.

### 2. Run the ML Pipeline (Member 1)
```bash
cd ml_engine
pip install -r requirements_ml.txt
python train_pipeline.py
```

### 3. Test the Counseling Engine (Member 2)
```bash
cd counseling_engine
pip install -r requirements_ai.txt
# Set your API key:
# export GEMINI_API_KEY="your-key-here" (Linux/Mac)
# $env:GEMINI_API_KEY="your-key-here" (Windows PowerShell)
python test_counseling.py
```

### 4. Run the Full Integrated System (Final Phase)
```bash
cd server
pip install -r requirements_server.txt
uvicorn main:app --reload --port 8000
```
Then open `frontend/index.html` and interact with the live connected system.
