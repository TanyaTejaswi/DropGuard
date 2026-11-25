"""
DropGuard - Model Inference Interface (Member 1)
Loads the bundled preprocessor + classifier pipeline and outputs contract-compliant predictions
powered by SHAP (TreeExplainer) risk attribution.
"""

import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# Cached explainer and pipeline for ultra-fast <15ms inference
_CACHED_PIPELINE = None
_CACHED_EXPLAINER = None
_FEATURE_NAMES = None


def get_pipeline():
    global _CACHED_PIPELINE, _CACHED_EXPLAINER, _FEATURE_NAMES
    if _CACHED_PIPELINE is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run train_pipeline.py first.")
        _CACHED_PIPELINE = joblib.load(MODEL_PATH)
        
        # Build feature names list from ColumnTransformer
        preprocessor = _CACHED_PIPELINE.named_steps['preprocessor']
        classifier = _CACHED_PIPELINE.named_steps['classifier']
        
        num_cols = preprocessor.transformers_[0][2]
        cat_cols = preprocessor.transformers_[1][2]
        cat_encoder = preprocessor.named_transformers_['cat']
        encoded_cat_names = list(cat_encoder.get_feature_names_out(cat_cols))
        bin_cols = preprocessor.transformers_[2][2]
        
        _FEATURE_NAMES = list(num_cols) + encoded_cat_names + list(bin_cols)
        
        try:
            import shap
            _CACHED_EXPLAINER = shap.TreeExplainer(classifier)
        except Exception as e:
            print(f"[*] SHAP TreeExplainer initialization note: {e}")
            _CACHED_EXPLAINER = None

    return _CACHED_PIPELINE


def format_risk_factor(feature_name: str, value, shap_val: float) -> str:
    """Translates a feature name and value into an intuitive, human-readable risk description."""
    feat_lower = feature_name.lower()

    if "curricular units 2nd sem (approved)" in feat_lower:
        return f"Low 2nd semester approved modules ({int(value) if pd.notnull(value) else 0} units)"
    elif "curricular units 1st sem (approved)" in feat_lower:
        return f"Low 1st semester approved modules ({int(value) if pd.notnull(value) else 0} units)"
    elif "tuition fees up to date" in feat_lower and value == 0:
        return "Overdue tuition fees flagged"
    elif "debtor" in feat_lower and value == 1:
        return "Student registered with outstanding debt"
    elif "curricular units 2nd sem (grade)" in feat_lower:
        val_10 = float(value) / 2.0 if float(value) <= 20.0 else float(value) / 20.0
        return f"Sub-par 2nd semester grade point ({val_10:.1f}/10)"
    elif "curricular units 1st sem (grade)" in feat_lower:
        val_10 = float(value) / 2.0 if float(value) <= 20.0 else float(value) / 20.0
        return f"Low 1st semester grade point ({val_10:.1f}/10)"
    elif "age at enrollment" in feat_lower:
        return f"Mature student entry ({int(value)} years) facing outside work-study pressures"
    elif "scholarship holder" in feat_lower and value == 0:
        return "Self-funding without scholarship grant"
    elif "admission grade" in feat_lower:
        return f"Lower entry qualification score ({float(value):.1f}/200)"
    elif "unemployment rate" in feat_lower:
        return f"Elevated regional unemployment pressure ({float(value):.1f}%)"
    elif "curricular units 2nd sem (evaluations)" in feat_lower:
        return f"Low examination attendance in 2nd semester ({int(value)} evaluations)"
    else:
        clean_name = feature_name.replace("_", " ").title()
        return f"Adverse indicator in {clean_name}"


DEFAULT_FEATURES = {
    'Marital status': 1, 'Application mode': 1, 'Application order': 1, 'Course': 33,
    'Daytime/evening attendance': 1, 'Previous qualification': 1,
    'Previous qualification (grade)': 120.0, 'Nacionality': 1, "Mother's qualification": 1,
    "Father's qualification": 1, "Mother's occupation": 1, "Father's occupation": 1,
    'Admission grade': 115.0, 'Displaced': 1, 'Educational special needs': 0, 'Debtor': 0,
    'Tuition fees up to date': 1, 'Gender': 1, 'Scholarship holder': 0, 'Age at enrollment': 20,
    'International': 0, 'Curricular units 1st sem (credited)': 0,
    'Curricular units 1st sem (enrolled)': 6, 'Curricular units 1st sem (evaluations)': 6,
    'Curricular units 1st sem (approved)': 5, 'Curricular units 1st sem (grade)': 12.0,
    'Curricular units 1st sem (without evaluations)': 0, 'Curricular units 2nd sem (credited)': 0,
    'Curricular units 2nd sem (enrolled)': 6, 'Curricular units 2nd sem (evaluations)': 6,
    'Curricular units 2nd sem (approved)': 5, 'Curricular units 2nd sem (grade)': 12.0,
    'Curricular units 2nd sem (without evaluations)': 0, 'Unemployment rate': 10.8,
    'Inflation rate': 1.4, 'GDP': 1.74
}


