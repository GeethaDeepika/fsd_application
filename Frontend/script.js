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
});
