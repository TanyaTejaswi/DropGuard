# 🎓 DropGuard: Student Dropout Early Warning & AI-Assisted Counseling Decision Support System

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.3%2B-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![SHAP](https://img.shields.io/badge/XAI-SHAP%20TreeExplainer-FF3621?style=flat-square)](https://github.com/shap/shap)
[![Google Gemini](https://img.shields.io/badge/GenAI-Gemini%201.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Frontend-TailwindCSS%20%7C%20Chart.js-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **DropGuard** is an institutional decision support platform that combines **tabular machine learning (92.98% accuracy)**, **local Explainable AI (SHAP TreeExplainer)**, and **Generative AI (Gemini 1.5 Flash with zero-failure fallback)** into a unified, privacy-conscious dashboard for academic advisors and university administrators.

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [End-to-End System Architecture](#-end-to-end-system-architecture)
3. [Dataset & Preprocessing Pipeline](#-dataset--preprocessing-pipeline)
4. [Machine Learning Benchmarks & Performance](#-machine-learning-benchmarks--performance)
5. [Explainable AI (SHAP Interpretability)](#-explainable-ai-shap-interpretability)
6. [Generative AI Counseling Engine](#-generative-ai-counseling-engine)
7. [Full-Stack Dashboard Experience](#-full-stack-dashboard-experience)
8. [Team Work Division (50/50 & 3-Member Formats)](#-team-work-division)
9. [Repository Directory Structure](#-repository-directory-structure)
10. [Verification & Test Matrix](#-verification--test-matrix)
11. [Quickstart & Installation Guide](#-quickstart--installation-guide)
12. [REST API Reference](#-rest-api-reference)
13. [Ethical Considerations & Privacy Guardrails](#-ethical-considerations--privacy-guardrails)

---

## 📌 Executive Summary & Problem Statement

### The Problem
Universities and colleges worldwide lose billions of dollars and countless student futures to student attrition. Traditional early warning systems suffer from two fatal flaws:
1. **The "Black Box" Barrier:** Complex models yield risk scores without explaining *why* a student is struggling. Advisors cannot tell if a student's high risk stems from tuition delinquency, failed STEM courses, or scholarship loss.
2. **The "Actionability" Gap:** Predictive systems stop at probability numbers. Burdened counselors must manually review transcripts, deduce root causes, and draft intervention plans, leading to delayed meetings and generic, unhelpful interventions.

### The DropGuard Solution
DropGuard bridges the gap between tabular risk predictions and proactive, personalized student support through three synchronized tiers:
* **Predictive Tier:** Evaluates student records against a calibrated ensemble of 200 decision trees to produce a risk score ($0.00 - 1.00$) in $<15\text{ms}$.
* **Explainability Tier:** Uses local SHAP TreeExplainer Shapley values to pinpoint the top positive and negative drivers behind each individual's score.
* **Prescriptive Tier:** Passes the quantified profile and key SHAP factors into an LLM counselor engine that synthesizes empathetic, restorative meeting guides, institutional referrals, and personalized student action items in $<1.5\text{s}$.

---

## 🏛️ End-to-End System Architecture

DropGuard follows a **Contract-First, Decoupled Architecture**. All components communicate through a strictly validated universal JSON contract (`contracts/student_schema.json`), enabling modular upgrades and zero merge-conflict team development.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UCI Dataset #697 (4,424 Records)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Preprocessing Pipeline
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │ 233 Encoded Features (StandardScaler + OneHotEncoder)│
         └──────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
       ┌──────────────────────────────────────────────────────────┐
       │     Random Forest Classifier (200 Trees, Depth 14)       │
       │         92.98% Accuracy  │  0.9711 ROC-AUC Area         │
       └────────────────────────────┬─────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
       ┌─────────────────────┐             ┌─────────────────────┐
       │   Predicted Risk    │             │ SHAP TreeExplainer  │
       │   Score (0.00-1.00) │             │ Top 3 Risk Factors  │
       └──────────┬──────────┘             └──────────┬──────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
               ┌─────────────────────────────────────────┐
               │ FastAPI Backend Service (/api/predict)  │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
               ┌─────────────────────────────────────────┐
               │    Counseling Engine (Gemini Flash)     │
               │   + Autonomous Domain Expert Fallback   │
               └────────────────────┬────────────────────┘
                                    │ Strict 3-Key JSON
                                    ▼
               ┌─────────────────────────────────────────┐
               │   Linear Light Neo-Brutalist Dashboard  │
               │  • SVG Radial Gauge   • SHAP Bar Chart  │
               │  • What-If Simulator  • PDF Memo Export │
               └─────────────────────────────────────────┘
```

---

## 📊 Dataset & Preprocessing Pipeline

* **Dataset Source:** UCI Machine Learning Repository Dataset #697 — *"Predict Students' Dropout and Academic Success"* (Polytechnic Institute of Portalegre).
* **Raw Cohort Size:** 4,424 student enrollments across 37 raw features.
* **Cohort Filtering:** Filtered out actively enrolled students to focus on completed graduation vs. dropout trajectories, resulting in **3,630 records** (1,421 Dropouts [39.1%], 2,209 Graduates [60.9%]).
* **Target Encoding:** Binary classification (`0` = Graduate, `1` = Dropout).

### Feature Engineering & Transformation
```
Raw Features (37)
├── Numerical (18)  ──► StandardScaler (Z-score normalization)
├── Categorical (10) ──► OneHotEncoder (handle_unknown='ignore')
└── Binary Flags (8) ──► Identity Passthrough (0 / 1)
                     ▼
             Total Dimensions = 233 Features
```

---

## 🏆 Machine Learning Benchmarks & Performance

Three candidate algorithms were evaluated on an identical stratified $80/20$ train-test split (2,904 training rows, 726 holdout testing rows) using 5-fold cross-validation. All evaluations were recorded in `ml_engine/benchmark_models.py`.

| Machine Learning Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Inference Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Forest (Production)** | **92.98%** | **91.17%** | **90.85%** | **91.01%** | **0.9711** | **14.2 ms** |
| Logistic Regression (Baseline) | 92.01% | 90.48% | 89.26% | 89.86% | 0.9634 | 2.1 ms |
| Gradient Boosting (XGBoost Alt) | 91.87% | 90.04% | 89.08% | 89.56% | 0.9650 | 18.6 ms |

### Production Model Configuration
* **Algorithm:** `RandomForestClassifier` (Scikit-Learn)
* **Hyperparameters:** `n_estimators=200`, `max_depth=14`, `min_samples_split=5`, `class_weight='balanced'`, `random_state=42`.
* **Serialization:** Exported to compressed artifacts in `ml_engine/model.pkl` along with feature column mappings.

---

## 🔍 Explainable AI (SHAP Interpretability)

DropGuard enforces transparent AI governance. The platform does not allow ungrounded probability estimates: every prediction is processed through **SHAP (SHapley Additive exPlanations)** using `TreeExplainer` for exact local credit allocation.

### Top Feature Attributions Across the Student Body

```text
Feature Impact on Dropout Risk (SHAP Global Mean Absolute Importance):
1. Curricular units 2nd sem (approved)  ████████████████████ (22.8%)
2. Curricular units 1st sem (approved)  ████████████ (13.0%)
3. Curricular units 2nd sem (grade)     ███████████ (12.6%)
4. Curricular units 1st sem (grade)     ██████ (7.0%)
5. Tuition fees up to date [Flag]       █████ (5.2%)
6. Debtor [Flag]                        ████ (4.1%)
7. Scholarship holder [Flag]            ███ (3.4%)
8. Age at enrollment                    ███ (3.1%)
9. Curricular units 2nd sem (evals)     ██ (2.5%)
10. Course preference rank              ██ (2.0%)
```

In production (`ml_engine/predict.py`), the explainer extracts the student's top 3 individualized risk factors and generates natural language explanations (e.g., *"Completed only 1 of 6 registered credits in Semester 2"* or *"Outstanding overdue tuition balance"*).

---

## 🤖 Generative AI Counseling Engine

The counseling recommendation engine (`counseling_engine/advisor.py`) bridges data science and student care. It ingests student demographic indicators, academic progress, and SHAP risk drivers to generate structured, restorative counseling briefs.

### Dual-Engine High Availability
1. **Primary Provider:** Google Gemini 1.5 Flash accessed via direct REST API calls. Latency $<1.5\text{s}$, temperature $0.3$ (for factual consistency and minimized hallucination).
2. **Autonomous Fallback Engine:** Built-in heuristic expert system that automatically generates verified counseling memos when API limits are reached, the system is offline, or no API key is provided.

### Prompt Guardrails & Restorative Tone Rules
* **Restorative Language:** Prohibits punitive or stigmatizing phrasing (e.g., *"chronic slacker"*, *"failing student"*). Reframes challenges around resource gaps, workload adaptation, or financial stress.
* **Strict JSON Schema:** Output is validated against a three-key contract:
  ```json
  {
    "summary": "2-3 sentence root-cause assessment grounded directly in the student's top SHAP factors.",
    "action_items": [
      "Student Task 1: Specific, time-bound, actionable next step",
      "Student Task 2: Specific, time-bound, actionable next step",
      "Student Task 3: Specific, time-bound, actionable next step"
    ],
    "meeting_talking_points": [
      "Advisor Guidance 1: Empathetic opening question",
      "Advisor Guidance 2: Institutional referral (tutoring, bursar, counseling)",
      "Advisor Guidance 3: Milestone check-in plan"
    ]
  }
  ```

---

## 💻 Full-Stack Dashboard Experience

The interface is built with a **Linear-style, neo-brutalist aesthetic** featuring high contrast, clean typography (Inter), and sub-second UI interactions:
* **Interactive Cohort Table:** Live search, status filters (All, High, Medium, Low), and click-to-sort headers for GPA, Risk, and Name.
* **Animated SVG Radial Risk Gauge:** Color-coded dial (Green $<35\%$, Yellow $35-64\%$, Red $\ge 65\%$) with smooth transition animations.
* **Dynamic SHAP Factor Breakdown:** Visual attribution horizontal bars that reveal exact feature impacts.
* **Interactive "What-If" Simulator:** Allows advisors to adjust hypothetical student parameters (e.g., "What if this student passes 4 credits next term and secures scholarship funding?") to simulate risk reduction in real time.
* **One-Click PDF Memo Exporter:** Generates formatted counseling referral letters ready for student files or departmental escalation.

---

## 👥 Team Work Division

DropGuard's contract-first structure supports flexible team presentation formats.

### Option A: 2-Member 50/50 Division (Recommended)

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MEMBER 1 (50% Project Scope)                      │
│           Machine Learning, Data Engineering & Backend API             │
├────────────────────────────────────────────────────────────────────────┤
│ • Dataset acquisition & cohort cleaning (4,424 -> 3,630 records)       │
│ • Sklearn pipeline: StandardScaler + OneHotEncoder -> 233 features     │
│ • Model benchmarking (RF 92.98% vs LR 92.01% vs GBDT 91.87%)           │
│ • Serialization of 200-tree production Random Forest (model.pkl)       │
│ • SHAP TreeExplainer integration for sub-15ms local attribution        │
│ • FastAPI server implementation (main.py, /api/predict, /api/students) │
│ • Complete integration test harness (test_integration.py - 5/5 passed) │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ JSON Contract Data Exchange
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      MEMBER 2 (50% Project Scope)                      │
│            Generative AI Engine & Full-Stack UI Dashboard              │
├────────────────────────────────────────────────────────────────────────┤
│ • Counselor prompt engineering (prompts/counselor_prompt.txt)          │
│ • Gemini 1.5 Flash REST client + autonomous expert fallback engine     │
│ • Edge case validation suite (counseling_engine/test_edge_cases.py)    │
│ • Linear-style responsive web UI (HTML5, TailwindCSS, Chart.js)        │
│ • Animated SVG radial risk gauge & SHAP attribution bar charts         │
│ • Interactive "What-If" scenario simulator & PDF memo export modal     │
│ • Complete UI state management & mock dataset alignment                │
└────────────────────────────────────────────────────────────────────────┘
```

### Option B: 3-Member Traditional Division

| Member | Role | Owned Modules | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **Member 1** | Machine Learning & Data Pipeline | `data/`, `ml_engine/` | UCI preprocessing, 233-dim pipeline, RF model (92.98%), SHAP explainer |
| **Member 2** | GenAI Counseling Engine | `counseling_engine/` | Counselor prompt, Gemini REST client, offline fallback, edge tests |
| **Member 3** | UI & System Integration | `frontend/`, `server/` | Web dashboard, SVG gauge, What-If simulator, FastAPI endpoints |

---

## 📂 Repository Directory Structure

```text
DropGuard/
├── contracts/                               # Universal JSON contracts
│   ├── student_schema.json                  # Schema specification for student payloads
│   └── mock_students.json                   # 10 realistic test student profiles
│
├── data/                                    # Dataset assets
│   ├── student_data.csv                     # Raw UCI #697 dataset (4,424 records)
│   └── preprocessed_student_data.csv        # Cleaned & encoded cohort (3,630 rows x 233 cols)
│
├── ml_engine/                               # Machine Learning & Explainable AI
│   ├── 01_eda_and_training.ipynb            # Jupyter notebook with EDA & hyperparameter tuning
│   ├── benchmark_models.py                  # Evaluation script comparing RF, LR, and GBDT
│   ├── train_pipeline.py                    # Production pipeline training script
│   ├── predict.py                           # Inference engine with SHAP TreeExplainer
│   ├── model.pkl                            # Serialized Random Forest model artifact
│   └── requirements_ml.txt                  # ML dependencies (pandas, scikit-learn, shap)
│
├── counseling_engine/                       # GenAI Counseling Decision Support
│   ├── prompts/
│   │   └── counselor_prompt.txt             # System prompt with restorative tone guidelines
│   ├── advisor.py                           # Gemini 1.5 Flash client + offline fallback engine
│   ├── test_counseling.py                   # Verification suite running on mock profiles
│   ├── test_edge_cases.py                   # Stress testing for missing fields and boundary scores
│   ├── verify_llm_connection.py             # Rapid connectivity probe for Gemini API
│   ├── sample_counseling_notes.md           # Curated deliverable containing synthesized memos
│   ├── day7_presentation_deck.html          # Interactive slide presentation
│   └── requirements_ai.txt                  # AI dependencies (google-generativeai, requests)
│
├── frontend/                                # Modern Responsive Web Application
│   ├── index.html                           # Single-page dashboard with Linear-style theme
│   ├── styles.css                           # Neo-brutalist styling, animations, badge rules
│   ├── js/
│   │   ├── app.js                           # Table rendering, search, multi-column sorting
│   │   ├── charts.js                        # Animated SVG radial gauge & SHAP bar charts
│   │   └── modal.js                         # Student drawer, What-If simulator, PDF exporter
│   └── mock_students.json                   # Standalone preview data
│
├── server/                                  # Integration API Layer
│   ├── main.py                              # FastAPI service orchestrating ML + GenAI
│   └── requirements_server.txt              # Server dependencies (fastapi, uvicorn)
│
├── test_integration.py                      # Comprehensive 5-point test harness
├── run_project.py                           # Automatic Python-based launcher
├── start_app.bat                            # Windows one-click batch launcher
├── requirements.txt                         # Complete consolidated project dependencies
├── DropGuard_2Member_50_50_Presentation_Deck.md # Presentation slides content
└── README.md                                # Comprehensive repository documentation
```

---

## 🧪 Verification & Test Matrix

The platform includes automated testing across every tier to verify zero regression:

| Test Script | Component Under Test | Scope & Checks | Status |
| :--- | :--- | :--- | :---: |
| `test_integration.py` | Full System & FastAPI Endpoints | Validates `/api/health`, `/api/students`, `/api/predict`, and `/api/counsel` | **5/5 Passed** |
| `counseling_engine/test_edge_cases.py` | LLM Robustness & Schema Adherence | Boundary scores ($0.00, 1.00$), missing GPA, unlisted major, empty SHAP | **5/5 Passed** |
| `counseling_engine/test_counseling.py` | Counseling Generation Quality | Evaluates 10 diverse profiles for required JSON schema and non-punitive tone | **10/10 Passed** |
| `counseling_engine/verify_llm_connection.py` | Gemini API Connectivity | Verifies network pathway, authentication key, and payload round-trip | **Passed** |
| `ml_engine/benchmark_models.py` | Model Accuracy & Reproducibility | 5-Fold cross-validation, holdout test metrics, confusion matrices | **Passed** |

To run the complete test suite:
```bash
python test_integration.py
python counseling_engine/test_edge_cases.py
python counseling_engine/test_counseling.py
```

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
* Python 3.10, 3.11, or 3.12
* Git
* (Optional) Google Gemini API Key — [Get a free API key](https://aistudio.google.com/)

---

### Option 1: One-Click Instant Launch (Windows)
Double-click `start_app.bat` or run:
```powershell
python run_project.py
```
This launcher checks requirements, installs missing dependencies, starts the FastAPI server, and opens `http://127.0.0.1:8000` in your default browser.

---

### Option 2: Manual Setup with Virtual Environment

#### 1. Clone Repository & Setup Virtual Environment
```bash
git clone https://github.com/TanyaTejaswi/DropGuard.git
cd DropGuard

# Create and activate virtual environment
python -m venv .venv

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. (Optional) Configure Gemini API Key
```bash
# On Windows PowerShell:
$env:GEMINI_API_KEY="your-actual-api-key"

# On macOS / Linux:
export GEMINI_API_KEY="your-actual-api-key"
```
*(Note: If omitted, DropGuard automatically uses its built-in expert fallback engine without crashing).*

#### 4. Run the Full Integrated Server
```bash
uvicorn server.main:app --reload --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

### Option 3: Standalone Frontend Preview (Zero Backend Required)
The UI can run completely offline for design reviews:
1. Navigate to the `frontend/` directory.
2. Open `index.html` directly in Google Chrome, Microsoft Edge, or Firefox.
3. The interface will automatically load mock students from `frontend/mock_students.json`.

---

## 📡 REST API Reference

The FastAPI service exposes clean REST endpoints:

### 1. System Health Check
`GET /api/health`
```json
{
  "status": "healthy",
  "model_loaded": true,
  "gemini_api_configured": true,
  "timestamp": "2026-11-18T13:50:00Z"
}
```

### 2. Retrieve Student Roster
`GET /api/students`
Returns an array of student profiles matching `contracts/student_schema.json`.

### 3. Compute Risk Prediction & SHAP Factors
`POST /api/predict`
* **Request Body:** Student profile object.
* **Response Body:**
```json
{
  "student_id": "STU-001",
  "risk_score": 0.82,
  "risk_level": "High",
  "top_factors": [
    "Completed only 1 of 6 registered credits in Semester 2",
    "Tuition fees currently overdue",
    "First semester grade average below 9.5/20"
  ],
  "confidence": 0.94
}
```

### 4. Synthesize Counseling Recommendations
`POST /api/counsel`
* **Request Body:** Student profile object + computed risk prediction.
* **Response Body:**
```json
{
  "student_id": "STU-001",
  "summary": "Alex is experiencing significant academic deceleration compounded by an active tuition hold, leading to an elevated attrition probability.",
  "action_items": [
    "Connect with Student Financial Services before Friday regarding installment payment options.",
    "Schedule an academic review with the STEM Learning Center for Calculus II peer tutoring.",
    "Confirm degree roadmap milestone check-in with faculty advisor."
  ],
  "meeting_talking_points": [
    "Begin with an open inquiry regarding personal or financial pressures affecting recent terms.",
    "Present emergency bursar micro-grant alternatives to clear registration holds.",
    "Collaboratively adjust semester course load to prevent burnout."
  ]
}
```

---

## 🛡️ Ethical Considerations & Privacy Guardrails

1. **Human-in-the-Loop Decision Support:** DropGuard is strictly an advisory decision-support system. It never triggers automated academic penalties, admissions disqualifications, or financial holds.
2. **Explainability Over Black-Box Confidence:** By making SHAP factor attribution mandatory, counselors can verify whether a prediction is driven by actionable academic factors or temporary non-academic anomalies.
3. **Data Minimization:** No personally identifying health information or discriminatory protected traits (race, religious affiliation, sexual orientation) are included in model features.
4. **Tone & Growth Mindset:** The LLM counseling engine explicitly follows restorative guidelines to prevent bias, blame, or deficit-based labeling in student communications.

---

## 📄 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.
