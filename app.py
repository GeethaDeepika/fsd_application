# import os
# from flask import Flask, request, jsonify, render_template, send_file
# import torch
# from torchvision import transforms
# from PIL import Image
# from flask_cors import CORS
# from reportlab.lib.pagesizes import letter
# from reportlab.pdfgen import canvas
# import io
# import torch.nn.functional as F 

# # Initialize Flask app
# app = Flask(__name__, static_folder='Frontend', template_folder='Frontend')
# CORS(app)
# app.config['UPLOAD_FOLDER'] = 'uploads'
# os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)  

# MODEL_PATH = "final_vit_glaucoma_model_the_bestepochs.pth"
# model = None

# try:
#     if os.path.exists(MODEL_PATH):
#         model = torch.load(MODEL_PATH, map_location=torch.device("cpu"))
#         model.eval()
#         print("✅ Model loaded successfully.")
#     else:
#         print(f"❌ Error: Model file '{MODEL_PATH}' not found.")
# except Exception as e:
#     print(f"❌ Error loading model: {e}")

# transform = transforms.Compose([
#     transforms.Resize((224, 224)),  
#     transforms.ToTensor(),
#     transforms.Normalize([0.5], [0.5])    
# ])

# # ✅ Prediction API (POST Request)
# @app.route('/predict', methods=['POST'])
# def predict():
#     if model is None:
#         return jsonify({"error": "Model not loaded"}), 500

#     if 'images' not in request.files:
#         return jsonify({"error": "No file part in the request"}), 400

#     files = request.files.getlist('images')
#     if not files:
#         return jsonify({"error": "No files provided"}), 400

#     predictions = []
#     for file in files:
#         try:
#             image = Image.open(file.stream).convert('RGB')
#             result, suggestion = predict_image(image)
#             predictions.append({"filename": file.filename, "result": result, "suggestion": suggestion})
#         except Exception as e:
#             predictions.append({"filename": file.filename, "result": "Error", "error": str(e), "suggestion": "No suggestion available"})

#     return jsonify({"predictions": predictions})


# def predict_image(image):
#     try:
#         print("🔄 Preprocessing image for prediction...")  # Debugging
#         image = transform(image).unsqueeze(0) 
#         print("📨 Sending image to model for prediction...")  # Debugging

#         with torch.no_grad():
#             output = model(image)  # Output is a tensor of shape [1, 2]
        
#         print(f"🔢 Raw model output: {output}")  # Debugging

#         # ✅ Check first value in output tensor
#         if output[0][0].item() > 1:  
#             result = "Negative"
#         else:
#             result = "Positive"

#         # ✅ Generate Suggestion Based on Result
#         suggestion = (
#             "⚠️ Glaucoma detected. Immediate medical consultation is strongly recommended."
#             if result == "Positive"
#             else "✅ No signs of glaucoma detected. Maintain regular eye check-ups for safety."
#         )

#         print(f"✅ Prediction: {result} | Suggestion: {suggestion}")  # Debugging

#         return result, suggestion  

#     except Exception as e:
#         print(f"❌ Error processing image: {e}")  # Debugging
#         return "Error", f"Error processing image: {str(e)}"

# @app.route('/generate_pdf', methods=['POST'])
# def generate_pdf():
#     data = request.json  # Receive JSON data from frontend

#     buffer = io.BytesIO()
#     pdf = canvas.Canvas(buffer, pagesize=letter)
#     pdf.setTitle("Patient Diagnosis Report")

#     pdf.setFont("Helvetica-Bold", 16)
#     pdf.drawString(200, 750, "Patient Diagnosis Report")
    
#     pdf.setFont("Helvetica", 12)
#     pdf.drawString(50, 700, f"Patient Name: {data.get('patient_name', 'Unknown')}")
#     pdf.drawString(50, 680, f"Age: {data.get('age', 'N/A')}")
#     pdf.drawString(50, 660, f"Date: {data.get('date', 'N/A')}")
    
#     y_position = 640
#     for pred in data['predictions']:
#         pdf.drawString(50, y_position, f"Image: {pred.get('filename', 'Unknown')}")
#         pdf.drawString(50, y_position - 20, f"Result: {pred.get('result', 'Error')}")
        
#         # ✅ Fix: Handle missing 'suggestion' key properly
#         suggestion = pred.get('suggestion', 'No suggestion available')
#         pdf.drawString(50, y_position - 40, f"Suggestion: {suggestion}")

#         y_position -= 80  # Move to the next block

#     pdf.showPage()
#     pdf.save()
    
#     buffer.seek(0)
#     return send_file(buffer, as_attachment=True, download_name="diagnosis_report.pdf", mimetype="application/pdf")

