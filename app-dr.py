import os
import torch
import torch.nn.functional as F
from flask import Flask, request, jsonify
from torchvision import transforms
from PIL import Image
from flask_cors import CORS

# ✅ Initialize Flask app for DR
app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ✅ DR Model Path
DR_MODEL_PATH = "vit_diabetic_retinopathy_entire_model.pth"

# ✅ Load DR Model
model_dr = None

try:
    if os.path.exists(DR_MODEL_PATH):
        model_dr = torch.load(DR_MODEL_PATH, map_location=torch.device("cpu"))  # ✅ Load on CPU
        model_dr.eval()  # ✅ Set to evaluation mode
        print("✅ DR Model loaded successfully on CPU.")
    else:
        print(f"❌ Error: DR Model file '{DR_MODEL_PATH}' not found.")
except Exception as e:
    print(f"❌ Error loading DR model: {e}")

# ✅ Image Transformation
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5], [0.5])
])

# ✅ Define Class Labels for Diabetic Retinopathy
CLASS_LABELS = {
    0: "No DR",
    1: "Mild DR",
    2: "Moderate DR",
    3: "Severe DR",
    4: "Proliferative DR"
}

# ✅ Define Treatment Suggestions for DR
SUGGESTIONS = {
    "No DR": "✅ No signs of diabetic retinopathy detected. Maintain regular eye check-ups.",
    "Mild DR": "⚠️ Mild signs of DR detected. Consider monitoring with regular follow-ups.",
    "Moderate DR": "⚠️ Moderate DR detected. Consult an ophthalmologist for early intervention.",
    "Severe DR": "❗ Severe DR detected. Immediate medical consultation is recommended.",
    "Proliferative DR": "🚨 Advanced DR detected. Urgent medical attention is required!"
}

# ✅ DR Prediction API
@app.route('/predict_dr', methods=['POST'])
def predict_dr():
    if model_dr is None:
        return jsonify({"error": "Diabetic Retinopathy model not loaded"}), 500

    if 'images' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('images')
    if not files:
        return jsonify({"error": "No files provided"}), 400

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
            print("🔢 Raw Model Output Tensor:", output)
            probabilities = F.softmax(output, dim=1)

        predicted_class = torch.argmax(probabilities, dim=1).item()
        confidence = round(probabilities[0][predicted_class].item() * 100, 2)

        result = CLASS_LABELS[predicted_class]
        suggestion = SUGGESTIONS[result]

        return result, confidence, suggestion
    except Exception as e:
        return "Error", 0.0, f"Error processing image: {str(e)}"

# ✅ Run Flask Server
if __name__ == '__main__':
    app.run(debug=True, port=5003)  
