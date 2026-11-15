"""
DropGuard - Self-Contained Production ML Training Pipeline (Member 1)
Bundles Preprocessing (ColumnTransformer) + Classifier (RandomForest) into a single Pipeline.
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "student_data.csv")
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# Feature Taxonomy for UCI Dataset #697
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

def train_and_save_pipeline():
    print("[*] Loading raw UCI dataset from:", DATASET_PATH)
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run 'python data/download_dataset.py' first.")

    df = pd.read_csv(DATASET_PATH)
    df.columns = [c.strip() for c in df.columns]

    # Target: 1 = Dropout, 0 = Graduate
    binary_df = df[df["Target"].isin(["Dropout", "Graduate"])].copy()
    X = binary_df.drop(columns=["Target"])
    y = (binary_df["Target"] == "Dropout").astype(int)

    # 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Bundled Preprocessing
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES),
            ('bin', 'passthrough', BINARY_FEATURES)
        ],
        remainder='drop'
    )

    # Full End-to-End Pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=200, max_depth=14, class_weight='balanced', random_state=42, n_jobs=-1))
    ])

    print("[*] Training pipeline on training data...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    print("\n" + "=" * 50)
    print("           EVALUATION METRICS")
    print("=" * 50)
    print(classification_report(y_test, y_pred, target_names=["Graduate", "Dropout"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print("=" * 50)

    # Save artifact
    joblib.dump(pipeline, MODEL_OUTPUT_PATH)
    print(f"[✔] Serialized end-to-end model pipeline to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train_and_save_pipeline()
