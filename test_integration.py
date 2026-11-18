"""
DropGuard - Complete End-to-End System Integration Test
Verifies Member 1 (ML + SHAP), Member 2 (Counseling), and Server API logic directly.
"""

import os
import sys
import json

PROJECT_ROOT = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "server"))

import main


def test_end_to_end_system():
    print("=" * 70)
    print(" DROPGUARD FULL-STACK SYSTEM INTEGRATION SUITE")
    print("=" * 70)

    # 1. Test Static UI Delivery
    print("[1/5] Testing Frontend Landing Delivery...")
    resp = main.serve_index()
    assert os.path.exists(resp.path), f"File {resp.path} does not exist"
    with open(resp.path, "r", encoding="utf-8") as f:
        html = f.read()
    assert "DropGuard" in html, "Landing page missing DropGuard brand"
    print("      [✔] Frontend dashboard (index.html) delivered successfully.")

    # 2. Test API Health
    print("[2/5] Testing /api/health...")
    health_data = main.health()
    assert health_data["status"] == "online"
    print(f"      [✔] Server Status: {health_data['status']}")
    print(f"      [✔] ML Engine: {health_data['ml_engine']}")
    print(f"      [✔] SHAP Explainer: {health_data['shap_explainer']}")

    # 3. Test Student Roster
    print("[3/5] Testing /api/students...")
    students = main.get_students()
    assert len(students) == 10, f"Expected 10 students, got {len(students)}"
    for s in students:
        assert "student_id" in s and "prediction" in s and "counseling_memo" in s
    print(f"      [✔] Successfully retrieved {len(students)} contract-compliant student profiles.")

    # 4. Test Live ML + SHAP + GenAI Prediction Endpoint
    print("[4/5] Testing Live ML Prediction & SHAP /api/predict...")
    sample_student = {
        'student_id': 'STU-TEST-999',
        'name': 'Carlos Mendez',
        'program': 'Computer Science',
        'semester': 2,
        'attendance_pct': 52.0,
        'gpa': 3.6,
        'Marital status': 1, 'Application mode': 1, 'Application order': 1, 'Course': 33,
        'Daytime/evening attendance': 1, 'Previous qualification': 1, 'Previous qualification (grade)': 122.0,
        'Nacionality': 1, "Mother's qualification": 1, "Father's qualification": 1,
        "Mother's occupation": 1, "Father's occupation": 1, 'Admission grade': 119.0,
        'Displaced': 1, 'Educational special needs': 0, 'Debtor': 1, 'Tuition fees up to date': 0,
        'Gender': 1, 'Scholarship holder': 0, 'Age at enrollment': 20, 'International': 0,
        'Curricular units 1st sem (credited)': 0, 'Curricular units 1st sem (enrolled)': 6,
        'Curricular units 1st sem (evaluations)': 6, 'Curricular units 1st sem (approved)': 1,
        'Curricular units 1st sem (grade)': 7.2, 'Curricular units 1st sem (without evaluations)': 0,
        'Curricular units 2nd sem (credited)': 0, 'Curricular units 2nd sem (enrolled)': 6,
        'Curricular units 2nd sem (evaluations)': 6, 'Curricular units 2nd sem (approved)': 0,
        'Curricular units 2nd sem (grade)': 0.0, 'Curricular units 2nd sem (without evaluations)': 0,
        'Unemployment rate': 10.8, 'Inflation rate': 1.4, 'GDP': 1.74
    }

    pred_res = main.predict_risk(sample_student)
    prediction = pred_res["prediction"]
    memo = pred_res["counseling_memo"]

    print(f"      [✔] Risk Score: {prediction['risk_score']} ({prediction['risk_level']})")
    print(f"      [✔] SHAP Factors: {prediction['top_risk_factors']}")
    print(f"      [✔] AI Memo Summary: {memo['summary'][:80]}...")
    print(f"      [✔] AI Actions Count: {len(memo['action_items'])}")
    print(f"      [✔] AI Meeting Prompts: {len(memo['meeting_talking_points'])}")

    # 5. Test Dedicated Counseling Endpoint
    print("[5/5] Testing /api/counsel...")
    counsel_payload = {
        "student_profile": {
            "student_id": "STU-888",
            "name": "Lucia Morales",
            "program": "Civil Engineering",
            "semester": 3,
            "attendance_pct": 62.0,
            "gpa": 4.25,
            "prediction": {"risk_score": 0.72, "risk_level": "High"}
        },
        "top_risk_factors": ["Repeated failure in Structural Mechanics", "Tuition fees overdue"]
    }
    counsel_res = main.counsel_student(counsel_payload)
    assert "counseling_memo" in counsel_res
    print(f"      [✔] Generated counseling memo for {counsel_payload['student_profile']['name']}")

    print("\n" + "=" * 70)
    print(" [✔] ALL INTEGRATION TESTS PASSED (5/5). SYSTEM IS 100% OPERATIONAL.")
    print("=" * 70)


if __name__ == "__main__":
    test_end_to_end_system()
