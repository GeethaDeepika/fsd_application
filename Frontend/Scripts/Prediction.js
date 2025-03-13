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
//         previewContainer.innerHTML = ""; // Clear previous previews

//         if (files.length > 0) {
//             Array.from(files).forEach((file) => {
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

// //remove dr image 
// function removeDrImage() {
//     document.getElementById("drImageInput").value = "";
//     document.getElementById("drPreviewContainer").style.display = "none";
// }

// let currentStep = 0;
// const formSteps = document.querySelectorAll(".form-step");
// const prevBtn = document.querySelector(".prev-btn");
// const nextBtn = document.querySelector(".next-btn");
// const submitBtn = document.querySelector("#submitBtn");
// const dots = document.querySelectorAll(".dot");

// function updateForm() {
//     formSteps.forEach((step, index) => {
//         step.classList.toggle("active", index === currentStep);
//         dots[index].classList.toggle("active", index === currentStep);
//     });

//     prevBtn.disabled = currentStep === 0;
//     nextBtn.style.display = currentStep === formSteps.length - 1 ? "none" : "inline-block";
//     submitBtn.style.display = currentStep === formSteps.length - 1 ? "inline-block" : "none";
// }

// function nextStep() {
//     if (currentStep < formSteps.length - 1) {
//         currentStep++;
//         updateForm();
//     }
// }

// function prevStep() {
//     if (currentStep > 0) {
//         currentStep--;
//         updateForm();
//     }
// }

// // Initialize form
// updateForm();

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
//                 <p><strong>Image:</strong> ${pred.filename}</p>
//                 <p><strong>Result:</strong> ${pred.result}</p>
//                 <p><strong>Suggestion:</strong> ${suggestion}</p>
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
//     // 🔹 Get Patient Details from Form
//     const patientName = document.getElementById("patientName").value || "Unknown";
//     const dob = document.getElementById("patientDOB").value || "N/A";
//     const phone = document.getElementById("patientPhone").value || "N/A";
//     const address = document.getElementById("patientAddress").value || "N/A";
//     const nationality = document.getElementById("patientNationality").value || "N/A";

//     // 🔹 Calculate Age from DOB
//     let age = "N/A";
//     if (dob !== "N/A") {
//         const birthDate = new Date(dob);
//         const today = new Date();
//         age = today.getFullYear() - birthDate.getFullYear();
//         const monthDiff = today.getMonth() - birthDate.getMonth();
//         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//             age--; // Adjust for incomplete year
//         }
//     }

//     // 🔹 Prepare Report Data
//     const reportData = {
//         patient_name: patientName,
//         dob: dob,
//         age: age,
//         phone: phone,
//         address: address,
//         nationality: nationality,
//         date: new Date().toLocaleDateString(),
//         predictions: []
//     };

//     // 🔹 Extract Predictions from UI
//     document.querySelectorAll("#predictionResult hr").forEach((_, index) => {
//         const filename = document.querySelectorAll("#predictionResult strong")[index * 3].nextSibling.nodeValue.trim();
//         const result = document.querySelectorAll("#predictionResult strong")[index * 3 + 1].nextSibling.nodeValue.trim();
//         const suggestion = document.querySelectorAll("#predictionResult strong")[index * 3 + 2].nextSibling.nodeValue.trim();

//         reportData.predictions.push({ filename, result, suggestion });
//     });

//     // 🔹 Send Data to Backend for PDF Generation
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
//         console.error("Error generating PDF report:", error);
//     });
// }


// // ✅ DR Multi-Step Form Logic
// document.addEventListener("DOMContentLoaded", function () {
//     let drStep = 0;
//     const drSteps = document.querySelectorAll("#drpatientDetailsForm .form-step");
//     const drDots = document.querySelectorAll("#drpatientDetailsForm .dot");
//     const drPrevBtn = document.querySelector("#drpatientDetailsForm .prev-btn");
//     const drNextBtn = document.querySelector("#drpatientDetailsForm .next-btn");
//     const drSubmitBtn = document.querySelector("#submitDrBtn");

//     function updateDrForm() {
//         drSteps.forEach((step, index) => {
//             step.style.display = index === drStep ? "block" : "none";
//         });

//         drDots.forEach((dot, index) => {
//             dot.classList.toggle("active", index === drStep);
//         });

//         drPrevBtn.disabled = drStep === 0;
//         drNextBtn.style.display = drStep === drSteps.length - 1 ? "none" : "inline-block";
//         drSubmitBtn.style.display = drStep === drSteps.length - 1 ? "inline-block" : "none";
//     }

//     window.nextDrStep = function () {
//         if (drStep < drSteps.length - 1) {
//             drStep++;
//             updateDrForm();
//         }
//     };

