# import os
# import subprocess
# import torch
# import torch.nn.functional as F
# import torch.nn as nn
# import timm
# from timm import create_model
# import pypandoc
# from flask import Flask, request, jsonify, send_file
# from torchvision import transforms
# from PIL import Image
# from flask_cors import CORS

# class CustomSwin(nn.Module):
#     def __init__(self):
#         super(CustomSwin, self).__init__()
#         self.backbone = create_model(
#             'swin_tiny_patch4_window7_224',
#             pretrained=True,
#             num_classes=0,
#             drop_rate=0.4,
#             drop_path_rate=0.3
#         )
#         self.head = nn.Sequential(
#             nn.LayerNorm(self.backbone.num_features),
#             nn.Dropout(0.5),
#             nn.Linear(self.backbone.num_features, 256),
#             nn.GELU(),
#             nn.Dropout(0.5),
#             nn.Linear(256, 1)
#         )

#     def forward(self, x):
#         x = self.backbone(x)
#         return self.head(x)
    
# class CustomSwin_DR(nn.Module):
#     def __init__(self, num_classes=5):
#         super().__init__()
#         self.backbone = timm.create_model("swin_tiny_patch4_window7_224", pretrained=True, num_classes=0)
#         self.dropout = nn.Dropout(0.5)  # Increased dropout to 50%
#         self.head = nn.Linear(self.backbone.num_features, num_classes)

#     def forward(self, x):
#         x = self.backbone(x)
#         x = self.dropout(x)
#         x = self.head(x)
#         return x

# # Initialize Flask app
# app = Flask(__name__)
# CORS(app)

# # Model Paths
# GLAUCOMA_MODEL_PATH = "swin_glaucoma_modelll.pth"
# DR_MODEL_PATH = "best_swin_model_dr.pth"

# # Load Models
# glaucoma_model = None
# dr_model = None
# try:
#     if os.path.exists(GLAUCOMA_MODEL_PATH):
#         glaucoma_model = torch.load(GLAUCOMA_MODEL_PATH, map_location=torch.device("cpu"))
#         glaucoma_model.eval()
#         print("✅ Glaucoma model loaded successfully.")
#     else:
#         print(f"❌ Error: Glaucoma model '{GLAUCOMA_MODEL_PATH}' not found.")
    
#     if os.path.exists(DR_MODEL_PATH):
#         dr_model = torch.load(DR_MODEL_PATH, map_location=torch.device("cpu"))
#         dr_model.eval()
#         print("✅ DR model loaded successfully.")
#     else:
#         print(f"❌ Error: DR model '{DR_MODEL_PATH}' not found.")
# except Exception as e:
#     print(f"❌ Error loading models: {e}")

# # Image Preprocessing
# transform = transforms.Compose([
#     transforms.Resize((224, 224)),
#     transforms.ToTensor(),
#     transforms.Normalize([0.5], [0.5])
# ])

 
# CLASS_LABELS = {0: "Mild", 1: "Moderate", 2: "No_DR", 3: "Proliferate_DR", 4: "Severe"}
# SUGGESTIONS = {
#     "No_DR": " No signs of diabetic retinopathy detected.",
#     "Mild": " Mild signs of DR detected.",
#     "Moderate": " Moderate DR detected. Consult an ophthalmologist.",
#     "Severe": " Severe DR detected. Immediate consultation needed.",
#     "Proliferate_DR": " Advanced DR detected. Urgent medical attention required!"
# }

# # Prediction Function
# def predict_glaucoma(image):
#     try:
#         image = transform(image).unsqueeze(0)
#         with torch.no_grad():
#             output = glaucoma_model(image)
#         result = "Negative" if output[0][0].item() > 1 else "Positive"
#         suggestion = " Glaucoma detected. Seek medical consultation." if result == "Positive" else " No signs of glaucoma detected "
#         return result, suggestion
#     except Exception as e:
#         return "Error", f"Error processing image: {str(e)}"

# def predict_dr(image):
#     try:
#         image = transform(image).unsqueeze(0)
#         with torch.no_grad():
#             output = dr_model(image)
#             probabilities = F.softmax(output, dim=1)
#         predicted_class = torch.argmax(probabilities, dim=1).item()
#         confidence = round(probabilities[0][predicted_class].item() * 100, 2)
#         result = CLASS_LABELS[predicted_class]
#         suggestion = SUGGESTIONS[result]
#         return result, confidence, suggestion
#     except Exception as e:
#         return "Error", 0.0, f"Error processing image: {str(e)}"

# @app.route('/predict', methods=['POST'])
# def predict():
#     if not glaucoma_model or not dr_model:
#         return jsonify({"error": "Models not loaded"}), 500

#     if 'images' not in request.files:
#         return jsonify({"error": "No images provided"}), 400

