"""
DropGuard - Feature Importance & Explainability Visualizer (Member 1)
Generates high-resolution chart of the top predictive drivers of student dropout.
"""

import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt
from preprocess import load_and_clean_raw_data, get_preprocessor, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, BINARY_FEATURES

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
OUTPUT_CHART_PATH = os.path.join(os.path.dirname(__file__), "top_risk_features.png")

def generate_importance_chart():
    print("[*] Generating feature importance visualization...")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    pipeline = joblib.load(MODEL_PATH)
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]

    # Extract transformed feature names
    cat_encoder = preprocessor.named_transformers_["cat"]
    encoded_cat_features = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feature_names = NUMERICAL_FEATURES + encoded_cat_features + BINARY_FEATURES

    # Get feature importances from Random Forest
    importances = classifier.feature_importances_
    feat_series = pd.Series(importances, index=all_feature_names).sort_values(ascending=True)

    # Top 12 most critical features
    top_features = feat_series.tail(12)

    # Plot
    plt.figure(figsize=(10, 6), dpi=300)
    bars = plt.barh(top_features.index, top_features.values, color="#1E3A8A", edgecolor="#0284C7", height=0.65)
    
    plt.title("DropGuard — Top 12 Predictors of Student Dropout Risk (UCI #697)", fontsize=13, fontweight="bold", pad=15)
    plt.xlabel("Gini Feature Importance Score", fontsize=10, labelpad=10)
    plt.ylabel("Curricular & Socio-Economic Features", fontsize=10)
    plt.grid(axis="x", linestyle="--", alpha=0.5)

    # Add data labels
    for bar in bars:
        width = bar.get_width()
        plt.text(width + 0.002, bar.get_y() + bar.get_height()/2, f"{width:.3f}", 
                 va="center", ha="left", fontsize=8, color="#0F172A", fontweight="bold")

    plt.tight_layout()
    plt.savefig(OUTPUT_CHART_PATH)
    plt.close()
    print(f"[✔] Visual feature importance chart saved to: {OUTPUT_CHART_PATH}")

if __name__ == "__main__":
    generate_importance_chart()