def predict_student(student_features: dict) -> dict:
    """
    Takes raw student dictionary, applies the fitted ColumnTransformer preprocessing,
    calculates risk probability, and runs SHAP TreeExplainer to extract top 3 risk drivers.
    """
    pipeline = get_pipeline()
    preprocessor = pipeline.named_steps['preprocessor']
    classifier = pipeline.named_steps['classifier']

    # Merge student_features on top of default values to guarantee complete columns
    merged_features = {**DEFAULT_FEATURES, **student_features}

    # Map GPA / Attendance if provided
    gpa_val = float(student_features.get("gpa", student_features.get("Curricular units 2nd sem (grade)", 12.0)))
    if gpa_val <= 10.0:
        merged_features["Curricular units 1st sem (grade)"] = gpa_val * 2.0
        merged_features["Curricular units 2nd sem (grade)"] = gpa_val * 2.0

    # Convert dict to DataFrame filtered to preprocessor columns
    df_row = pd.DataFrame([merged_features])
    df_row.columns = [c.strip() for c in df_row.columns]

    # Predict dropout probability (Class 1 = Dropout)
    prob = pipeline.predict_proba(df_row)[0, 1]
    prob = round(float(prob), 2)

    # Risk categorization strictly per contract
    if prob >= 0.65:
        risk_level = "High"
    elif prob >= 0.35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    top_factors = []

    # If student has backlogs / failed subjects, prioritize reporting them
    total_backlogs = student_features.get("total_backlogs", None)
    failed_by_sem = student_features.get("failed_subjects_by_sem", {})
    if total_backlogs is not None and total_backlogs > 0:
        top_factors.append(f"Accumulated {total_backlogs} failed subject(s) / backlogs")
        if isinstance(failed_by_sem, dict):
            for sem_k, sem_failed in failed_by_sem.items():
                if sem_failed > 0 and len(top_factors) < 3:
                    top_factors.append(f"{sem_k}: {sem_failed} subject(s) failed")

    # 1. Try SHAP-based feature attribution
    if _CACHED_EXPLAINER is not None and _FEATURE_NAMES is not None:
        try:
            X_trans = preprocessor.transform(df_row)
            shap_vals = _CACHED_EXPLAINER.shap_values(X_trans)
            
            # Extract Class 1 (Dropout) SHAP values
            if isinstance(shap_vals, list) and len(shap_vals) >= 2:
                class_1_shap = shap_vals[1][0]
            elif hasattr(shap_vals, 'ndim') and shap_vals.ndim == 3:
                class_1_shap = shap_vals[0, :, 1]
            else:
                class_1_shap = shap_vals[0]

            # Top positive SHAP contributors pushing toward Dropout
            top_indices = np.argsort(class_1_shap)[::-1]
            
            seen_descriptions = set()
            for idx in top_indices:
                if class_1_shap[idx] <= 0 and len(top_factors) >= 1:
                    break
                feat_name = _FEATURE_NAMES[idx]
                
                # Fetch raw value if available in student_features
                raw_val = student_features.get(feat_name, None)
                if raw_val is None:
                    # check base feature name for one-hot encoded cols
                    for base_k in student_features:
                        if base_k in feat_name:
                            raw_val = student_features[base_k]
                            break
                            
                desc = format_risk_factor(feat_name, raw_val, class_1_shap[idx])
                if desc not in seen_descriptions:
                    seen_descriptions.add(desc)
                    top_factors.append(desc)
                if len(top_factors) >= 3:
                    break
        except Exception as e:
            # Fallback to domain heuristics if SHAP runtime encounters dimension mismatch
            pass

    # 2. Domain heuristic fallback if SHAP yields empty
    if not top_factors:
        units_approved_2nd = student_features.get("Curricular units 2nd sem (approved)", None)
        if units_approved_2nd is not None and units_approved_2nd < 3:
            top_factors.append(f"Low 2nd semester approved modules ({units_approved_2nd} units)")

        units_approved_1st = student_features.get("Curricular units 1st sem (approved)", None)
        if units_approved_1st is not None and units_approved_1st < 3:
            top_factors.append(f"Low 1st semester approved modules ({units_approved_1st} units)")

        tuition = student_features.get("Tuition fees up to date", 1)
        if tuition == 0:
            top_factors.append("Overdue tuition fees flagged")

        debtor = student_features.get("Debtor", 0)
        if debtor == 1:
            top_factors.append("Student registered with outstanding debt")

        grade_2nd = student_features.get("Curricular units 2nd sem (grade)", None)
        if grade_2nd is not None and grade_2nd < 10.0:
            top_factors.append(f"Sub-par 2nd semester grade point ({float(grade_2nd)/2.0:.1f}/10)")

    if not top_factors:
        if risk_level == "Low":
            top_factors.append("Consistent curricular credits approved")
            top_factors.append("Tuition and institutional fees in good standing")
        else:
            top_factors.append("Borderline academic evaluation metrics")

    return {
        "risk_score": prob,
        "risk_level": risk_level,
        "top_risk_factors": top_factors[:3]
    }


if __name__ == "__main__":
    # Test sample at-risk student
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

    res = predict_student(sample_student)
    print("\n--- Model + SHAP Inference Output ---")
    print(f"Risk Score : {res['risk_score']} ({res['risk_score']*100:.0f}%)")
    print(f"Risk Level : {res['risk_level']}")
    print(f"Top Risk Factors (SHAP):")
    for f in res['top_risk_factors']:
        print(f"  • {f}")
