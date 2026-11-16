@echo off
title DropGuard Application Launcher
echo ========================================================
echo  Starting DropGuard Full-Stack System (ML + SHAP + GenAI)
echo ========================================================

if exist ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python.exe run_project.py
) else (
    python run_project.py
)

pause
