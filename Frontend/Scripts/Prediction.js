// document.addEventListener("DOMContentLoaded", function() {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (user) {
//         document.getElementById("userName").textContent = user.firstName || "User";
//     } else {
//         window.location.href = "login.html"; // Redirect to login if not authenticated
//     }

//     const glaucomaInput = document.getElementById("glaucomaImageInput");
//     const previewContainer = document.getElementById("glaucomaPreviewContainer");

//     glaucomaInput.addEventListener("change", function(event) {
//         const files = event.target.files;

//         if (files.length > 0) {
//             Array.from(files).forEach((file, index) => {
//                 const reader = new FileReader();
//                 reader.onload = function(e) {
//                     const previewDiv = document.createElement("div");
//                     previewDiv.classList.add("preview-item");

//                     const img = document.createElement("img");
//                     img.src = e.target.result;
//                     img.classList.add("preview-image");

//                     const closeIcon = document.createElement("span");
//                     closeIcon.innerHTML = "&times;"; // Cross mark
//                     closeIcon.classList.add("close-icon");
//                     closeIcon.onclick = function() {
//                         previewDiv.remove();
//                     };

//                     previewDiv.appendChild(img);
//                     previewDiv.appendChild(closeIcon);
//                     previewContainer.appendChild(previewDiv);
//                 };
//                 reader.readAsDataURL(file);
//             });
//         }
//     });
// });

// document.getElementById("logoutConfirmBtn").addEventListener("click", confirmLogout);

// // Show logout confirmation popup
// function showLogoutPopup() {
//     document.getElementById("logoutPopup").style.display = "flex";
// }

// // Close the popup
// function closeLogoutPopup() {
//     document.getElementById("logoutPopup").style.display = "none";
// }

// // Confirm and perform logout
// function confirmLogout() {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     document.getElementById("logoutPopup").style.display = "none"; // Hide popup
//     window.location.href = "login.html"; // Redirect to login page
// }

// // Remove uploaded image
// function removeGlaucomaImage() {
//     document.getElementById("glaucomaImageInput").value = "";
//     document.getElementById("glaucomaPreviewContainer").style.display = "none";
// }

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

// // New function to submit images for prediction
// function submitPrediction() {
//     const inputElement = document.getElementById("glaucomaImageInput");
//     const files = inputElement.files;

//     if (files.length === 0) {
//         alert("Please select at least one image for prediction.");
//         return;
//     }

//     const formData = new FormData();
//     for (let i = 0; i < files.length; i++) {
//         formData.append("images", files[i]);
//     }

//     fetch("http://localhost:5002/predict", {
//         method: "POST",
//         body: formData
//     })
//     .then(response => response.json())
//     .then(data => {
//         const predictionResult = document.getElementById("predictionResult");
//         let reportHTML = `<h3>Diagnosis Report</h3>`;

//         data.predictions.forEach(pred => {
//             let suggestion = (pred.result === "Positive") 
//                 ? "⚠️ Glaucoma detected. Immediate medical consultation is strongly recommended."
//                 : "✅ No signs of glaucoma detected. Maintain regular eye check-ups.";
        
//             reportHTML += `
//                 <p><strong>Patient Name:</strong> John Doe</p>
//                 <p><strong>Age:</strong> 45</p>
//                 <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
//                 <p><strong>Image:</strong> ${pred.filename}</p>
//                 <p><strong>Result:</strong> ${pred.result}</p>
//                 <p><strong>Suggestion:</strong> ${suggestion}</p>  <!-- ✅ Now only one suggestion appears -->
//                 <hr>
//             `;
//         });
        
//         predictionResult.innerHTML = reportHTML;
//     })
//     .catch(error => {
//         console.error("Error during prediction:", error);
//     });
    
// }

// function downloadPDF() {
//     const reportData = {
//         patient_name: "John Doe",
//         age: 45,
//         date: new Date().toLocaleDateString(),
//         predictions: []
//     };

//     document.querySelectorAll("#predictionResult hr").forEach((_, index) => {
//         const filename = document.querySelectorAll("#predictionResult strong")[index * 5 + 3].nextSibling.nodeValue.trim();
//         const result = document.querySelectorAll("#predictionResult strong")[index * 5 + 4].nextSibling.nodeValue.trim();
//         const suggestion = document.querySelectorAll("#predictionResult strong")[index * 5 + 5].nextSibling.nodeValue.trim();  // ✅ Now includes suggestion

//         reportData.predictions.push({ filename, result, suggestion });
//     });

//     fetch("http://localhost:5002/generate_pdf", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(reportData)
//     })
//     .then(response => response.blob())
//     .then(blob => {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "diagnosis_report.pdf";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//     })
//     .catch(error => {
//         console.error("Error generating PDF:", error);
//     });
// }

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

// function downloadPDF() {
//     const reportData = new FormData();

//     // ✅ Collect patient details
//     reportData.append("Name", document.getElementById("patientName").value.trim());
//     reportData.append("Gender", document.getElementById("patientGender").value.trim());
//     reportData.append("Location", document.getElementById("patientLocation").value.trim());
//     reportData.append("ID No.", document.getElementById("patientID").value.trim());
//     reportData.append("Date of Birth", document.getElementById("patientDOB").value.trim());
//     reportData.append("Age", document.getElementById("patientAge").value.trim());
//     reportData.append("Nationality", document.getElementById("patientNationality").value.trim());
//     reportData.append("Blood Sugar", document.getElementById("bloodSugar").value.trim());

//     // ✅ Collect Glaucoma result
//     reportData.append("Glaucoma", document.getElementById("glaucomaResult").innerText);

//     fetch("http://127.0.0.1:5002/generate_pdf", {
//         method: "POST",
//         body: reportData
//     })
//     .then(response => response.blob())
//     .then(blob => {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "Patient_Report.pdf";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//     })
//     .catch(error => {
//         console.error("Error generating PDF:", error);
//     });
// }