#     files = request.files.getlist('images')
#     predictions = []
#     for file in files:
#         try:
#             image = Image.open(file.stream).convert('RGB')
#             glaucoma_result, glaucoma_suggestion = predict_glaucoma(image)
#             dr_result, confidence, dr_suggestion = predict_dr(image)
#             predictions.append({
#                 "filename": file.filename,
#                 "glaucoma_result": glaucoma_result,
#                 "glaucoma_suggestion": glaucoma_suggestion,
#                 "dr_result": dr_result,
#                 "dr_confidence": confidence,
#                 "dr_suggestion": dr_suggestion
#             })
#         except Exception as e:
#             predictions.append({"filename": file.filename, "error": str(e)})
#     return jsonify({"predictions": predictions})

# @app.route('/generate_pdf', methods=['POST'])
# def generate_pdf():
#     try:
#         patient_info = request.json.get("patient_info", {})
#         predictions = request.json.get("predictions", [])

#         markdown_content = f"""
# # **DISEASE DETECTION REPORT**

# ## **Patient Details**
# - **Name**: {patient_info.get('name', 'Unknown')}
# - **DOB**: {patient_info.get('dob', 'N/A')}
# - **Gender**: {patient_info.get('gender', 'N/A')}
# - **Blood Group**: {patient_info.get('blood_group', 'N/A')}
# - **Phone**: {patient_info.get('phone', 'N/A')}
# - **Address**: {patient_info.get('address', 'N/A')}
# - **Emergency Contact Name**: {patient_info.get('emergency_contact', 'N/A')}
# - **Emergency Contact Phone**: {patient_info.get('emergency_phone', 'N/A')}
# - **Medical History**: {patient_info.get('medical_history', 'N/A')}
# - **Insurance Provider**: {patient_info.get('insurance', 'N/A')}

# ## **Test Results**
# | Image | Glaucoma Result | DR Result |
# |---|---|---|
# """

#         for pred in predictions:
#             markdown_content += f"| {pred['filename']} | {pred['glaucoma_result']} | {pred['dr_result']} |\n"

#         markdown_content += "\n## **Doctor's Suggestions**\n"
#         for pred in predictions:
#             markdown_content += f"- **{pred['filename']}** → {pred['glaucoma_suggestion']} and {pred['dr_suggestion']}\n"

#         # Write markdown to file
#         markdown_file = "report.md"
#         with open(markdown_file, "w", encoding="utf-8") as f:
#             f.write(markdown_content)

#         # Convert to DOCX, then PDF
#         output_docx = "report.docx"
#         pypandoc.convert_file(markdown_file, 'docx', outputfile=output_docx)
#         subprocess.run(["soffice", "--headless", "--convert-to", "pdf", output_docx], check=True)

#         return send_file("report.pdf", as_attachment=True, download_name="Diagnosis_Report.pdf", mimetype="application/pdf")
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True, port=5002)

import os
import subprocess
import traceback
import torch
import torch.nn as nn
import torch.nn.functional as F
import pypandoc
from flask import Flask, request, jsonify, send_file
from torchvision import transforms
from PIL import Image
from flask_cors import CORS
import timm

# TIMM version check
assert timm.__version__ == "1.0.12", f"❌ Incompatible TIMM version: {timm.__version__}. Please install timm==1.0.12"
print(f"✅ TIMM version is correct: {timm.__version__}")

# Flask setup
app = Flask(__name__)
CORS(app)

# ---- MODEL DEFINITIONS ----
class CustomSwin(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = timm.create_model(
            "swin_tiny_patch4_window7_224", pretrained=False, num_classes=0,
            drop_rate=0.4, drop_path_rate=0.3
        )
        self.head = nn.Sequential(
            nn.LayerNorm(self.backbone.num_features),
            nn.Dropout(0.5),
            nn.Linear(self.backbone.num_features, 256),
            nn.GELU(),
            nn.Dropout(0.5),
            nn.Linear(256, 1)
        )

    def forward(self, x):
        x = self.backbone(x)
        return self.head(x)

class CustomSwin_DR(nn.Module):
    def __init__(self, num_classes=5):
        super().__init__()
        self.backbone = timm.create_model("swin_tiny_patch4_window7_224", pretrained=False, num_classes=0)
        self.dropout = nn.Dropout(0.5)
        self.head = nn.Linear(self.backbone.num_features, num_classes)

    def forward(self, x):
        x = self.backbone(x)
        x = self.dropout(x)
        x = self.head(x)
        return x

# ---- TRANSFORM ----
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3, [0.5]*3)
])

# ---- LABELS & SUGGESTIONS ----
CLASS_LABELS = {0: "Mild", 1: "Moderate", 2: "No_DR", 3: "Proliferate_DR", 4: "Severe"}
SUGGESTIONS = {
    "No_DR": " No signs of diabetic retinopathy detected.",
    "Mild": " Mild signs of DR detected.",
    "Moderate": " Moderate DR detected. Consult an ophthalmologist.",
    "Severe": " Severe DR detected. Immediate consultation needed.",
    "Proliferate_DR": " Advanced DR detected. Urgent medical attention required!"
}

