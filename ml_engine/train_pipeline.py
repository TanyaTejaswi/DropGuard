"""
DropGuard - Production ML Training Pipeline (Member 1)
Combines preprocessing (ColumnTransformer) + Classifier (RandomForest) into a single Pipeline.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from preprocess import load_and_clean_raw_data, get_preprocessor, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, BINARY_FEATURES

MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def run_training_pipeline():
    print("[*] Step 1: Loading and cleaning raw dataset...")
    df = load_and_clean_raw_data()

    # Target Formulation for Early Warning:
    # 1 = Dropout (At-Risk), 0 = Graduate (Safe)
    binary_df = df[df["Target"].isin(["Dropout", "Graduate"])].copy()
    X = binary_df.drop(columns=["Target"])
    y = (binary_df["Target"] == "Dropout").astype(int)

    print(f"[*] Step 2: Stratified Train/Test split (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"[*] Step 3: Building unified Preprocessing + Classifier Pipeline...")
    preprocessor = get_preprocessor()
    
    # Random Forest with class balancing to prioritize high recall on at-risk students
    classifier = RandomForestClassifier(
        n_estimators=200,
        max_depth=14,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    full_pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])

    print("[*] Step 4: Fitting pipeline on training data...")
    full_pipeline.fit(X_train, y_train)

    print("[*] Step 5: Evaluating pipeline on holdout test set...")
    y_pred = full_pipeline.predict(X_test)
    y_prob = full_pipeline.predict_proba(X_test)[:, 1]

    print("\n" + "=" * 55)
    print("      PREPROCESSED PIPELINE PERFORMANCE METRICS")
    print("=" * 55)
    print(classification_report(y_test, y_pred, target_names=["Graduate (Safe)", "Dropout (At-Risk)"]))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("=" * 55)

    # Serialize complete pipeline
    print(f"[*] Step 6: Serializing end-to-end pipeline to {MODEL_OUTPUT_PATH}...")
    joblib.dump(full_pipeline, MODEL_OUTPUT_PATH)
    print("[✔] Done! Training and preprocessing successfully bundled.")
    return full_pipeline

if __name__ == "__main__":
    run_training_pipeline()
