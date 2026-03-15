# backend/run_api.py
import uvicorn
import multiprocessing
import main  # This magic line forces PyInstaller to include all your backend files!

if __name__ == "__main__":
    multiprocessing.freeze_support() 
    # Notice we pass main.app directly instead of the string "main:app"
    uvicorn.run(main.app, host="127.0.0.1", port=8000)

# This file is the entry point for running the FastAPI server. It imports the `app` instance from `main.py` and starts the Uvicorn server. The `multiprocessing.freeze_support()` line is necessary for PyInstaller to work correctly on Windows when creating an executable.

# # backend/run_api.py
# import uvicorn
# import multiprocessing

# if __name__ == "__main__":
#     # Required for PyInstaller on Windows to prevent infinite loop spawning
#     multiprocessing.freeze_support() 
#     uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

