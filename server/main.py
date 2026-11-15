"""
DropGuard - Integration API Server
Glues Member 1 (ML inference) and Member 2 (Counseling) for Member 3 (Frontend).
"""

import os
import sys
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Enable importing from siblings
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from ml_engine.predict import predict_student
from counseling_engine.advisor import generate_counseling_memo

app = FastAPI(title="DropGuard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTRACT_MOCK_PATH = os.path.join(os.path.dirname(__file__), "..", "contracts", "mock_students.json")

@app.get("/")
def root():
    return {"status": "online", "system": "DropGuard API"}

@app.get("/api/students")
def get_students():
    """
    Returns student list with prediction & counseling notes.
    """
    if os.path.exists(CONTRACT_MOCK_PATH):
        with open(CONTRACT_MOCK_PATH, "r", encoding="utf-8") as f:
            students = json.load(f)
        return students
    return []

@app.post("/api/predict")
def predict_risk(student_data: dict):
    """
    Direct prediction endpoint.
    """
    prediction = predict_student(student_data)
    memo = generate_counseling_memo(student_data, prediction["top_risk_factors"])
    return {
        "prediction": prediction,
        "counseling_memo": memo
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
