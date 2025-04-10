import subprocess
import time
import os
import signal

os.environ["MONGO_URI"] = "add mongo uri here"  
os.environ["PORT"] = "give your port number here"
os.environ["JWT_SECRET"] = "add your jwt-token here"


BACKEND_SCRIPT = "./Backend/server.js"
MODEL_SCRIPT = "/final_app.py"
CHATBOT_SCRIPT = "/chatbot.py"

def start_process(command, log_file):
    with open(log_file, "w") as log:
        return subprocess.Popen(command, stdout=log, stderr=log, shell=True, preexec_fn=os.setsid)

print("Starting Backend Server...")
backend_process = start_process(f"node {BACKEND_SCRIPT}", "backend.log")
time.sleep(5) 

print("Starting Model Server...")
model_process = start_process(f"python3 {MODEL_SCRIPT}", "model_server.log")
time.sleep(5)

print("Starting Chatbot Server...")
chatbot_process = start_process(f"python3 {CHATBOT_SCRIPT}", "chatbot.log")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n Shutting down servers...")
    os.killpg(os.getpgid(backend_process.pid), signal.SIGTERM)
    os.killpg(os.getpgid(model_process.pid), signal.SIGTERM)
    os.killpg(os.getpgid(chatbot_process.pid), signal.SIGTERM)
    print(" All servers stopped.")
