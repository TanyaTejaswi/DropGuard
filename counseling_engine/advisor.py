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
import random
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


def generate_expert_fallback_memo(student_profile: dict, top_risk_factors: list, regen_counter=None) -> dict:
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

    variant = int(regen_counter) % 3 if regen_counter is not None else random.choice([0, 1, 2])
    action_items = []
    talking_points = []

    # Dynamic Persona & Strategy Synthesis
    if risk_level == "High":
        if has_financial_issue and has_academic_failure:
            if variant == 0:
                summary = (
                    f"{name} is experiencing compounding academic distress intertwined with severe financial constraints. "
                    f"With a CGPA of {gpa}/10 and outstanding institutional obligations, the risk of discontinuation is acute."
                )
                action_items = [
                    "Fast-track emergency financial aid review with the campus Student Bursar office.",
                    "Audit semester workload and evaluate dropping one high-demand elective to protect core GPA.",
                    "Assign an academic success coach for weekly structured check-ins."
                ]
                talking_points = [
                    "Gently inquire about external financial stresses and part-time job commitments.",
                    "Discuss creating an individualized repayment schedule and balancing study hours."
                ]
            elif variant == 1:
                summary = (
                    f"Socio-Financial Intervention Required: {name} faces pressing institutional fee obligations alongside "
                    f"a {gpa}/10 CGPA, necessitating bursar coordination and academic relief."
                )
                action_items = [
                    "Establish a formal tuition installment schedule to remove registration hold flags.",
                    "Enroll in faculty peer-tutoring clinics for foundational coursework recovery.",
                    "Review on-campus work-study positions with flexible scheduling."
                ]
                talking_points = [
                    "Explore grant aid eligibility and review installment flexibility with financial services.",
                    "Map out prerequisite course recovery milestones without overloading weekly hours."
                ]
            else:
                summary = (
                    f"Integrated Recovery Strategy: Critical retention risk for {name} driven by tuition arrears and course difficulties. "
                    f"A dual financial-academic compact is essential this semester."
                )
                action_items = [
                    "Submit an expedited request for university emergency student hardship assistance.",
                    "Arrange weekly check-in sessions with academic department mentor.",
                    "Optimize course timetable to allow dedicated study periods around work commitments."
                ]
                talking_points = [
                    "Discuss balancing employment obligations with assignment submission deadlines.",
                    "Reassure the student of departmental resources and available hardship funds."
                ]

        elif has_attendance_issue and has_academic_failure:
            if variant == 0:
                summary = (
                    f"{name} presents critical dropout vulnerability driven by severe lecture absenteeism ({attendance}%) "
                    f"and poor course assessments ({gpa}/10) in {program}."
                )
                action_items = [
                    "Issue a formal attendance notice and execute an Attendance Recovery Compact.",
                    "Enroll student in mandatory peer-assisted tutoring for flagged prerequisite courses.",
                    "Schedule bi-weekly counseling progress reviews with the department chair."
                ]
                talking_points = [
                    "Investigate root causes of morning class absences, including commute or health challenges.",
                    "Identify foundational course bottlenecks and map out achievable credit milestones."
                ]
            elif variant == 1:
                summary = (
                    f"Priority Academic Realignment: {name} is at acute risk in {program} due to lagging attendance ({attendance}%) "
                    f"and a {gpa}/10 CGPA. Workload restructuring is recommended."
                )
                action_items = [
                    "Conduct a credit audit to evaluate auditing or retaking flagged core modules.",
                    "Assign a dedicated graduate teaching assistant for weekly problem-solving labs.",
                    "Establish a mandatory weekly attendance verification log with course professors."
                ]
                talking_points = [
                    "Discuss course pacing and pinpoint specific lecture topics causing disengagement.",
                    "Explore flexible transport or schedule adjustments to reduce morning absence rates."
                ]
            else:
                summary = (
                    f"Targeted Retention Plan: Chronic absence ({attendance}%) combined with examination deficits ({gpa}/10) "
                    f"requires an intensive, milestone-based intervention for {name} in {program}."
                )
                action_items = [
                    "Fast-track student into the faculty's mid-semester recovery study groups.",
                    "Draft an advisor-signed attendance agreement with weekly check-ins.",
                    "Provide access to recorded lecture materials and remedial question banks."
                ]
                talking_points = [
                    "Check in empathetically on personal or external pressures impacting classroom focus.",
                    "Co-create an achievable weekly timetable with dedicated, distraction-free study blocks."
                ]

        elif has_work_conflict or has_attendance_issue:
            if variant == 0:
                summary = (
                    f"{name} displays significant attendance attrition ({attendance}%) likely resulting from heavy outside commitments, "
                    f"jeopardizing institutional progression despite underlying academic capability."
                )
                action_items = [
                    "Review campus policy on working student accommodations and formalize registration status.",
                    "Establish a flexible lecture attendance dispensation agreement with faculty.",
                    "Provide asynchronous study materials and recorded lecture access."
                ]
                talking_points = [
                    "Discuss total weekly working hours and evaluate their impact on classroom focus.",
                    "Explore moving to part-time enrollment if employment obligations cannot be adjusted."
                ]
            elif variant == 1:
                summary = (
                    f"Schedule Harmonization Memo: {name}'s attendance rate ({attendance}%) signals substantial schedule friction. "
                    f"Proactive faculty adjustments will prevent unexcused absence de-registration."
                )
                action_items = [
                    "Formalize an official working-student dispensation with the academic dean's office.",
                    "Shift course assignments to asynchronous digital submissions where possible.",
                    "Schedule monthly milestone reviews to monitor syllabus coverage."
                ]
                talking_points = [
                    "Review shift timings and commute obstacles to formulate an optimized weekly routine.",
                    "Clarify mandatory practical and lab requirements that must be attended in person."
                ]
            else:
                summary = (
                    f"Alternative Scheduling Strategy: Outside obligations are creating acute lecture absence ({attendance}%) for {name}. "
                    f"Advisory intervention is targeted at maintaining academic progression."
                )
                action_items = [
                    "Coordinate with department coordinator for recorded lecture and lab makeup permissions.",
                    "Formulate a customized self-paced learning schedule for semester {semester}.",
                    "Ensure student remains aware of mandatory mid-term assessment dates."
                ]
                talking_points = [
                    "Discuss employment demands and explore potential remote or on-campus student roles.",
                    "Confirm commitment to critical examination windows and course evaluations."
                ]

        else:
            if variant == 0:
                summary = (
                    f"{name} is currently flagged with High dropout risk ({int(risk_score * 100)}%). "
                    f"Immediate academic and pastoral intervention is required to stabilize progression in semester {semester}."
                )
                action_items = [
                    "Convene an urgent 1-on-1 advisor diagnostic intake.",
                    "Connect student with university academic tutoring and psychological counseling services.",
                    "Establish a milestone recovery contract with scheduled mid-semester evaluations."
                ]
                talking_points = [
                    "Explore holistic well-being and identify any external obstacles impeding study routines.",
                    "Reaffirm institutional support systems and co-develop an immediate recovery plan."
                ]
            else:
                summary = (
                    f"Emergency Academic Support Protocol: High risk indicators ({int(risk_score * 100)}%) flagged for {name} in {program}. "
                    f"Proactive institutional support will mitigate attrition risk."
                )
                action_items = [
                    "Schedule an in-depth advising consultation to evaluate subject difficulties.",
                    "Coordinate peer study partnerships for core theoretical modules.",
                    "Implement a bi-weekly academic progress check-in schedule."
                ]
                talking_points = [
                    "Identify specific academic units where workload feels unmanageable.",
                    "Establish short-term, achievable goals for the next three weeks."
                ]

    elif risk_level == "Medium":
        if has_financial_issue:
            if variant == 0:
                summary = (
                    f"{name} is making steady academic progress ({gpa}/10) but faces emerging financial friction that could "
                    f"threaten upcoming enrollment continuity."
                )
                action_items = [
                    "Connect student with the campus financial counselor to explore tuition grant programs.",
                    "Review payment deadlines to avoid administrative registration holds.",
                    "Explore on-campus student worker options with tuition deduction support."
                ]
                talking_points = [
                    "Discuss financial planning and explore available emergency student grants.",
                    "Ensure student is aware of work-study opportunities on campus."
                ]
            elif variant == 1:
                summary = (
                    f"Financial Stability Advising: {name} maintains viable grades ({gpa}/10), but pending fee notices "
                    f"may disrupt enrollment if left unresolved."
                )
                action_items = [
                    "Facilitate an installment plan request with the university bursar.",
                    "Review external scholarship and emergency endowment eligibility.",
                    "Establish proactive payment milestone dates before semester exams."
                ]
                talking_points = [
                    "Discuss financial barriers frankly in an empathetic, supportive setting.",
                    "Outline step-by-step procedures to request fee extension waivers."
                ]
            else:
                summary = (
                    f"Tuition & Support Check-In: {name} is at moderate risk ({int(risk_score * 100)}%) due to fee pressures. "
                    f"Early financial aid coordination will keep their semester on track."
                )
                action_items = [
                    "Submit a priority bursar review to pause any late-fee penalties.",
                    "Match student with short-term hardship bursaries or textbook vouchers.",
                    "Schedule a 2-week follow-up to confirm payment plan approval."
                ]
                talking_points = [
                    "Ask whether part-time work or family expenses are making fee deadlines harder.",
                    "Walk through the exact documents needed for fee relief."
                ]

        elif has_disengagement or has_work_conflict:
            if variant == 0:
                summary = (
                    f"{name} maintains reasonable grades but exhibits signs of schedule compression or digital disengagement, "
                    f"requiring proactive intervention before coursework slips."
                )
                action_items = [
                    "Provide a time-management and LMS portal milestone planner.",
                    "Establish regular check-ins with course teaching assistants.",
                    "Recommend small-group seminar study tables for collaborative learning."
                ]
                talking_points = [
                    "Discuss time-blocking techniques to handle project deadlines smoothly.",
                    "Assess if coursework pace or remote assignment submission is creating friction."
                ]
            elif variant == 1:
                summary = (
                    f"Engagement Recovery Memo: Early signs of portal inactivity or scheduling strain detected for {name}. "
                    f"Targeted coaching will maintain student momentum."
                )
                action_items = [
                    "Review weekly course portal access and assignment deadlines.",
                    f"Connect student with study circle peers in {program}.",
                    "Set up an advisor reminder sequence ahead of key milestone deadlines."
                ]
                talking_points = [
                    "Explore study environment setup and potential digital or material barriers.",
                    "Help prioritize competing assignment deadlines for the upcoming fortnight."
                ]
            else:
                summary = (
                    f"Schedule Balance Plan: {name} shows moderate attendance and workload strain in {program}. "
                    f"A structured weekly routine will prevent missed classes from affecting grades."
                )
                action_items = [
                    "Check if lab or tutorial sections can be switched to better-fitting time slots.",
                    "Share recorded lecture links and key weekly summary notes.",
                    "Set up a quick bi-weekly check-in to track attendance recovery."
                ]
                talking_points = [
                    "Ask which days or class times are hardest to attend and why.",
                    "Agree on two small, realistic attendance goals for the next 14 days."
                ]

        else:
            if variant == 0:
                summary = (
                    f"{name} is in a transitional phase with moderate dropout indicators ({int(risk_score * 100)}% risk). "
                    f"Targeted study habits and proactive advisor support will solidify academic standing."
                )
                action_items = [
                    "Recommend enrollment in departmental study circles and quantitative workshops.",
                    "Conduct a mid-semester degree check to ensure prerequisite trajectory.",
                    "Review foundational lecture materials with course teaching assistant."
                ]
                talking_points = [
                    "Evaluate adaptation to current course load and identify any subject-specific questions.",
                    "Formulate a balanced weekly study schedule to prevent pre-exam cramming."
                ]
            elif variant == 1:
                summary = (
                    f"Mid-Semester Coaching Plan: {name} shows moderate risk ({int(risk_score * 100)}%) in {program}. "
                    f"Early tutoring and clearer exam prep will help turn borderline grades into solid passes."
                )
                action_items = [
                    "Pair student with a senior peer mentor for weekly core-subject review.",
                    "Break upcoming assignments into weekly checkpoints with the advisor.",
                    "Encourage attending faculty office hours before the next quiz or midterm."
                ]
                talking_points = [
                    "Identify which specific subject feels most challenging right now.",
                    "Discuss practical study techniques that fit their weekly routine."
                ]
            else:
                summary = (
                    f"Proactive Retention Support: {name} has a {gpa}/10 CGPA and {attendance}% attendance, placing them in the medium-risk range. "
                    f"Consistent check-ins will help build momentum before finals."
                )
                action_items = [
                    "Set up a 3-week academic check-in to monitor quiz and lab scores.",
                    "Provide practice problem sets and exam-prep clinic schedules.",
                    "Confirm all core semester credits are on track for completion."
                ]
                talking_points = [
                    "Check in on overall stress levels, sleep, and study balance.",
                    "Celebrate strengths so far and map out a clear path to the end of the term."
                ]

    else:  # Low Risk
        if variant == 0:
            summary = (
                f"{name} demonstrates commendable academic resilience with strong attendance ({attendance}%) and a solid CGPA of {gpa}/10, "
                f"indicating low dropout vulnerability ({int(risk_score * 100)}%)."
            )
            action_items = [
                "Encourage student to apply for departmental peer-tutoring and undergraduate research roles.",
                "Provide information on academic honors, internships, and student leadership opportunities.",
                "Encourage participation in technical student societies and hackathons."
            ]
            talking_points = [
                "Congratulate the student on consistent academic discipline and performance.",
                "Discuss long-term career aspirations, industry placements, and graduate study options."
            ]
        else:
            summary = (
                f"High-Retention Profile: {name} exhibits excellent engagement ({attendance}% attendance, {gpa}/10 CGPA). "
                f"Focus is on career acceleration and honors-level enrichment."
            )
            action_items = [
                "Recommend student for departmental dean's list and merit recognition.",
                "Connect student with alumni mentorship and corporate internship programs.",
                "Suggest advanced elective options for upcoming semester."
            ]
            talking_points = [
                "Commend academic consistency and explore research project interests.",
                "Discuss resume building, industry certifications, and summer internship timelines."
            ]

    return {
        "summary": summary,
        "action_items": action_items[:3],
        "meeting_talking_points": talking_points[:3],
        "talking_points": talking_points[:3]  # Backwards compatibility alias
    }


def generate_counseling_memo(student_profile: dict, top_risk_factors: list, regen_counter=None) -> dict:
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
    return generate_expert_fallback_memo(student_profile, top_risk_factors, regen_counter=regen_counter)


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
