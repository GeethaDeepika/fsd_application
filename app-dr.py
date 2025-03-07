import os
import subprocess
import datetime
import torch
import torch.nn.functional as F
import pypandoc
from flask import Flask, request, jsonify, send_file
from torchvision import transforms
from PIL import Image
from flask_cors import CORS
from pypdf import PdfReader, PdfWriter

# ✅ Initialize Flask app
app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ✅ DR Model Path
DR_MODEL_PATH = "vit_diabetic_retinopathy_final.pth"

# ✅ Load DR Model
model_dr = None
try:
    if os.path.exists(DR_MODEL_PATH):
        model_dr = torch.load(DR_MODEL_PATH, map_location=torch.device("cpu"))  
        model_dr.eval()
        print("✅ DR Model loaded successfully on CPU.")
    else:
        print(f"❌ Error: DR Model file '{DR_MODEL_PATH}' not found.")
except Exception as e:
    print(f"❌ Error loading DR model: {e}")

# ✅ Image Preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])
])

# ✅ Define Class Labels & Treatment Suggestions
CLASS_LABELS = {
    0: "Mild",
    1: "Moderate",
    2: "No_DR",
    3: "Proliferate_DR",
    4: "Severe"
}

SUGGESTIONS = {
    "No_DR": "✅ No signs of diabetic retinopathy detected. Maintain regular eye check-ups.",
    "Mild": "⚠️ Mild signs of DR detected. Consider monitoring with regular follow-ups.",
    "Moderate": "⚠️ Moderate DR detected. Consult an ophthalmologist for early intervention.",
    "Severe": "❗ Severe DR detected. Immediate medical consultation is recommended.",
    "Proliferate_DR": "🚨 Advanced DR detected. Urgent medical attention is required!"
}

# ✅ DR Prediction API
@app.route('/predict_dr', methods=['POST'])
def predict_dr():
    if model_dr is None:
        return jsonify({"error": "Diabetic Retinopathy model not loaded"}), 500

    if 'images' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('images')
    predictions = []

    for file in files:
        try:
            image = Image.open(file.stream).convert('RGB')
            result, confidence, suggestion = predict_dr_image(image)
            predictions.append({
                "filename": file.filename,
                "result": result,
                "confidence": confidence,
                "suggestion": suggestion
            })
        except Exception as e:
            predictions.append({
                "filename": file.filename,
                "result": "Error",
                "error": str(e),
                "suggestion": "No suggestion available"
            })

    return jsonify({"predictions": predictions})

# ✅ DR Prediction Function (Multi-Class)
def predict_dr_image(image):
    try:
        image = transform(image).unsqueeze(0)
        with torch.no_grad():
            output = model_dr(image)
            probabilities = F.softmax(output, dim=1)

        predicted_class = torch.argmax(probabilities, dim=1).item()
        confidence = round(probabilities[0][predicted_class].item() * 100, 2)

        result = CLASS_LABELS[predicted_class]
        suggestion = SUGGESTIONS[result]

        return result, confidence, suggestion
    except Exception as e:
        return "Error", 0.0, f"Error processing image: {str(e)}"

# ✅ PDF Generation API with a Dedicated Suggestions Section
@app.route('/generate_dr_pdf', methods=['POST'])
def generate_dr_pdf():
    try:
        patient_name = request.json.get("patient_name", "Unknown")
        dob = request.json.get("dob", "N/A")
        phone = request.json.get("phone", "N/A")
        address = request.json.get("address", "N/A")
        nationality = request.json.get("nationality", "N/A")

        try:
            birth_date = datetime.datetime.strptime(dob, "%Y-%m-%d")
            today = datetime.date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        except ValueError:
            age = "Invalid DOB Format"

        predictions = request.json.get("predictions", [])
        if not predictions:
            return jsonify({"error": "No predictions provided"}), 400

        markdown_content = f"""
# **DIABETIC RETINOPATHY DETECTION REPORT**

## **Patient Details**
- **Name**: {patient_name}
- **Date of Birth**: {dob}
- **Age**: {age}
- **Phone Number**: {phone}
- **Address**: {address}
- **Nationality**: {nationality}

## **Test Results**
| Image | Prediction | 
|---|---|
"""
        for pred in predictions:
            markdown_content += f"| {pred['filename']} | {pred['result']} |\n"

        markdown_content += "\n## **Suggestions**\n"
        for pred in predictions:
            markdown_content += f"**{pred['filename']}** → {pred['suggestion']}\n\n"

        markdown_file = "dr_report.md"
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

        return send_file(optimized_pdf, as_attachment=True, download_name="DR_Detection_Report.pdf", mimetype="application/pdf")

    except Exception as e:
        print(f"❌ Unexpected Error Generating PDF: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ✅ Run Flask Server
if __name__ == '__main__':
    app.run(debug=True, port=5003)
