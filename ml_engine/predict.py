"""
DropGuard - Model Inference & Explainability Interface (Member 1)
Contract:
  Input: Dictionary of student features (or pandas DataFrame row)
  Output: Strict dictionary complying with contracts/student_schema.json:
    - risk_score: float in [0.00, 1.00]
    - risk_level: 'High' | 'Medium' | 'Low'
    - top_risk_factors: list of 1-3 plain text explanation strings
"""

import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def predict_student(student_features: dict) -> dict:
    """
    Predict dropout risk and extract top-3 contributing risk factors.
    """
    # Fallback heuristic / contract-compliant dummy if model.pkl is not yet trained
    if not os.path.exists(MODEL_PATH):
        # Graceful placeholder for testing before Day 5 training completes
        attendance = student_features.get("attendance_pct", 80)
        gpa = student_features.get("gpa", 12)
        
        # Simple risk estimation formula for baseline testing
        score = max(0.05, min(0.95, (100 - attendance) / 100 * 0.6 + (20 - gpa) / 20 * 0.4))
        risk_level = "High" if score >= 0.65 else ("Medium" if score >= 0.35 else "Low")
        
        factors = []
        if attendance < 75:
            factors.append(f"Low lecture attendance ({attendance}%)")
        if gpa < 10:
            factors.append(f"Below average GPA ({gpa}/20)")
        if not factors:
            factors.append("Nominal academic progression")
            
        return {
            "risk_score": round(float(score), 2),
            "risk_level": risk_level,
            "top_risk_factors": factors
        }
    
    # When model.pkl is available: Member 1 loads model, runs predict_proba, and applies SHAP
    # model = joblib.load(MODEL_PATH)
    # ...
    pass
