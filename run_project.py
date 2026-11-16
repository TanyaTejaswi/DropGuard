"""
DropGuard - One-Click Application Launcher
Starts the integrated DropGuard production server and opens the web dashboard.
"""

import os
import sys
import webbrowser
import threading
import time

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "server"))

import uvicorn
from main import app


def open_browser():
    time.sleep(1.5)
    url = "http://127.0.0.1:8000"
    print(f"\n[🌐] Opening DropGuard Dashboard at {url} in your default browser...")
    webbrowser.open(url)


if __name__ == "__main__":
    print("=" * 70)
    print(" 🎓 DROPGUARD: STUDENT DROPOUT PREDICTION & COUNSELING SYSTEM")
    print("=" * 70)
    print("[*] Loaded Machine Learning Model Pipeline: RandomForest (200 Trees)")
    print("[*] Loaded SHAP Explainability Engine: TreeExplainer Active")
    print("[*] Loaded AI Counseling Engine: Gemini GenAI & Domain Expert Active")
    print("[*] Serving Frontend & REST APIs on http://127.0.0.1:8000")
    print("=" * 70)

    # Launch browser automatically in a background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
