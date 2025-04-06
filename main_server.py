import subprocess
import time
import os
import signal

# Explicitly set environment variables for Node.js
os.environ["MONGO_URI"] = "mongodb+srv://Deepika:Deepika2004@lms.3uvwm.mongodb.net/Disease?retryWrites=true&w=majority"  # Replace with your DB name
os.environ["PORT"] = "5001"
os.environ["JWT_SECRET"] = "dd399a2bd9e7aa3f01cde4e711f86af9480c820bb7bb0ce9ba061df52fb86d34"


# Paths to your server scripts
BACKEND_SCRIPT = "/Users/geethadeepika/Documents/github/fsd_application/Backend/server.js"
MODEL_SCRIPT = "/Users/geethadeepika/Documents/github/fsd_application/final_app.py"
CHATBOT_SCRIPT = "/Users/geethadeepika/Documents/github/fsd_application/chatbot.py"

def start_process(command, log_file):
    with open(log_file, "w") as log:
        return subprocess.Popen(command, stdout=log, stderr=log, shell=True, preexec_fn=os.setsid)

# Start Backend (Node.js)
print("Starting Backend Server...")
backend_process = start_process(f"node {BACKEND_SCRIPT}", "backend.log")
time.sleep(5)  # Give it time to initialize

# Start Model Server (Flask)
print("Starting Model Server...")
model_process = start_process(f"python3 {MODEL_SCRIPT}", "model_server.log")
time.sleep(5)

# Start Chatbot Server (Flask)
print("Starting Chatbot Server...")
chatbot_process = start_process(f"python3 {CHATBOT_SCRIPT}", "chatbot.log")

# Keep running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n Shutting down servers...")
    os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)
    os.killpg(os.getpgid(model_process.pid), signal.SIGTERM)
    os.killpg(os.getpgid(chatbot_process.pid), signal.SIGTERM)
    print(" All servers stopped.")