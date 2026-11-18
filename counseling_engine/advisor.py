"""
DropGuard - Counseling Advisor Engine (Member 2)

Contract Specification:
  Input:
    - student_profile (dict): Full or partial student attributes adhering to student_schema.json
    - top_risk_factors (list of str): Human-readable risk factors from SHAP / inference engine
  Output:
    - Strict dictionary adhering to contracts/student_schema.json:
      {
        "summary": str,
        "action_items": list of str,
        "meeting_talking_points": list of str
      }
"""

import os
import re
import json
import urllib.request
import urllib.error

PROMPT_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "prompts", "counselor_prompt.txt")


def load_prompt_template() -> str:
    """Loads the counselor system prompt template from disk."""
    if os.path.exists(PROMPT_TEMPLATE_PATH):
        with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return (
        "You are an academic advisor. Analyze the student and provide JSON with "
        "summary, action_items, and meeting_talking_points."
    )


def extract_json_from_llm_response(text: str) -> dict:
    """
    Bulletproof extraction and parsing of JSON from LLM output,
    stripping markdown fences, trailing commas, or leading preamble.
    """
    if not text:
        return {}

    # Strip code block fences ```json ... ```
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned.strip(), flags=re.MULTILINE).strip()

    # Find the outermost JSON object bounds
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        candidate = cleaned[start_idx : end_idx + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # Attempt to fix common trailing comma errors
            fixed = re.sub(r",\s*([\]}])", r"\1", candidate)
            return json.loads(fixed)

    return json.loads(cleaned)


def call_gemini_api(prompt: str, api_key: str) -> str:
    """
    Direct REST API invocation to Google Gemini API (gemini-1.5-flash / gemini-2.0-flash).
    Zero external dependencies, robust across all Python runtimes.
    """
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "topP": 0.95,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json"
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        candidates = res_data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")
    return ""


def generate_expert_fallback_memo(student_profile: dict, top_risk_factors: list) -> dict:
    """
    Domain-Specific Expert Fallback Counseling Engine.
    Employs pedagogical heuristics to tailor empathetic, actionable intervention
    plans based on student risk severity and identified root drivers (academic, financial, attendance).
    """
    name = student_profile.get("name", "The student")
    student_id = student_profile.get("student_id", "STU-000")
    program = student_profile.get("program", "their degree program")
    semester = student_profile.get("semester", 1)
    attendance = float(student_profile.get("attendance_pct", 75.0))
    gpa = float(student_profile.get("gpa", 10.0))

    prediction = student_profile.get("prediction", {})
    risk_score = float(prediction.get("risk_score", 0.50))
    risk_level = prediction.get("risk_level", "Medium")

    # Analyze risk drivers from strings
    factor_text = " ".join(top_risk_factors).lower()
    has_attendance_issue = (
        attendance < 70.0
        or "absence" in factor_text
        or "attendance" in factor_text
        or "unexcused" in factor_text
    )
    has_financial_issue = (
        "tuition" in factor_text
        or "debt" in factor_text
        or "financial" in factor_text
        or "fee" in factor_text
        or "installment" in factor_text
    )
    has_academic_failure = (
        gpa < 9.5
        or "fail" in factor_text
        or "exam" in factor_text
        or "prerequisite" in factor_text
        or "credit" in factor_text
    )
    has_disengagement = (
        "lms" in factor_text
        or "missed" in factor_text
        or "unresponsive" in factor_text
        or "deadline" in factor_text
    )
    has_work_conflict = (
        "work" in factor_text
        or "shift" in factor_text
        or "commute" in factor_text
        or "freelance" in factor_text
    )

    action_items = []
    talking_points = []

    # Dynamic Persona & Strategy Synthesis
    if risk_level == "High":
        if has_financial_issue and has_academic_failure:
            summary = (
                f"{name} is experiencing compounding academic distress intertwined with severe financial constraints. "
                f"With a CGPA of {gpa}/10 and outstanding institutional obligations, the risk of discontinuation is acute."
            )
            action_items.append("Fast-track emergency financial aid review with the campus Student Bursar office.")
            action_items.append("Audit semester workload and evaluate dropping one high-demand elective to protect core GPA.")
            action_items.append("Assign an academic success coach for weekly structured check-ins.")
            talking_points.append("Gently inquire about external financial stresses and part-time job commitments.")
            talking_points.append("Discuss creating an individualized repayment schedule and balancing study hours.")

        elif has_attendance_issue and has_academic_failure:
            summary = (
                f"{name} presents critical dropout vulnerability driven by severe lecture absenteeism ({attendance}%) "
                f"and poor course assessments ({gpa}/10) in {program}."
            )
            action_items.append("Issue a formal attendance notice and execute an Attendance Recovery Compact.")
            action_items.append("Enroll student in mandatory peer-assisted tutoring for flagged prerequisite courses.")
            action_items.append("Schedule bi-weekly counseling progress reviews with the department chair.")
            talking_points.append("Investigate root causes of morning class absences, including commute or health challenges.")
            talking_points.append("Identify foundational course bottlenecks and map out achievable credit milestones.")

        elif has_work_conflict or has_attendance_issue:
            summary = (
                f"{name} displays significant attendance attrition ({attendance}%) likely resulting from heavy outside commitments, "
                f"jeopardizing institutional progression despite underlying academic capability."
            )
            action_items.append("Review campus policy on working student accommodations and formalize registration status.")
            action_items.append("Establish a flexible lecture attendance dispensation agreement with faculty.")
            action_items.append("Provide asynchronous study materials and recorded lecture access.")
            talking_points.append("Discuss total weekly working hours and evaluate their impact on classroom focus.")
            talking_points.append("Explore moving to part-time enrollment if employment obligations cannot be adjusted.")

        else:
            summary = (
                f"{name} is currently flagged with High dropout risk ({int(risk_score * 100)}%). "
                f"Immediate academic and pastoral intervention is required to stabilize progression in semester {semester}."
            )
            action_items.append("Convene an urgent 1-on-1 advisor diagnostic intake.")
            action_items.append("Connect student with university academic tutoring and psychological counseling services.")
            action_items.append("Establish a milestone recovery contract with scheduled mid-semester evaluations.")
            talking_points.append("Explore holistic well-being and identify any external obstacles impeding study routines.")
            talking_points.append("Reaffirm institutional support systems and co-develop an immediate recovery plan.")

    elif risk_level == "Medium":
        if has_financial_issue:
            summary = (
                f"{name} is making steady academic progress ({gpa}/10) but faces emerging financial friction that could "
                f"threaten upcoming enrollment continuity."
            )
            action_items.append("Connect student with the campus financial counselor to explore tuition grant programs.")
            action_items.append("Review payment deadlines to avoid administrative registration holds.")
            talking_points.append("Discuss financial planning and explore available emergency student grants.")
            talking_points.append("Ensure student is aware of work-study opportunities on campus.")

        elif has_disengagement or has_work_conflict:
            summary = (
                f"{name} maintains reasonable grades but exhibits signs of schedule compression or digital disengagement, "
                f"requiring proactive intervention before coursework slips."
            )
            action_items.append("Provide a time-management and LMS portal milestone planner.")
            action_items.append("Establish regular check-ins with course teaching assistants.")
            talking_points.append("Discuss time-blocking techniques to handle project deadlines smoothly.")
            talking_points.append("Assess if coursework pace or remote assignment submission is creating friction.")

        else:
            summary = (
                f"{name} is in a transitional phase with moderate dropout indicators ({int(risk_score * 100)}% risk). "
                f"Targeted study habits and proactive advisor support will solidify academic standing."
            )
            action_items.append("Recommend enrollment in departmental study circles and quantitative workshops.")
            action_items.append("Conduct a mid-semester degree check to ensure prerequisite trajectory.")
            talking_points.append("Evaluate adaptation to current course load and identify any subject-specific questions.")
            talking_points.append("Formulate a balanced weekly study schedule to prevent pre-exam cramming.")

    else:  # Low Risk
        summary = (
            f"{name} demonstrates commendable academic resilience with strong attendance ({attendance}%) and a solid CGPA of {gpa}/10, "
            f"indicating low dropout vulnerability ({int(risk_score * 100)}%)."
        )
        action_items.append("Encourage student to apply for departmental peer-tutoring and undergraduate research roles.")
        action_items.append("Provide information on academic honors, internships, and student leadership opportunities.")
        talking_points.append("Congratulate the student on consistent academic discipline and performance.")
        talking_points.append("Discuss long-term career aspirations, industry placements, and graduate study options.")

    return {
        "summary": summary,
        "action_items": action_items[:3],
        "meeting_talking_points": talking_points[:3],
        "talking_points": talking_points[:3]  # Backwards compatibility alias
    }


def generate_counseling_memo(student_profile: dict, top_risk_factors: list) -> dict:
    """
    Primary interface for DropGuard Counseling Engine.
    Takes a student profile and risk factors, executes GenAI generation with strict
    schema validation, and seamlessly falls back to high-fidelity expert logic when needed.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if api_key:
        try:
            template = load_prompt_template()
            factors_formatted = "\n".join([f"- {f}" for f in top_risk_factors]) if top_risk_factors else "- No major risk factors flagged."
            
            prediction = student_profile.get("prediction", {})
            risk_score = prediction.get("risk_score", 0.5)
            risk_level = prediction.get("risk_level", "Medium")

            prompt = template.format(
                student_id=student_profile.get("student_id", "STU-UNKNOWN"),
                name=student_profile.get("name", "Student"),
                program=student_profile.get("program", "General Studies"),
                semester=student_profile.get("semester", 1),
                gpa=student_profile.get("gpa", 5.0),
                attendance_pct=student_profile.get("attendance_pct", 80.0),
                risk_score=risk_score,
                risk_level=risk_level,
                top_risk_factors=factors_formatted
            )

            raw_text = call_gemini_api(prompt, api_key)
            parsed = extract_json_from_llm_response(raw_text)

            # Contract verification
            if (
                isinstance(parsed, dict)
                and "summary" in parsed
                and "action_items" in parsed
                and (
                    "meeting_talking_points" in parsed
                    or "talking_points" in parsed
                )
            ):
                prompts = parsed.get("meeting_talking_points") or parsed.get("talking_points", [])
                return {
                    "summary": str(parsed["summary"]),
                    "action_items": list(parsed["action_items"]),
                    "meeting_talking_points": list(prompts),
                    "talking_points": list(prompts)
                }
        except Exception as e:
            # Non-blocking graceful fallback on API rate limit, network timeout, or schema mismatch
            print(f"[CounselingEngine] LLM API note: {e}. Utilizing expert advisor heuristic.")

    # High-fidelity domain expert fallback
    return generate_expert_fallback_memo(student_profile, top_risk_factors)


if __name__ == "__main__":
    test_stu = {
        "student_id": "STU-101",
        "name": "Maria Silva",
        "program": "Computer Science",
        "semester": 2,
        "attendance_pct": 54.0,
        "gpa": 7.4,
        "prediction": {"risk_score": 0.88, "risk_level": "High"}
    }
    factors = ["18 unexcused lecture absences", "Failed Midterm Exam 1 (6.5/20)"]
    memo = generate_counseling_memo(test_stu, factors)
    print(json.dumps(memo, indent=2))