# ---- LOAD MODELS ----
GLAUCOMA_MODEL_PATH = "swin_glaucoma_modelll.pth"
DR_MODEL_PATH = "best_swin_model_dr.pth"

glaucoma_model = torch.load(GLAUCOMA_MODEL_PATH, map_location="cpu", weights_only=False)
glaucoma_model.eval()
print("✅ Glaucoma model loaded successfully.")

dr_model = torch.load(DR_MODEL_PATH, map_location="cpu", weights_only=False)
dr_model.eval()
print("✅ DR model loaded successfully.")

# ---- SHARED PREPROCESS ----
def preprocess_image(image):
    image = image.convert("RGB")
    tensor = transform(image).unsqueeze(0)
    return tensor

# ---- GLAUCOMA PREDICTION ----
def predict_glaucoma(image):
    try:
        image_tensor = preprocess_image(image)
        with torch.no_grad():
            output = glaucoma_model(image_tensor)
            probability = torch.sigmoid(output).item()

        result = "Positive" if probability >= 0.5 else "Negative"
        suggestion = (
            " Glaucoma detected. Seek medical consultation."
            if result == "Positive"
            else " No signs of glaucoma detected "
        )
        return result, suggestion
    except Exception as e:
        traceback.print_exc()
        return "Error", f"Error processing image: {str(e)}"

# ---- DR PREDICTION ----
def predict_dr(image):
    try:
        image_tensor = preprocess_image(image)
        with torch.no_grad():
            output = dr_model(image_tensor)
            probabilities = F.softmax(output, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = round(probabilities[0][predicted_class].item() * 100, 2)

        result = CLASS_LABELS[predicted_class]
        suggestion = SUGGESTIONS[result]
        return result, confidence, suggestion
    except Exception as e:
        traceback.print_exc()
        return "Error", 0.0, f"Error processing image: {str(e)}"

# ---- PREDICTION ROUTE ----
@app.route('/predict', methods=['POST'])
def predict():
    if 'images' not in request.files:
        return jsonify({"error": "No images provided"}), 400

    files = request.files.getlist('images')
    predictions = []
    for file in files:
        try:
            image = Image.open(file.stream).convert('RGB')
            glaucoma_result, glaucoma_suggestion = predict_glaucoma(image)
            dr_result, confidence, dr_suggestion = predict_dr(image)

            predictions.append({
                "filename": file.filename,
                "glaucoma_result": glaucoma_result,
                "glaucoma_suggestion": glaucoma_suggestion,
                "dr_result": dr_result,
                "dr_confidence": confidence,
                "dr_suggestion": dr_suggestion
            })
        except Exception as e:
            traceback.print_exc()
            predictions.append({
                "filename": file.filename,
                "glaucoma_result": "Error",
                "glaucoma_suggestion": str(e),
                "dr_result": "Error",
                "dr_confidence": 0.0,
                "dr_suggestion": str(e)
            })
    return jsonify({"predictions": predictions})

# ---- PDF REPORT GENERATION ----
@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    try:
        patient_info = request.json.get("patient_info", {})
        predictions = request.json.get("predictions", [])

        markdown_content = f"""
# **DISEASE DETECTION REPORT**

## **Patient Details**
- **Name**: {patient_info.get('name', 'Unknown')}
- **DOB**: {patient_info.get('dob', 'N/A')}
- **Gender**: {patient_info.get('gender', 'N/A')}
- **Blood Group**: {patient_info.get('blood_group', 'N/A')}
- **Phone**: {patient_info.get('phone', 'N/A')}
- **Address**: {patient_info.get('address', 'N/A')}
- **Emergency Contact Name**: {patient_info.get('emergency_contact', 'N/A')}
- **Emergency Contact Phone**: {patient_info.get('emergency_phone', 'N/A')}
- **Medical History**: {patient_info.get('medical_history', 'N/A')}
- **Insurance Provider**: {patient_info.get('insurance', 'N/A')}

## **Test Results**
| Image | Glaucoma Result | DR Result |
|---|---|---|
"""
        for pred in predictions:
            markdown_content += f"| {pred['filename']} | {pred['glaucoma_result']} | {pred['dr_result']} |\n"

        markdown_content += "\n## **Doctor's Suggestions**\n"
        for pred in predictions:
            markdown_content += f"- **{pred['filename']}** → {pred['glaucoma_suggestion']} and {pred['dr_suggestion']}\n"

        with open("report.md", "w", encoding="utf-8") as f:
            f.write(markdown_content)

        # Convert to DOCX → PDF using Pandoc & LibreOffice
        pypandoc.convert_file("report.md", 'docx', outputfile="report.docx")
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "report.docx"], check=True)

        return send_file("report.pdf", as_attachment=True, download_name="Diagnosis_Report.pdf", mimetype="application/pdf")
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
