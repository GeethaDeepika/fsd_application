let uploadedFiles = [];
let uploadedFileObjects = [];

document.addEventListener("DOMContentLoaded", function () {
  // ✅ 1. Auth Check
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    window.location.href = "login.html";
    return;
  }

  // ✅ 2. Show Profile Info
  const fullName = user.displayName || user.firstName || "User";
  const initial = fullName.charAt(0).toUpperCase();

  document.getElementById("profileName").textContent = fullName;
  document.getElementById("profileInitial").textContent = initial;

  // ✅ 3. Upload Image Preview
  const imageInput = document.getElementById("imageInput");
  const previewContainer = document.getElementById("previewContainer");

  if (imageInput && previewContainer) {
    imageInput.addEventListener("change", function (event) {
      const files = Array.from(event.target.files);

      files.forEach((file) => {
        if (!uploadedFiles.includes(file.name)) {
          uploadedFiles.push(file.name);
          uploadedFileObjects.push(file);

          const reader = new FileReader();
          reader.onload = function (e) {
            const previewDiv = document.createElement("div");
            previewDiv.classList.add("preview-item");

            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("preview-image");

            const closeIcon = document.createElement("span");
            closeIcon.innerHTML = "&times;";
            closeIcon.classList.add("close-icon");
            closeIcon.onclick = function (event) {
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
  }

  // ✅ 4. Dropdown Hover Logic
  const profileWrapper = document.querySelector(".user-profile-wrapper");
  const dropdown = document.getElementById("profileDropdown");

  if (profileWrapper && dropdown) {
    profileWrapper.addEventListener("mouseenter", () => {
      dropdown.style.display = "flex";
    });
    profileWrapper.addEventListener("mouseleave", () => {
      dropdown.style.display = "none";
    });
    dropdown.addEventListener("mouseenter", () => {
      dropdown.style.display = "flex";
    });
    dropdown.addEventListener("mouseleave", () => {
      dropdown.style.display = "none";
    });
  }

  // ✅ 5. Attach Logout Popup Events
  const logoutBtn = document.querySelector("#profileDropdown button");
  const confirmBtn = document.getElementById("logoutConfirmBtn");

  if (logoutBtn) logoutBtn.addEventListener("click", showLogoutPopup);
  if (confirmBtn) confirmBtn.addEventListener("click", confirmLogout);

  // ✅ 6. Chatbot Events
  const sendButton = document.querySelector(".chatbot-input button");
  const chatInput = document.querySelector(".chatbot-input input");

  if (sendButton && chatInput) {
    sendButton.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") sendMessage();
    });
  }
});

function resetChat() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = `<div class="message bot">Hi! How can I assist you today?</div>`;
}

function showLogoutPopup(event) {
  event?.stopPropagation();
  const popup = document.getElementById("logoutPopup");
  if (popup) {
    popup.style.display = "flex";
    document.body.classList.add("popup-active");
  }
}

function closeLogoutPopup(event) {
  event?.stopPropagation();
  const popup = document.getElementById("logoutPopup");
  if (popup) {
    popup.style.display = "none";
    document.body.classList.remove("popup-active");
  }
}

function confirmLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "home.html";
}

// ✅ Global Click to Close Logout Popup if clicked outside
document.addEventListener("click", function (event) {
  const popup = document.getElementById("logoutPopup");
  if (
    popup &&
    popup.style.display === "flex" &&
    !popup.querySelector(".popup-content").contains(event.target) &&
    !event.target.closest("#profileDropdown")
  ) {
    closeLogoutPopup();
  }
});

function submitPrediction() {
  if (!uploadedFileObjects || uploadedFileObjects.length === 0) {
    showPDFMessage("Please select at least one image for prediction.");
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

      let reportHTML = `
        <h3>Diagnosis Report</h3>
        <table class="prediction-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Glaucoma Result</th>
              <th>DR Result</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.predictions.forEach(pred => {
        reportHTML += `
          <tr>
            <td>${pred.filename}</td>
            <td>${pred.glaucoma_result}</td>
            <td>${pred.dr_result}</td>
          </tr>
        `;
      });

      reportHTML += `
          </tbody>
        </table>
      `;

      predictionResult.innerHTML = reportHTML;
    })
    .catch(error => {
      console.error("Error during prediction:", error);
      showPDFMessage("Prediction failed. Please try again.");
    });
}

function showPDFMessage(message) {
  const msgBox = document.getElementById("pdfMessage");
  msgBox.innerText = message;
  msgBox.style.display = "block";

  setTimeout(() => {
    msgBox.style.display = "none";
  }, 5000); // Hide after 4 seconds
}


const DR_SUGGESTIONS = {
  "No_DR": "No signs of diabetic retinopathy detected.",
  "Mild": "Mild signs of DR detected.",
  "Moderate": "Moderate DR detected. Consult an ophthalmologist.",
  "Severe": "Severe DR detected. Immediate consultation needed.",
  "Proliferate_DR": "Advanced DR detected. Urgent medical attention required!"
};

function downloadPDF() {
  const imageInput = document.getElementById("imageInput");

  if (!imageInput.files || imageInput.files.length === 0) {
    showPDFMessage("Please upload at least one image before downloading the PDF report.");
    return;
  }

  const patientInfo = {
    name: document.getElementById("patientName")?.value || "Unknown",
    dob: document.getElementById("patientDOB")?.value || "N/A",
    gender: document.getElementById("patientGender")?.value || "N/A",
    blood_group: document.getElementById("patientBloodGroup")?.value || "N/A",
    phone: document.getElementById("patientPhone")?.value || "N/A",
    address: document.getElementById("patientAddress")?.value || "N/A",
    emergency_contact: document.getElementById("emergencyContact")?.value || "N/A",
    emergency_phone: document.getElementById("emergencyPhone")?.value || "N/A",
    medical_history: document.getElementById("medicalHistory")?.value || "N/A",
    insurance: document.getElementById("patientInsurance")?.value || "N/A"
  };

  const predictions = [];
  const tableRows = document.querySelectorAll(".prediction-table tbody tr");

  tableRows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const filename = cells[0]?.textContent.trim() || "N/A";
    const glaucomaResult = cells[1]?.textContent.trim() || "N/A";
    const drResult = cells[2]?.textContent.trim() || "N/A";

    const glaucomaSuggestion = glaucomaResult.toLowerCase().includes("positive")
      ? "Glaucoma detected. Seek medical consultation."
      : "Glaucoma is negative. No immediate action";

    const drSuggestion = DR_SUGGESTIONS[drResult] || "DR result unrecognized";

    predictions.push({
      filename,
      glaucoma_result: glaucomaResult,
      dr_result: drResult,
      glaucoma_suggestion: glaucomaSuggestion,
      dr_suggestion: drSuggestion
    });
  });

  fetch("http://localhost:5002/generate_pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patient_info: patientInfo, predictions })
  })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagnosis_report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch(err => {
      console.error("PDF generation failed", err);
      showPDFMessage("Error generating PDF. Please try again.");
    });
}

function appendMessage(text, sender) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const message = document.createElement("div");
    message.classList.add("message", sender);
    message.textContent = text;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const chatInput = document.querySelector(".chat-input input");
    const chatMessages = document.getElementById("chatMessages");

    if (!chatInput || !chatMessages) return;

    const userMessage = chatInput.value.trim();
    if (userMessage === "") return;

    // Show user message
    appendMessage(userMessage, "user");
    chatInput.value = "";

    // Send to backend
    fetch("http://127.0.0.1:5003/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
    })
    .then(response => response.json())
    .then(data => {
        if (data.response) {
            appendMessage(data.response, "bot");
        } else {
            appendMessage("Sorry, I couldn't understand your question.", "bot");
        }
    })
    .catch(() => {
        appendMessage("Error connecting to the chatbot server.", "bot");
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.querySelector(".chat-input input");
    const sendButton = document.querySelector(".chat-input button");

    if (chatInput && sendButton) {
        sendButton.addEventListener("click", sendMessage);
        chatInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") sendMessage();
        });
    }
});

function showChatbot() {
    document.getElementById("chatPanel")?.classList.add("visible");
    document.getElementById("predictionSection")?.classList.add("hidden");
    document.getElementById("chatbotMenu")?.classList.add("active");
    document.getElementById("predictionMenu")?.classList.remove("active");
}

function hideChatbot() {
    document.getElementById("chatPanel")?.classList.remove("visible");
    document.getElementById("chatbotMenu")?.classList.remove("active");
    document.getElementById("predictionSection")?.classList.remove("hidden");
    document.getElementById("predictionMenu")?.classList.add("active");
    
}

function showPrediction() {
    hideChatbot();
}
