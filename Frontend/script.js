document.addEventListener("DOMContentLoaded", function () {
    // Handle Signup Form
    const signupForm = document.querySelector("#signupForm"); // Use the ID of your signup form

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent default form submission

            const email = signupForm.elements["email"].value;
            const password = signupForm.elements["password"].value;
            const confirmPassword = signupForm.elements["retype_password"].value; // Corrected name
            const firstName = signupForm.elements["firstName"].value;
            const lastName = signupForm.elements["lastName"].value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            // Send data to the backend
            const formData = { email, password, firstName, lastName };

            fetch("http://localhost:5001/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })
                .then((response) => response.json())
                .then((data) => {
                    alert(data.message);
                    if (data.message === "User registered successfully") {
                        window.location.href = "login.html"; // Redirect on success
                    }
                })
                .catch((error) => console.error("Error:", error));
        });
    }

    // Handle Login Form
    const loginForm = document.querySelector("#loginForm"); // Use the ID of your login form

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent default form submission

            const email = loginForm.elements["email"].value;
            const password = loginForm.elements["password"].value;

            const loginData = { email, password };

            // Send data to backend login route
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
                        // Store the JWT token in localStorage
                        localStorage.setItem("token", data.token);

                        alert("Login successful");
                        window.location.href = "/Frontend/prediction.html"; // Redirect after successful login
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
                    document.getElementById("message").textContent = data.message;
                    if (data.success) {
                        setTimeout(() => {
                            window.location.href = "verify-reset-code.html"; // Redirect to reset code verification page
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
                        alert("Code verified successfully! Redirecting to reset password...");
                        // sessionStorage.setItem("email", email);
                        // sessionStorage.setItem("resetCode", code);
                        localStorage.setItem("resetCode", code);
                        window.location.href = "reset-password.html"; // Redirect on success
                    } else {
                        alert(data.message || "Invalid code.");
                    }
                })
                .catch((error) => {
                    console.error("Verification error:", error);
                    alert("Server error. Please try again later.");
                });
        });
    }


    const resetPasswordForm = document.querySelector("#resetPasswordForm");
    if (resetPasswordForm) {
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
            alert("Invalid session. Please restart the password reset process.");
            window.location.href = "forgot.html"; // Redirect back
        }

        resetPasswordForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const newPassword = document.querySelector("#newPassword").value;
            const confirmPassword = document.querySelector("#confirmPassword").value;

            if (newPassword !== confirmPassword) {
                alert("Passwords do not match!");
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
                alert(data.message);
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
