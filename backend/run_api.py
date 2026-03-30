# backend/run_api.py
import uvicorn
import multiprocessing
import api  # This imports the api.py file you just created

if __name__ == "__main__":
    multiprocessing.freeze_support() 
    # CRITICAL: log_config=None prevents the 'isatty' crash in Electron/Windowed mode
    uvicorn.run(api.app, host="127.0.0.1", port=8000, log_config=None)