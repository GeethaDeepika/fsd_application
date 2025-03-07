document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.getElementById("userName").textContent = user.firstName || "User";
    } else {
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }

    const glaucomaInput = document.getElementById("glaucomaImageInput");
    const previewContainer = document.getElementById("glaucomaPreviewContainer");

    glaucomaInput.addEventListener("change", function(event) {
        const files = event.target.files;
        previewContainer.innerHTML = ""; // Clear previous previews

        if (files.length > 0) {
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewDiv = document.createElement("div");
                    previewDiv.classList.add("preview-item");

                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.classList.add("preview-image");

                    const closeIcon = document.createElement("span");
                    closeIcon.innerHTML = "&times;"; // Cross mark
                    closeIcon.classList.add("close-icon");
                    closeIcon.onclick = function() {
                        previewDiv.remove();
                    };

                    previewDiv.appendChild(img);
                    previewDiv.appendChild(closeIcon);
                    previewContainer.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            });
        }
    });
});

document.getElementById("logoutConfirmBtn").addEventListener("click", confirmLogout);

// Show logout confirmation popup
function showLogoutPopup() {
    document.getElementById("logoutPopup").style.display = "flex";
}

// Close the popup
function closeLogoutPopup() {
    document.getElementById("logoutPopup").style.display = "none";
}

// Confirm and perform logout
function confirmLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.getElementById("logoutPopup").style.display = "none"; // Hide popup
    window.location.href = "login.html"; // Redirect to login page
}

// Remove uploaded image
function removeGlaucomaImage() {
    document.getElementById("glaucomaImageInput").value = "";
    document.getElementById("glaucomaPreviewContainer").style.display = "none";
}

//remove dr image 
function removeDrImage() {
    document.getElementById("drImageInput").value = "";
    document.getElementById("drPreviewContainer").style.display = "none";
}

let currentStep = 0;
const formSteps = document.querySelectorAll(".form-step");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const submitBtn = document.querySelector("#submitBtn");
const dots = document.querySelectorAll(".dot");

function updateForm() {
    formSteps.forEach((step, index) => {
        step.classList.toggle("active", index === currentStep);
        dots[index].classList.toggle("active", index === currentStep);
    });

    prevBtn.disabled = currentStep === 0;
    nextBtn.style.display = currentStep === formSteps.length - 1 ? "none" : "inline-block";
    submitBtn.style.display = currentStep === formSteps.length - 1 ? "inline-block" : "none";
}

function nextStep() {
    if (currentStep < formSteps.length - 1) {
        currentStep++;
        updateForm();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        updateForm();
    }
}

// Initialize form
updateForm();


function submitPrediction() {
    const inputElement = document.getElementById("glaucomaImageInput");
    const files = inputElement.files;

    if (files.length === 0) {
        alert("Please select at least one image for prediction.");
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
    }

    fetch("http://localhost:5002/predict", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const predictionResult = document.getElementById("predictionResult");
        let reportHTML = `<h3>Diagnosis Report</h3>`;

        data.predictions.forEach(pred => {
            let suggestion = (pred.result === "Positive") 
                ? "⚠️ Glaucoma detected. Immediate medical consultation is strongly recommended."
                : "✅ No signs of glaucoma detected. Maintain regular eye check-ups.";
        
            reportHTML += `
                <p><strong>Image:</strong> ${pred.filename}</p>
                <p><strong>Result:</strong> ${pred.result}</p>
                <p><strong>Suggestion:</strong> ${suggestion}</p>
                <hr>
            `;
        });
        
        predictionResult.innerHTML = reportHTML;
    })
    .catch(error => {
        console.error("Error during prediction:", error);
    });
}

function downloadPDF() {
    // 🔹 Get Patient Details from Form
    const patientName = document.getElementById("patientName").value || "Unknown";
    const dob = document.getElementById("patientDOB").value || "N/A";
    const phone = document.getElementById("patientPhone").value || "N/A";
    const address = document.getElementById("patientAddress").value || "N/A";
    const nationality = document.getElementById("patientNationality").value || "N/A";

    // 🔹 Calculate Age from DOB
    let age = "N/A";
    if (dob !== "N/A") {
        const birthDate = new Date(dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--; // Adjust for incomplete year
        }
    }

    // 🔹 Prepare Report Data
    const reportData = {
        patient_name: patientName,
        dob: dob,
        age: age,
        phone: phone,
        address: address,
        nationality: nationality,
        date: new Date().toLocaleDateString(),
        predictions: []
    };

    // 🔹 Extract Predictions from UI
    document.querySelectorAll("#predictionResult hr").forEach((_, index) => {
        const filename = document.querySelectorAll("#predictionResult strong")[index * 3].nextSibling.nodeValue.trim();
        const result = document.querySelectorAll("#predictionResult strong")[index * 3 + 1].nextSibling.nodeValue.trim();
        const suggestion = document.querySelectorAll("#predictionResult strong")[index * 3 + 2].nextSibling.nodeValue.trim();

        reportData.predictions.push({ filename, result, suggestion });
    });

    // 🔹 Send Data to Backend for PDF Generation
    fetch("http://localhost:5002/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "diagnosis_report.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error("Error generating PDF report:", error);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const drInput = document.getElementById("drImageInput");
    const drPreviewContainer = document.getElementById("drPreviewContainer");

    drInput.addEventListener("change", function(event) {
        const files = event.target.files;
        drPreviewContainer.innerHTML = ""; // Clear previous previews

        if (files.length > 0) {
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewDiv = document.createElement("div");
                    previewDiv.classList.add("preview-item");

                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.classList.add("preview-image");

                    const closeIcon = document.createElement("span");
                    closeIcon.innerHTML = "&times;"; // Close button
                    closeIcon.classList.add("close-icon");
                    closeIcon.onclick = function() {
                        previewDiv.remove();
                        drInput.value = ""; // Reset input if removed
                    };

                    previewDiv.appendChild(img);
                    previewDiv.appendChild(closeIcon);
                    drPreviewContainer.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            });
        }
    });
});


// ✅ Submit DR Prediction
function submitDrPrediction() {
    const inputElement = document.getElementById("drImageInput");
    const files = inputElement.files;

    if (files.length === 0) {
        alert("Please select at least one image for prediction.");
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
    }

    fetch("http://localhost:5003/predict_dr", {  // ✅ DR API on port 5003
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const drPredictionResult = document.getElementById("drPredictionResult");
        let reportHTML = `<h3>DR Diagnosis Report</h3>`;

        data.predictions.forEach(pred => {
            reportHTML += `
                <p><strong>Image:</strong> ${pred.filename}</p>
                <p><strong>Result:</strong> ${pred.result}</p>
                <p><strong>Confidence:</strong> ${pred.confidence}%</p>
                <p><strong>Suggestion:</strong> ${pred.suggestion}</p>
                <hr>
            `;
        });

        drPredictionResult.innerHTML = reportHTML;
    })
    .catch(error => {
        console.error("Error during DR prediction:", error);
    });
}
