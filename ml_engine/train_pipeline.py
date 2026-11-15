"""
DropGuard - ML Training Pipeline (Member 1)
Trains candidate models, benchmarks metrics (Recall/F1), and serializes the best model.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, recall_score, f1_score

def run_training(dataset_path="data/student_data.csv", model_output_path="model.pkl"):
    print("[M1] Starting training pipeline...")
    if not os.path.exists(dataset_path):
        print(f"[M1] Dataset not found at {dataset_path}. Please place your UCI dataset CSV in data/.")
        return False
    
    # Placeholder pipeline implementation
    df = pd.read_csv(dataset_path)
    print(f"[M1] Loaded dataset with {len(df)} records.")
    # Member 1 will implement full preprocessing, training, and joblib dump here.
    return True

if __name__ == "__main__":
    run_training()
