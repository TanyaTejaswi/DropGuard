"""
DropGuard - Standalone Unit Test for Counseling Engine (Member 2)
Tests advisor.py against mock student profiles to verify schema compliance.
"""

import os
import json
from advisor import generate_counseling_memo

MOCK_PATH = os.path.join(os.path.dirname(__file__), "..", "contracts", "mock_students.json")

def test_engine():
    print("[M2] Testing counseling engine...")
    if not os.path.exists(MOCK_PATH):
        print(f"[M2] Error: {MOCK_PATH} not found.")
        return
        
    with open(MOCK_PATH, "r", encoding="utf-8") as f:
        students = json.load(f)
        
    print(f"[M2] Loaded {len(students)} test student profiles.")
    for stu in students[:3]:
        memo = generate_counseling_memo(stu, stu.get("top_risk_factors", []))
        print(f"\n--- Memo for {stu['name']} ({stu['student_id']}) ---")
        print(f"Summary: {memo['summary']}")
        print(f"Actions ({len(memo['action_items'])}): {memo['action_items'][0]}")
        print(f"Talking Points ({len(memo['meeting_talking_points'])}): {memo['meeting_talking_points'][0]}")
        assert "summary" in memo and "action_items" in memo and "meeting_talking_points" in memo
    print("\n[M2] All tests passed! Contract compliance verified.")

if __name__ == "__main__":
    test_engine()
