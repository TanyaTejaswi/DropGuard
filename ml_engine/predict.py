"""
DropGuard - Model Inference Interface (Member 1)
Loads the bundled preprocessor + classifier pipeline and outputs contract-compliant predictions.
"""

import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def get_pipeline():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run train_pipeline.py first.")
    return joblib.load(MODEL_PATH)

def predict_student(student_features: dict) -> dict:
    """
    Takes raw student dictionary, applies the fitted ColumnTransformer preprocessing,
    and returns risk score, risk level, and primary risk factors.
    """
    pipeline = get_pipeline()
    
    # Convert dict to single-row DataFrame
    df_row = pd.DataFrame([student_features])
    
    # Strip column names to avoid whitespace issues
    df_row.columns = [c.strip() for c in df_row.columns]

    # Predict dropout probability (Class 1 = Dropout)
    prob = pipeline.predict_proba(df_row)[0, 1]
    prob = round(float(prob), 2)

    # Classify risk level based on strict contract thresholds
    if prob >= 0.65:
        risk_level = "High"
    elif prob >= 0.35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Identify primary risk factors from high-impact domain attributes
    factors = []
    
    # 1. 2nd Semester units approved
    units_approved_2nd = student_features.get("Curricular units 2nd sem (approved)", None)
    if units_approved_2nd is not None and units_approved_2nd < 3:
        factors.append(f"Low 2nd semester approved modules ({units_approved_2nd} units)")

    # 2. 1st Semester units approved
    units_approved_1st = student_features.get("Curricular units 1st sem (approved)", None)
    if units_approved_1st is not None and units_approved_1st < 3:
        factors.append(f"Low 1st semester approved modules ({units_approved_1st} units)")

    # 3. Tuition payment status
    tuition = student_features.get("Tuition fees up to date", 1)
    if tuition == 0:
        factors.append("Overdue tuition fees flagged")

    # 4. Debtor status
    debtor = student_features.get("Debtor", 0)
    if debtor == 1:
        factors.append("Student registered with outstanding debt")

    # 5. Low grade in 2nd semester
    grade_2nd = student_features.get("Curricular units 2nd sem (grade)", None)
    if grade_2nd is not None and grade_2nd < 10.0:
        factors.append(f"Sub-par 2nd semester grade point ({grade_2nd}/20)")

    if not factors:
        if risk_level == "Low":
            factors.append("Consistent curricular credits approved")
            factors.append("Tuition and institutional fees in good standing")
        else:
            factors.append("Borderline academic evaluation metrics")

    return {
        "risk_score": prob,
        "risk_level": risk_level,
        "top_risk_factors": factors[:3]
    }

if __name__ == "__main__":
    # Test on a sample at-risk student row
    sample_student = {
        'Marital status': 1, 'Application mode': 1, 'Application order': 1, 'Course': 33,
        'Daytime/evening attendance': 1, 'Previous qualification': 1, 'Previous qualification (grade)': 122.0,
        'Nacionality': 1, "Mother's qualification": 1, "Father's qualification": 1,
        "Mother's occupation": 1, "Father's occupation": 1, 'Admission grade': 119.0,
        'Displaced': 1, 'Educational special needs': 0, 'Debtor': 1, 'Tuition fees up to date': 0,
        'Gender': 1, 'Scholarship holder': 0, 'Age at enrollment': 20, 'International': 0,
        'Curricular units 1st sem (credited)': 0, 'Curricular units 1st sem (enrolled)': 6,
        'Curricular units 1st sem (evaluations)': 6, 'Curricular units 1st sem (approved)': 1,
        'Curricular units 1st sem (grade)': 8.5, 'Curricular units 1st sem (without evaluations)': 0,
        'Curricular units 2nd sem (credited)': 0, 'Curricular units 2nd sem (enrolled)': 6,
        'Curricular units 2nd sem (evaluations)': 6, 'Curricular units 2nd sem (approved)': 0,
        'Curricular units 2nd sem (grade)': 0.0, 'Curricular units 2nd sem (without evaluations)': 0,
        'Unemployment rate': 10.8, 'Inflation rate': 1.4, 'GDP': 1.74
    }
    
    result = predict_student(sample_student)
    print("\n--- Test Prediction Output ---")
    print(f"Risk Score : {result['risk_score']} ({result['risk_score']*100}%)")
    print(f"Risk Level : {result['risk_level']}")
    print(f"Top Drivers: {result['top_risk_factors']}")
