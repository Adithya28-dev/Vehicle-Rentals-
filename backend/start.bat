@echo off
echo ==========================================
echo  Car Rentals HYD - Backend Setup
echo ==========================================
echo.

if not exist venv (
    echo [0/3] Creating virtual environment...
    python -m venv venv
)

echo [1/3] Activating venv and installing dependencies...
call venv\Scripts\activate
pip install -r requirements.txt
echo.

echo [2/3] Seeding database with initial data...
python seed_data.py
echo.

echo [3/3] Starting Flask API server...
python app.py
