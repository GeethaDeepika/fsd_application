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

// New function to submit images for prediction
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
        let outputHTML = "<h3>Prediction Results:</h3>";
        data.predictions.forEach(pred => {
            outputHTML += `<p>${pred.filename}: ${pred.result}</p>`;
        });
        predictionResult.innerHTML = outputHTML;
    })
    .catch(error => {
        console.error("Error during prediction:", error);
    });
}