//     window.prevDrStep = function () {
//         if (drStep > 0) {
//             drStep--;
//             updateDrForm();
//         }
//     };

//     updateDrForm();
// });




// // ✅ DR Image Preview Handling
// document.getElementById("drImageInput").addEventListener("change", function (event) {
//     const files = event.target.files;
//     const drPreviewContainer = document.getElementById("drPreviewContainer");
//     drPreviewContainer.innerHTML = ""; 

//     if (files.length > 0) {
//         Array.from(files).forEach((file) => {
//             const reader = new FileReader();
//             reader.onload = function (e) {
//                 const previewDiv = document.createElement("div");
//                 previewDiv.classList.add("preview-item");

//                 const img = document.createElement("img");
//                 img.src = e.target.result;
//                 img.classList.add("preview-image");

//                 const closeIcon = document.createElement("span");
//                 closeIcon.innerHTML = "&times;";
//                 closeIcon.classList.add("close-icon");
//                 closeIcon.onclick = function () {
//                     previewDiv.remove();
//                     document.getElementById("drImageInput").value = ""; 
//                 };

//                 previewDiv.appendChild(img);
//                 previewDiv.appendChild(closeIcon);
//                 drPreviewContainer.appendChild(previewDiv);
//             };
//             reader.readAsDataURL(file);
//         });
//     }
// });

// function submitDrPrediction() {
//     const inputElement = document.getElementById("drImageInput");
//     const files = inputElement.files;

//     if (files.length === 0) {
//         alert("Please select at least one image for DR prediction.");
//         return;
//     }

//     const formData = new FormData();
//     for (let i = 0; i < files.length; i++) {
//         formData.append("images", files[i]);
//     }

//     fetch("http://localhost:5003/predict_dr", {
//         method: "POST",
//         body: formData
//     })
//     .then(response => response.json())
//     .then(data => {
//         const drPredictionResult = document.getElementById("drPredictionResult");
//         let reportHTML = `<h3>DR Diagnosis Report</h3>`;

//         data.predictions.forEach(pred => {
//             reportHTML += `
//                 <p><strong>Image:</strong> ${pred.filename}</p>
//                 <p><strong>Result:</strong> ${pred.result}</p>
//                 <p><strong>Confidence:</strong> ${pred.confidence}%</p>
//                 <p><strong>Suggestion:</strong> ${pred.suggestion}</p>
//                 <hr>
//             `;
//         });

//         drPredictionResult.innerHTML = reportHTML;
//     })
//     .catch(error => {
//         console.error("Error during DR prediction:", error);
//     });
// }

// function downloadDrPDF() {
//     // 🔹 Get Patient Details from Form
//     const patientName = document.getElementById("drpatientName").value || "Unknown";
//     const dob = document.getElementById("drpatientDOB").value || "N/A";
//     const phone = document.getElementById("drpatientPhone").value || "N/A";
//     const address = document.getElementById("drpatientAddress").value || "N/A";
//     const nationality = document.getElementById("drpatientNationality").value || "N/A";

//     // 🔹 Calculate Age from DOB
//     let age = "N/A";
//     if (dob !== "N/A") {
//         const birthDate = new Date(dob);
//         const today = new Date();
//         age = today.getFullYear() - birthDate.getFullYear();
//         const monthDiff = today.getMonth() - birthDate.getMonth();
//         if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
//             age--; // Adjust for incomplete year
//         }
//     }

//     // 🔹 Prepare Report Data
//     const reportData = {
//         patient_name: patientName,
//         dob: dob,
//         age: age,
//         phone: phone,
//         address: address,
//         nationality: nationality,
//         date: new Date().toLocaleDateString(),
//         predictions: []
//     };

//     // 🔹 Extract Predictions from UI
//     document.querySelectorAll("#drPredictionResult hr").forEach((_, index) => {
//         const filename = document.querySelectorAll("#drPredictionResult strong")[index * 3].nextSibling.nodeValue.trim();
//         const result = document.querySelectorAll("#drPredictionResult strong")[index * 3 + 1].nextSibling.nodeValue.trim();
//         const confidence = document.querySelectorAll("#drPredictionResult strong")[index * 3 + 2].nextSibling.nodeValue.trim();
//         const suggestion = document.querySelectorAll("#drPredictionResult strong")[index * 3 + 3].nextSibling.nodeValue.trim();

//         reportData.predictions.push({ filename, result, confidence, suggestion });
//     });

//     // 🔹 Send Data to Backend for PDF Generation
//     fetch("http://localhost:5003/generate_dr_pdf", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(reportData)
//     })
//     .then(response => response.blob())
//     .then(blob => {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "diabetic_retinopathy_report.pdf";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//     })
//     .catch(error => {
//         console.error("Error generating DR PDF report:", error);
//     });
// }

