document.addEventListener("DOMContentLoaded", function () {

    // Handle Signup Form
    const signupForm = document.querySelector("#signupForm");

    if (signupForm) {
        const messageBox = document.getElementById("messageBox");
    
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent page reload
    
            // Get form field values
            const email = signupForm.elements["email"].value;
            const password = signupForm.elements["password"].value;
            const confirmPassword = signupForm.elements["retype_password"].value;
            const firstName = signupForm.elements["firstName"].value;
            const lastName = signupForm.elements["lastName"].value;
    
            // Clear previous messages
            messageBox.textContent = "";
            messageBox.style.color = "white";
    
            // Password mismatch check
            if (password !== confirmPassword) {
                messageBox.textContent = "Passwords do not match!";
                messageBox.style.color = "#ffcccc";
                return;
            }
    
            // Prepare data to send
            const formData = { email, password, firstName, lastName };
    
            // Send data to backend
            fetch("http://localhost:5001/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "User registered successfully") {
                    messageBox.textContent = "Registration successful! Redirecting to login...";
                    messageBox.style.color = "#90ee90"; // Light green
                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 2000);
                } else {
                    messageBox.textContent = `${data.message}`;
                    messageBox.style.color = "#ffcccc";
                }
            })
            .catch((error) => {
                console.error("Signup error:", error);
                messageBox.textContent = "fServer error. Please try again.";
                messageBox.style.color = "#ffcccc";
            });
        });
    }
    
    

    // Handle Login Form
    const loginForm = document.querySelector("#loginForm"); 

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault(); 

            const email = loginForm.elements["email"].value;
            const password = loginForm.elements["password"].value;

            const loginData = { email, password };

            fetch("http://localhost:5001/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(loginData),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.token) {
                        localStorage.setItem("token", data.token);
                        alert("Login successful");
                        window.location.href = "/Frontend/prediction.html"; 
                    } else {
                        alert(data.message || "Login failed");
                    }
                })
                .catch((error) => {
                    console.error("Login error:", error);
                    alert("Server error. Please try again later.");
                });
        });
    }

    // Handle Forgot Password Form
    const forgotPasswordForm = document.querySelector("#forgotPasswordForm");

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const email = forgotPasswordForm.elements["email"].value;

            localStorage.setItem("resetEmail", email);

            fetch("http://localhost:5001/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })
                .then((response) => response.json())
                .then((data) => {
                    document.getElementById("messageBox").textContent = data.message;
                    if (data.success) {
                        setTimeout(() => {
                            window.location.href = "verify-reset-code.html"; 
                        }, 2000);
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    document.getElementById("message").textContent = "Error sending reset code.";
                });
        });
    }

    // Handle Verify Reset Code Form (User enters the reset code)
    const verifyResetCodeForm = document.querySelector("#verify-reset-code-form");

    if (verifyResetCodeForm) {
        const messageBox = document.getElementById("messageBox");

        const storedEmail = localStorage.getItem("resetEmail");
        if (storedEmail) {
            document.querySelector("#email").value = storedEmail;
        } else {
            alert("Invalid session. Please restart the password reset process.");
            window.location.href = "forgot.html"; // Redirect back
        }

        verifyResetCodeForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // const email = document.querySelector("#email").value;
            const email = localStorage.getItem("resetEmail");
            const code = document.querySelector("#code").value;

            fetch("http://localhost:5001/api/auth/verify-reset-code", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, code }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        messageBox.textContent = "Code verified successfully! Redirecting...";
                        messageBox.style.color = "#90ee90"; // Light green
                        // sessionStorage.setItem("email", email);
                        // sessionStorage.setItem("resetCode", code);
                        localStorage.setItem("resetCode", code);
                        window.location.href = "reset-password.html"; // Redirect on success
                    } else {
                        messageBox.textContent = data.message || "Invalid code.";
                        messageBox.style.color = "#ffcccc"; // Light red
                    }
                })
                .catch((error) => {
                    console.error("Verification error:", error);
                    messageBox.textContent = "Server error. Please try again later.";
                    messageBox.style.color = "#ffcccc";
                });
        });
    }


    const resetPasswordForm = document.querySelector("#resetPasswordForm");
    if (resetPasswordForm) {
        const messageBox = document.getElementById("messageBox");

        // const email = sessionStorage.getItem("email");
        // const resetCode = sessionStorage.getItem("resetCode");

        const storedEmail = localStorage.getItem("resetEmail");
        const storedResetCode = localStorage.getItem("resetCode");

        // if (!email || !resetCode) {
        //     alert("Invalid session. Please restart the password reset process.");
        //     window.location.href = "forgot.html"; // Redirect back
        //     return;
        // }

        if (storedEmail && storedResetCode) {
            document.querySelector("#email").value = storedEmail;
        } else {
            messageBox.textContent = "Invalid session. Please restart the password reset process";
            window.location.href = "forgot.html"; // Redirect back
        }

        resetPasswordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const newPassword = document.querySelector("#newPassword").value;
            const confirmPassword = document.querySelector("#confirmPassword").value;

            if (newPassword !== confirmPassword) {
                messageBox.textContent = "Passwords donot match. Please try again";
                messageBox.style.color = "#ffcccc";
                return;
            }

            // Send request to backend
            fetch("http://localhost:5001/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: storedEmail, resetCode: storedResetCode, newPassword }),
            })
            .then((response) => response.json())
            .then((data) => {
                messageBox.textContent = data.message;
                if (data.message === "Password reset successfully!") {
                    // sessionStorage.removeItem("email");
                    // sessionStorage.removeItem("resetCode");
                        localStorage.removeItem("resetEmail");
                        localStorage.removeItem("resetCode");
                    window.location.href = "login.html"; // Redirect to login
                }
            })
            .catch((error) => console.error("Reset error:", error));
        });
    }
});
