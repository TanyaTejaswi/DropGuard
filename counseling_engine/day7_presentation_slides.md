# DropGuard: Member 2 Day 7 Presentation Slides & Persona Dossier
**Component:** AI Academic Counseling Recommendation Engine  
**Role:** Member 2 (AI Counseling Lead)  
**Deliverable:** Day 7 Presentation Slide Deck & Case Study Dossier  

---

## Slide 1: Title & Strategic Mission
### Slide Header:
# DropGuard: From Prediction to Pastoral Action
### Sub-header:
*Empowering University Advisors with Explainable Risk Signals & Automated Intervention Memos*

### Speaker Notes:
> "Good morning evaluators and faculty. In early warning systems, a machine learning score is only as valuable as the action it inspires. Knowing a student has an 88% risk of dropping out does not help if an advisor has only 15 minutes between appointments. As Member 2, I developed DropGuard's AI Counseling Engine. It takes tabular ML predictions and SHAP explainability signals, and transforms them in under 200 milliseconds into empathetic, legally compliant, and actionable counseling memos."

---

## Slide 2: The Core Challenge: The "Cold Data" Problem
### Bullet Points:
- **The Warning Gap:** Faculty dashboards show red numbers (e.g. `Risk: 0.88`), but no clinical guidance on *why* or *what to do*.
- **Advisor Burnout:** University advisors manage hundreds of students each semester, making manual diagnostic research prohibitive.
- **Punitive vs. Supportive:** Without contextual empathy, automated notifications feel accusatory to vulnerable students, triggering withdrawal rather than engagement.
- **DropGuard's Solution:** A contract-first GenAI engine that synthesizes **Contextual Diagnosis**, **Verifiable Administrative Remedies**, and **Psychologically Informed Dialogue Prompts**.

---

## Slide 3: The 3 Core Persona Archetypes (Before vs. After)
### Comparative Matrix Table:

| Persona Archetype | Student Profile | Traditional Institutional Response (Before) | DropGuard AI Counseling Memo (After) | Expected Real-World Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Persona 1: Acute Academic Attrition** | **Maria Silva (`STU-101`)**<br>• CS Sem 2<br>• GPA: 7.4/20<br>• Att: 54% | Generic automated email: *"Warning: Your GPA is below threshold. Attend mandatory dean hearing or face deregistration."* | **Empathic Compact:**<br>1. Identifies early algorithms failure as root stumbling block.<br>2. Deploys peer tutoring.<br>3. Co-signs Attendance Recovery Compact with bi-weekly advisor sign-offs.<br>4. Explores commute/housing friction. | Eliminates academic paralysis; restores fundamental mastery before withdrawal threshold. |
| **Persona 2: Socio-Economic & Debt Stress** | **Lucas Santos (`STU-102`)**<br>• EE Sem 4<br>• GPA: 8.9/20<br>• Late Tuition Arrears | Administrative fee block: Exam registration blocked due to bursar hold, exacerbating course failure. | **Holistic Support:**<br>1. Distinguishes financial hardship from lack of academic aptitude.<br>2. Fast-tracks emergency campus bursar payment installment plan.<br>3. Drops 1 elective to reduce credit overload without delaying degree completion. | Prevents forced financial withdrawal; preserves student dignity and emotional well-being. |
| **Persona 3: High-Aptitude Vocational Breach** | **Diogo Ribeiro (`STU-110`)**<br>• CS Sem 4<br>• GPA: 15.2/20<br>• Att: 52% (Work 30h/wk) | Blind bureaucratic penalty: Deregistered for violating 70% attendance rule despite excelling in all exams. | **Flexible Accommodation:**<br>1. Recognizes high capability.<br>2. Formalizes working-student status dispensation.<br>3. Negotiates asynchronous credit alternatives with department chair. | Retains high-performing talent; aligns university policy with modern student employment realities. |

---

## Slide 4: Architectural Blueprint & Contract Guarantee
### Diagram & Guarantees:
```
  [ Member 1: ML Model + SHAP ]
                 │
                 ▼ (Risk Float + 3 Human-Readable Strings)
  ┌──────────────────────────────────────────────┐
  │         Member 2: Counseling Engine          │
  │  1. Prompt Interpolation (Zero Leakage)     │
  │  2. Gemini GenAI API / Expert Fallback       │
  │  3. Strict 3-Key JSON Schema Parser          │
  └──────────────────────────────────────────────┘
                 │
                 ▼ (contracts/student_schema.json)
      {
        "summary": "...",
        "action_items": ["...", "..."],
        "meeting_talking_points": ["...", "..."]
      }
                 │
                 ▼
     [ Member 3: UI Drawer & PDF Report ]
```
- **Zero Hallucination Tolerance:** Strict regex JSON boundaries and fallback deterministic heuristics guarantee zero crashes and 100% contract compliance.
- **Non-Punitive Mandate:** Every prompt strictly prohibits punitive language, prioritizing restorative coaching and supportive guardrails.

---

## Slide 5: Live Demonstration Workflow (Day 7 Flow)
### 3-Step Live Demo Execution:
1. **Search & Identification:** Search `STU-101` in the roster; inspect high-risk alert badge and attendance deficit.
2. **Explainability Inspection:** Review top SHAP drivers (*"18 unexcused lecture absences"*, *"Failed Midterm Exam 1"*).
3. **Memo Review & Export:** Open student drawer, examine the AI synthesized strategy and discussion prompts, and click **"Export / Print PDF"** to produce an official university counseling dossier.
