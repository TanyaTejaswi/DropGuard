"""
DropGuard - Counseling Advisor Engine (Member 2)
Contract:
  Input: student_profile (dict), top_risk_factors (list of str)
  Output: Strict dictionary complying with contracts/student_schema.json:
    - summary: str
    - action_items: list of str
    - meeting_talking_points: list of str
"""

import os
import json

PROMPT_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "prompts", "counselor_prompt.txt")

def generate_counseling_memo(student_profile: dict, top_risk_factors: list) -> dict:
    """
    Generates a structured counseling memo using Gemini API or a rule-based expert fallback.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Fallback heuristic / mock generator when API key is not yet configured
    if not api_key:
        name = student_profile.get("name", "The student")
        attendance = student_profile.get("attendance_pct", 80)
        risk_level = student_profile.get("prediction", {}).get("risk_level", "Medium")
        
        return {
            "summary": f"{name} is flagged with {risk_level} dropout risk. Main concerns involve attendance ({attendance}%) and academic adaptation.",
            "action_items": [
                "Schedule a 1-on-1 counselor intake to discuss schedule and academic difficulties.",
                "Connect student with departmental peer tutoring support.",
                "Establish a bi-weekly check-in schedule to monitor progression."
            ],
            "meeting_talking_points": [
                "How are you finding the pace of the semester so far?",
                "Are there any commute, personal, or external commitments affecting your class attendance?",
                "What resources or assistance would help you feel more confident in your coursework?"
            ]
        }
    
    # Member 2 integrates google-genai client here with GEMINI_API_KEY:
    # client = genai.Client(api_key=api_key)
    # response = client.models.generate_content(...)
    pass