let uploadedFiles = [];
let uploadedFileObjects = [];

document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.getElementById("userName").textContent = user.firstName || "User";
    } else {
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }

    const imageInput = document.getElementById("imageInput");
    const previewContainer = document.getElementById("previewContainer");

    imageInput.addEventListener("change", function(event) {
        const files = Array.from(event.target.files);
        
        files.forEach((file) => {
            if (!uploadedFiles.includes(file.name)) {
                uploadedFiles.push(file.name);
                uploadedFileObjects.push(file);
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewDiv = document.createElement("div");
                    previewDiv.classList.add("preview-item");

                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.classList.add("preview-image");

                    const closeIcon = document.createElement("span");
                    closeIcon.innerHTML = "&times;";
                    closeIcon.classList.add("close-icon");
                    closeIcon.onclick = function(event) {
                        event.stopPropagation();
                        previewDiv.remove();
                        uploadedFiles = uploadedFiles.filter(name => name !== file.name);
                        uploadedFileObjects = uploadedFileObjects.filter(f => f.name !== file.name);
                    };

                    previewDiv.appendChild(img);
                    previewDiv.appendChild(closeIcon);
                    previewContainer.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            }
        });
    });
});

document.getElementById("logoutConfirmBtn").addEventListener("click", confirmLogout);

document.addEventListener("click", function (event) {
    const logoutPopup = document.getElementById("logoutPopup");
    if (logoutPopup.style.display === "flex" && !logoutPopup.contains(event.target) && !event.target.classList.contains("logout-btn")) {
        closeLogoutPopup();
    }
});


function showLogoutPopup(event) {
    event?.stopPropagation();  // Prevents click event from affecting other elements
    document.getElementById("logoutPopup").style.display = "flex";
    document.body.classList.add("popup-active"); // Disable other interactions
}


function closeLogoutPopup(event) {
    event?.stopPropagation();
    document.getElementById("logoutPopup").style.display = "none";
    document.body.classList.remove("popup-active"); // Re-enable interactions
}


// Confirm and perform logout
function confirmLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.getElementById("logoutPopup").style.display = "none"; // Hide popup
    window.location.href = "login.html"; // Redirect to login page
}

function submitPrediction() {
    if (uploadedFileObjects.length === 0) {
        alert("Please select at least one image for prediction.");
        return;
    }

    const patientInfo = {
        name: document.getElementById("patientName").value || "Unknown",
        dob: document.getElementById("patientDOB").value || "N/A",
        phone: document.getElementById("patientPhone").value || "N/A",
        address: document.getElementById("patientAddress").value || "N/A"
    };

    const formData = new FormData();
    uploadedFileObjects.forEach(file => {
        formData.append("images", file);
    });

    fetch("http://localhost:5002/predict", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const predictionResult = document.getElementById("predictionResult");
        let reportHTML = `<h3>Diagnosis Report</h3>`;
        data.predictions.forEach(pred => {
            reportHTML += `
                <p><strong>Image:</strong> ${pred.filename}</p>
                <p><strong>Glaucoma Result:</strong> ${pred.glaucoma_result}</p>
                <p><strong>DR Result:</strong> ${pred.dr_result} (${pred.dr_confidence}%)</p>
                <p><strong>Suggestion:</strong> ${pred.glaucoma_suggestion} & ${pred.dr_suggestion}</p>
                <hr>
            `;
        });
        predictionResult.innerHTML = reportHTML;
    })
    .catch(error => console.error("Error during prediction:", error));
}

function downloadPDF() {
    const patientInfo = {
        name: document.getElementById("patientName").value || "Unknown",
        dob: document.getElementById("patientDOB").value || "N/A",
        phone: document.getElementById("patientPhone").value || "N/A",
        address: document.getElementById("patientAddress").value || "N/A"
    };

    const predictions = [];
    document.querySelectorAll("#predictionResult hr").forEach((_, index) => {
        const filename = document.querySelectorAll("#predictionResult strong")[index * 4].nextSibling.nodeValue.trim();
        const glaucomaResult = document.querySelectorAll("#predictionResult strong")[index * 4 + 1].nextSibling.nodeValue.trim();
        const drResult = document.querySelectorAll("#predictionResult strong")[index * 4 + 2].nextSibling.nodeValue.trim();
        const suggestion = document.querySelectorAll("#predictionResult strong")[index * 4 + 3].nextSibling.nodeValue.trim();
        predictions.push({ filename, glaucoma_result: glaucomaResult, dr_result: drResult, dr_confidence: "N/A", glaucoma_suggestion: suggestion, dr_suggestion: suggestion });
    });

    fetch("http://localhost:5002/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_info: patientInfo, predictions })
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
    .catch(error => console.error("Error generating PDF report:", error));
}