# if __name__ == '__main__':
#     app.run(debug=True, port=5002)

import os
import io
import subprocess
import datetime
import torch
import pypandoc
from flask import Flask, request, jsonify, send_file
from torchvision import transforms
from PIL import Image
from flask_cors import CORS
from pypdf import PdfReader, PdfWriter

# Initialize Flask app
app = Flask(__name__, static_folder='Frontend', template_folder='Frontend')
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

MODEL_PATH = "final_vit_glaucoma_model_the_bestepochs.pth"
model = None

# Load Model
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
        image = transform(image).unsqueeze(0)
        with torch.no_grad():
            output = model(image)
        
        result = "Negative" if output[0][0].item() > 1 else "Positive"
        suggestion = (
            "⚠️ Glaucoma detected. Immediate medical consultation is strongly recommended."
            if result == "Positive"
            else "✅ No signs of glaucoma detected. Maintain regular eye check-ups."
        )

        return result, suggestion  
    except Exception as e:
        return "Error", f"Error processing image: {str(e)}"

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    try:
        print("🔄 Receiving request for PDF generation...")

        # ✅ Debug: Print received data
        print("📩 Received JSON Data:", request.json)

        # ✅ Collect user inputs
        patient_name = request.json.get("patient_name", "Unknown")
        dob = request.json.get("dob", "N/A")
        phone = request.json.get("phone", "N/A")
        address = request.json.get("address", "N/A")
        nationality = request.json.get("nationality", "N/A")

        print(f"✅ Patient Name: {patient_name}, DOB: {dob}")

        # ✅ Check if predictions exist
        predictions = request.json.get("predictions", [])
        if not predictions:
            print("❌ Error: No predictions found in request.")
            return jsonify({"error": "No predictions provided"}), 400

        # 🔹 Generate Markdown Content
        markdown_content = f"""
<center><h1>PREDICTION RESULTS</h1></center>
---

## 📌 Patient Details
- **Name**: {patient_name}
- **Date of Birth**: {dob}
- **Phone Number**: {phone}
- **Address**: {address}
- **Nationality**: {nationality}

## 🔬 Test Results
| Image | Prediction |
|---|---|
"""
        for pred in predictions:
            filename = pred.get('filename', 'Unknown')
            result = pred.get('result', 'Error')
            markdown_content += f"| {filename} | {result} |\n"

        markdown_content += "\n## 🏥 Doctor's Suggestions\n"
        for pred in predictions:
            suggestion = pred.get('suggestion', 'No suggestion available')
            markdown_content += f"- {suggestion}\n"

        # 🔹 Save Markdown File
        markdown_file = "report_1.md"
        with open(markdown_file, "w", encoding="utf-8") as f:
            f.write(markdown_content)

        print("✅ Markdown file created successfully.")

        # 🔹 Convert Markdown to DOCX
        output_docx = "report.docx"
        try:
            pypandoc.convert_file(markdown_file, 'docx', outputfile=output_docx)
            if not os.path.exists(output_docx):
                print("❌ Error: DOCX conversion failed.")
                return jsonify({"error": "DOCX conversion failed"}), 500
        except Exception as e:
            print(f"❌ Error in DOCX conversion: {e}")
            return jsonify({"error": f"DOCX conversion error: {str(e)}"}), 500

        print("✅ DOCX file generated successfully.")

        # 🔹 Convert DOCX to PDF using LibreOffice
        output_pdf = "report.pdf"
        try:
            subprocess.run(["soffice", "--headless", "--convert-to", "pdf", output_docx], check=True)
            if not os.path.exists(output_pdf):
                print("❌ Error: PDF conversion failed.")
                return jsonify({"error": "PDF conversion failed"}), 500
        except Exception as e:
            print(f"❌ Error in PDF conversion: {e}")
            return jsonify({"error": f"LibreOffice conversion error: {str(e)}"}), 500

        print("✅ PDF file generated successfully.")

        # 🔹 Optimize PDF Using `pypdf`
        optimized_pdf = "optimized_report.pdf"
        try:
            reader = PdfReader(output_pdf)
            writer = PdfWriter()

            for page in reader.pages:
                writer.add_page(page)

            with open(optimized_pdf, "wb") as out_pdf:
                writer.write(out_pdf)

            print("✅ PDF optimized and ready for download.")
        except Exception as e:
            print(f"❌ PDF Optimization error: {e}")
            return jsonify({"error": f"PDF optimization error: {str(e)}"}), 500

        return send_file(optimized_pdf, as_attachment=True, download_name="diagnosis_report.pdf", mimetype="application/pdf")

    except Exception as e:
        print(f"❌ Unexpected Error Generating PDF: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
