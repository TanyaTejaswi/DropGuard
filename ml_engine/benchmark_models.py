"""
DropGuard - Multi-Model Benchmarking & Preprocessed Dataset Exporter (Member 1)
Trains and compares Logistic Regression, Random Forest, and Gradient Boosting.
Exports data/preprocessed_student_data.csv (3,630 rows x 245 columns).
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "student_data.csv")
PREPROCESSED_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "preprocessed_student_data.csv")
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

NUMERICAL_FEATURES = [
    'Previous qualification (grade)', 'Admission grade', 'Age at enrollment',
    'Curricular units 1st sem (credited)', 'Curricular units 1st sem (enrolled)',
    'Curricular units 1st sem (evaluations)', 'Curricular units 1st sem (approved)',
    'Curricular units 1st sem (grade)', 'Curricular units 1st sem (without evaluations)',
    'Curricular units 2nd sem (credited)', 'Curricular units 2nd sem (enrolled)',
    'Curricular units 2nd sem (evaluations)', 'Curricular units 2nd sem (approved)',
    'Curricular units 2nd sem (grade)', 'Curricular units 2nd sem (without evaluations)',
    'Unemployment rate', 'Inflation rate', 'GDP'
]

CATEGORICAL_FEATURES = [
    'Marital status', 'Application mode', 'Application order', 'Course',
    'Previous qualification', 'Nacionality', "Mother's qualification",
    "Father's qualification", "Mother's occupation", "Father's occupation"
]

BINARY_FEATURES = [
    'Daytime/evening attendance', 'Displaced', 'Educational special needs',
    'Debtor', 'Tuition fees up to date', 'Gender', 'Scholarship holder', 'International'
]


def run_full_ml_suite():
    print("[*] Loading raw UCI dataset from:", DATASET_PATH)
    df = pd.read_csv(DATASET_PATH)
    df.columns = [c.strip() for c in df.columns]

    # Target: 1 = Dropout, 0 = Graduate (Filtered cohort: 3,630 students)
    binary_df = df[df["Target"].isin(["Dropout", "Graduate"])].copy()
    X = binary_df.drop(columns=["Target"])
    y = (binary_df["Target"] == "Dropout").astype(int)

    print(f"[*] Filtered Cohort: {len(binary_df)} students (Dropout: {sum(y)}, Graduate: {len(y) - sum(y)})")

    # 80/20 Stratified Partition
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # ColumnTransformer preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES),
            ('bin', 'passthrough', BINARY_FEATURES)
        ],
        remainder='drop'
    )

    preprocessor.fit(X_train)

    # Export preprocessed CSV for researchers and evaluators
    X_all_trans = preprocessor.transform(X)
    encoded_cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(CATEGORICAL_FEATURES)
    all_col_names = NUMERICAL_FEATURES + list(encoded_cat_names) + BINARY_FEATURES
    preprocessed_df = pd.DataFrame(X_all_trans, columns=all_col_names, index=binary_df.index)
    preprocessed_df['Target_Dropout'] = y
    preprocessed_df.to_csv(PREPROCESSED_PATH, index=False)
    print(f"[✔] Exported preprocessed dataset to {PREPROCESSED_PATH} (Shape: {preprocessed_df.shape})")

    # Models to benchmark
    models = {
        "Logistic Regression (Linear)": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Random Forest (Selected Engine)": RandomForestClassifier(n_estimators=200, max_depth=14, class_weight='balanced', random_state=42, n_jobs=-1),
        "Gradient Boosting (Boosting)": GradientBoostingClassifier(n_estimators=150, max_depth=5, random_state=42)
    }

    results = []
    trained_rf_pipeline = None

    print("\n" + "=" * 80)
    print("                     MULTI-MODEL BENCHMARK SUITE")
    print("=" * 80)

    for name, clf in models.items():
        pipe = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', clf)])
        pipe.fit(X_train, y_train)

        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc = roc_auc_score(y_test, y_prob)

        results.append({
            "Candidate Algorithm": name,
            "Accuracy": f"{acc * 100:.2f}%",
            "Precision (At-Risk)": f"{prec * 100:.2f}%",
            "Recall (At-Risk)": f"{rec * 100:.2f}%",
            "F1-Score": f"{f1 * 100:.2f}%",
            "ROC-AUC": f"{roc:.4f}"
        })

        if "Random Forest" in name:
            trained_rf_pipeline = pipe

    benchmark_df = pd.DataFrame(results)
    print(benchmark_df.to_string(index=False))
    print("=" * 80)

    # Save RF pipeline to model.pkl
    joblib.dump(trained_rf_pipeline, MODEL_OUTPUT_PATH)
    print(f"[✔] Serialized final production model pipeline to: {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    run_full_ml_suite()
