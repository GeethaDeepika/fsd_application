document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
        document.getElementById("userName").textContent = user.firstName || "User";
    } else {
        window.location.href = "login.html"; // Redirect to login if not authenticated
    }
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
