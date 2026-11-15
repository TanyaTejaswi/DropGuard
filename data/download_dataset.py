"""
DropGuard - Automated Dataset Downloader for UCI Dataset #697
Predict Students' Dropout and Academic Success (4,424 college students, 36 features)
"""

import os
import io
import zipfile
import urllib.request
import pandas as pd

UCI_ZIP_URL = "https://archive.ics.uci.edu/static/public/697/predict+students+dropout+and+academic+success.zip"
TARGET_CSV = os.path.join(os.path.dirname(__file__), "student_data.csv")

def download_and_extract():
    print(f"[*] Downloading Dataset #697 from UCI Repository...")
    print(f"[*] Source URL: {UCI_ZIP_URL}")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    req = urllib.request.Request(UCI_ZIP_URL, headers=headers)
    
    with urllib.request.urlopen(req) as response:
        zip_data = response.read()
        print(f"[+] Download complete ({len(zip_data)} bytes). Extracting...")
        
    with zipfile.ZipFile(io.BytesIO(zip_data)) as z:
        # List files in the zip
        file_list = z.namelist()
        print(f"[*] Files in archive: {file_list}")
        
        # Look for data.csv
        csv_filename = next((f for f in file_list if f.endswith(".csv")), None)
        if not csv_filename:
            raise FileNotFoundError("Could not find CSV file in downloaded archive.")
            
        with z.open(csv_filename) as f:
            # Note: UCI dataset 697 often uses semicolon separator
            df = pd.read_csv(f, sep=";")
            if len(df.columns) <= 1:
                f.seek(0)
                df = pd.read_csv(f, sep=",")
                
            print(f"[+] Loaded DataFrame shape: {df.shape} (Rows: {df.shape[0]}, Columns: {df.shape[1]})")
            print(f"[*] Target distribution:\n{df['Target'].value_counts()}")
            
            # Save cleanly to data/student_data.csv
            df.to_csv(TARGET_CSV, index=False)
            print(f"[✔] Successfully saved clean dataset to: {TARGET_CSV}")

if __name__ == "__main__":
    download_and_extract()
