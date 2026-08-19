Write-Host "Starting Backend..."
Start-Process ".\backend\venv\Scripts\python.exe" -ArgumentList "-m uvicorn server:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory ".\backend" -WindowStyle Normal

Write-Host "Starting Frontend..."
Start-Process "npm.cmd" -ArgumentList "start" -WorkingDirectory ".\frontend" -WindowStyle Normal

Write-Host "Servers started! Backend is running on port 8000, and Frontend will start on port 3000."
