import os
from flask import Flask, request, jsonify, render_template
import torch
from torchvision import transforms
from PIL import Image
from flask_cors import CORS

# Initialize Flask app; set static and template folders to your Frontend directory.
app = Flask(__name__, static_folder='Frontend', template_folder='Frontend')
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create the uploads folder if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Load the entire model directly (requires that you saved the full model)
try:
    model = torch.load("best_model.pth", map_location=torch.device("cpu"))
    model.eval()
    print("Model loaded successfully without redefining the architecture.")
except Exception as e:
    print("Error loading model:", e)
    model = None

# Function to preprocess the image and perform prediction
def predict_image(image):
    # Preprocessing: adjust size and normalization as required by your model.
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])
    image = transform(image).unsqueeze(0)  # add batch dimension
    with torch.no_grad():
        output = model(image)
        probability = torch.sigmoid(output).item()
    return "Yes" if probability > 0.5 else "No"

# Route to serve the prediction page (using your existing Frontend/prediction.html)
@app.route('/')
def index():
    return render_template('prediction.html')

# Endpoint to handle prediction POST requests (supports multiple images)
@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    if 'images' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('images')
    if len(files) == 0:
        return jsonify({"error": "No files provided"}), 400

    predictions = []
    for file in files:
        try:
            # Uncomment the following lines if you wish to save the files:
            # filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            # file.save(filepath)
            
            # Open the image directly from the file stream
            image = Image.open(file.stream).convert('RGB')
            result = predict_image(image)
            predictions.append({"filename": file.filename, "result": result})
        except Exception as e:
            predictions.append({"filename": file.filename, "result": "Error", "error": str(e)})

    return jsonify({"predictions": predictions})

if __name__ == '__main__':
    app.run(debug=True, port=5002)
