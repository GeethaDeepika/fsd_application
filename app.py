import os
from flask import Flask, request, jsonify, render_template, send_file
import torch
from torchvision import transforms
from PIL import Image
from flask_cors import CORS
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
import torch.nn.functional as F 

# Initialize Flask app
app = Flask(__name__, static_folder='Frontend', template_folder='Frontend')
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)  

MODEL_PATH = "final_vit_glaucoma_model_the_bestepochs.pth"
model = None

try:
    if os.path.exists(MODEL_PATH):
        model = torch.load(MODEL_PATH, map_location=torch.device("cpu"))
        model.eval()
        print("✅ Model loaded successfully.")
    else:
        print(f"❌ Error: Model file '{MODEL_PATH}' not found.")
except Exception as e:
    print(f"❌ Error loading model: {e}")

transform = transforms.Compose([
    transforms.Resize((224, 224)),  
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])    
])

# ✅ Prediction API (POST Request)
@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    if 'images' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('images')
    if not files:
        return jsonify({"error": "No files provided"}), 400

    predictions = []
    for file in files:
        try:
            image = Image.open(file.stream).convert('RGB')
            result, suggestion = predict_image(image)
            predictions.append({"filename": file.filename, "result": result, "suggestion": suggestion})
        except Exception as e:
            predictions.append({"filename": file.filename, "result": "Error", "error": str(e), "suggestion": "No suggestion available"})

    return jsonify({"predictions": predictions})


def predict_image(image):
    try:
        print("🔄 Preprocessing image for prediction...")  # Debugging
        image = transform(image).unsqueeze(0) 
        print("📨 Sending image to model for prediction...")  # Debugging

        with torch.no_grad():
            output = model(image)  # Output is a tensor of shape [1, 2]
        
        print(f"🔢 Raw model output: {output}")  # Debugging

        # ✅ Check first value in output tensor
        if output[0][0].item() > 1:  
            result = "Negative"
        else:
            result = "Positive"

        # ✅ Generate Suggestion Based on Result
        suggestion = (
            "⚠️ Glaucoma detected. Immediate medical consultation is strongly recommended."
            if result == "Positive"
            else "✅ No signs of glaucoma detected. Maintain regular eye check-ups for safety."
        )

        print(f"✅ Prediction: {result} | Suggestion: {suggestion}")  # Debugging

        return result, suggestion  

    except Exception as e:
        print(f"❌ Error processing image: {e}")  # Debugging
        return "Error", f"Error processing image: {str(e)}"

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    data = request.json  # Receive JSON data from frontend

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle("Patient Diagnosis Report")

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(200, 750, "Patient Diagnosis Report")
    
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 700, f"Patient Name: {data.get('patient_name', 'Unknown')}")
    pdf.drawString(50, 680, f"Age: {data.get('age', 'N/A')}")
    pdf.drawString(50, 660, f"Date: {data.get('date', 'N/A')}")
    
    y_position = 640
    for pred in data['predictions']:
        pdf.drawString(50, y_position, f"Image: {pred.get('filename', 'Unknown')}")
        pdf.drawString(50, y_position - 20, f"Result: {pred.get('result', 'Error')}")
        
        # ✅ Fix: Handle missing 'suggestion' key properly
        suggestion = pred.get('suggestion', 'No suggestion available')
        pdf.drawString(50, y_position - 40, f"Suggestion: {suggestion}")

        y_position -= 80  # Move to the next block

    pdf.showPage()
    pdf.save()
    
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="diagnosis_report.pdf", mimetype="application/pdf")

if __name__ == '__main__':
    app.run(debug=True, port=5002)
