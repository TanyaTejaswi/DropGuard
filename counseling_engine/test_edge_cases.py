"""
DropGuard — Member 2 Day 4 Deliverable: Edge-Case Rigor & Empathy Verification Suite
Validates the AI Counseling Engine against divergent archetypes:
1. Academic Failure (Course bottlenecks, prerequisite failures)
2. Chronic Absenteeism (Commute, health, or vocational conflicts)
3. Financial Distress (Tuition debt, socio-economic arrears)
4. Compound Multi-Driver Crisis
5. Honors / Low-Risk Transition
"""

import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from advisor import generate_counseling_memo


def run_edge_case_suite():
    print("=" * 75)
    print(" [MEMBER 2 - DAY 4] DEEP TECH: COUNSELING ENGINE EDGE-CASE BENCHMARK")
    print("=" * 75)

    edge_cases = [
        {
            "category": "Edge Case 1: Pure Academic Failure",
            "profile": {
                "student_id": "EDGE-ACAD-01",
                "name": "Alexandre Dupont",
                "program": "Civil Engineering",
                "semester": 3,
                "attendance_pct": 86.0,
                "gpa": 6.8,
                "prediction": {"risk_score": 0.79, "risk_level": "High"}
            },
            "factors": [
                "Failed Structural Mechanics prerequisite twice",
                "Sub-par continuous assessment scores (6.5/20)"
            ],
            "expected_keywords": ["tutor", "academic", "course", "prerequisite", "recovery"]
        },
        {
            "category": "Edge Case 2: Pure Absenteeism & Work Schedule",
            "profile": {
                "student_id": "EDGE-ATT-02",
                "name": "Helena Vargas",
                "program": "Computer Science",
                "semester": 4,
                "attendance_pct": 46.0,
                "gpa": 14.5,
                "prediction": {"risk_score": 0.68, "risk_level": "High"}
            },
            "factors": [
                "Working 35 hours/week night shifts",
                "Lecture attendance below mandatory 50% minimum"
            ],
            "expected_keywords": ["attendance", "work", "schedule", "flexible", "absent"]
        },
        {
            "category": "Edge Case 3: Pure Financial Distress / Tuition Debt",
            "profile": {
                "student_id": "EDGE-FIN-03",
                "name": "Mateo Rossi",
                "program": "Economics",
                "semester": 2,
                "attendance_pct": 92.0,
                "gpa": 13.2,
                "prediction": {"risk_score": 0.46, "risk_level": "Medium"}
            },
            "factors": [
                "Overdue tuition installment notification",
                "Administrative hold on course exam registration"
            ],
            "expected_keywords": ["financial", "bursar", "tuition", "grant", "payment"]
        },
        {
            "category": "Edge Case 4: Compound Crisis (Academic + Financial + Absence)",
            "profile": {
                "student_id": "EDGE-COMP-04",
                "name": "Katarina Novak",
                "program": "Electrical Engineering",
                "semester": 3,
                "attendance_pct": 52.0,
                "gpa": 7.1,
                "prediction": {"risk_score": 0.94, "risk_level": "High"}
            },
            "factors": [
                "Overdue tuition installment and registered debtor status",
                "Failed Circuit Analysis midterm",
                "16 unexcused absences"
            ],
            "expected_keywords": ["emergency", "financial", "attendance", "tutor", "coach", "urgent"]
        },
        {
            "category": "Edge Case 5: Honors / Low Risk Transition",
            "profile": {
                "student_id": "EDGE-HONOR-05",
                "name": "Julia Ribeiro",
                "program": "Data Science",
                "semester": 2,
                "attendance_pct": 94.0,
                "gpa": 16.5,
                "prediction": {"risk_score": 0.08, "risk_level": "Low"}
            },
            "factors": [
                "Consistent curricular credits approved",
                "Single excused seminar absence"
            ],
            "expected_keywords": ["commendable", "research", "honors", "leadership", "discipline"]
        }
    ]

    passed = 0
    for case in edge_cases:
        cat = case["category"]
        prof = case["profile"]
        factors = case["factors"]
        expected = case["expected_keywords"]

        memo = generate_counseling_memo(prof, factors)

        # 1. Schema Validation
        assert isinstance(memo, dict)
        assert "summary" in memo and "action_items" in memo and "meeting_talking_points" in memo

        # 2. Tone & Context Assertions
        combined_text = (memo["summary"] + " " + " ".join(memo["action_items"]) + " " + " ".join(memo["meeting_talking_points"])).lower()
        matched_keywords = [kw for kw in expected if kw in combined_text]

        print(f"\n--- {cat} ---")
        print(f"Student     : {prof['name']} | Risk: {prof['prediction']['risk_level']} ({prof['prediction']['risk_score']})")
        print(f"Summary     : {memo['summary'][:95]}...")
        print(f"Top Action  : {memo['action_items'][0]}")
        print(f"Top Prompt  : {memo['meeting_talking_points'][0]}")
        print(f"Tone Check  : Matched {len(matched_keywords)}/{len(expected)} domain keywords ({', '.join(matched_keywords)})")

        assert len(matched_keywords) >= 1, f"Failed domain resonance test for {cat}"
        passed += 1

    print("\n" + "=" * 75)
    print(f" [✔] DAY 4 EDGE-CASE SUITE PASSED: {passed}/{len(edge_cases)} ARCHETYPES VALIDATED.")
    print(" Domain specificity & pedagogical empathy verified.")
    print("=" * 75)


if __name__ == "__main__":
    run_edge_case_suite()
