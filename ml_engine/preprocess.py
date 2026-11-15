"""
DropGuard - Data Preprocessing Module (Member 1)
Handles data cleaning, feature categorization, scaling, and categorical encoding.
"""

import os
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "student_data.csv")

# Feature Taxonomy for UCI Dataset #697
NUMERICAL_FEATURES = [
    'Previous qualification (grade)',
    'Admission grade',
    'Age at enrollment',
    'Curricular units 1st sem (credited)',
    'Curricular units 1st sem (enrolled)',
    'Curricular units 1st sem (evaluations)',
    'Curricular units 1st sem (approved)',
    'Curricular units 1st sem (grade)',
    'Curricular units 1st sem (without evaluations)',
    'Curricular units 2nd sem (credited)',
    'Curricular units 2nd sem (enrolled)',
    'Curricular units 2nd sem (evaluations)',
    'Curricular units 2nd sem (approved)',
    'Curricular units 2nd sem (grade)',
    'Curricular units 2nd sem (without evaluations)',
    'Unemployment rate',
    'Inflation rate',
    'GDP'
]

CATEGORICAL_FEATURES = [
    'Marital status',
    'Application mode',
    'Application order',
    'Course',
    'Previous qualification',
    'Nacionality',
    "Mother's qualification",
    "Father's qualification",
    "Mother's occupation",
    "Father's occupation"
]

BINARY_FEATURES = [
    'Daytime/evening attendance',
    'Displaced',
    'Educational special needs',
    'Debtor',
    'Tuition fees up to date',
    'Gender',
    'Scholarship holder',
    'International'
]

def load_and_clean_raw_data(filepath=DATASET_PATH):
    """
    Loads raw CSV, strips whitespace/tabs in column names, and checks integrity.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found at: {filepath}")

    df = pd.read_csv(filepath)
    # Strip whitespace/tabs in columns (e.g. 'Daytime/evening attendance\t')
    df.columns = [c.strip() for c in df.columns]
    
    print(f"[*] Cleaned column headers. Total features: {len(df.columns) - 1}")
    print(f"[*] Missing values count: {df.isnull().sum().sum()}")
    return df

def get_preprocessor():
    """
    Builds a ColumnTransformer that scales numerical variables and One-Hot encodes nominal categoricals.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            (
                'num',
                StandardScaler(),
                NUMERICAL_FEATURES
            ),
            (
                'cat',
                OneHotEncoder(handle_unknown='ignore', sparse_output=False),
                CATEGORICAL_FEATURES
            ),
            (
                'bin',
                'passthrough',
                BINARY_FEATURES
            )
        ],
        remainder='drop'
    )
    return preprocessor

if __name__ == "__main__":
    print("[*] Testing preprocessing pipeline...")
    df = load_and_clean_raw_data()
    
    # Filter for binary target (Dropout=1, Graduate=0)
    binary_df = df[df['Target'].isin(['Dropout', 'Graduate'])].copy()
    X = binary_df.drop(columns=['Target'])
    y = (binary_df['Target'] == 'Dropout').astype(int)

    preprocessor = get_preprocessor()
    X_processed = preprocessor.fit_transform(X)
    
    # Extract feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_['cat']
    encoded_cat_features = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feature_names = NUMERICAL_FEATURES + encoded_cat_features + BINARY_FEATURES

    print(f"[+] Successfully preprocessed {X_processed.shape[0]} rows.")
    print(f"[+] Expanded feature space from {X.shape[1]} raw columns to {X_processed.shape[1]} encoded columns.")
    print(f"[+] All values scaled and formatted. Ready for model ingestion.")
