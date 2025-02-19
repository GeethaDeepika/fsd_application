const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/Users");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ email, password: hashedPassword, firstName, lastName });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token, 
            user: { firstName: user.firstName, lastName: user.lastName, email: user.email }
         });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});


/// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString(); 

        // Set code expiry time (e.g., 10 minutes)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Save the user with new reset fields
        await user.save();

        console.log("Reset code:", resetCode);
        console.log("Expiry time:", user.resetPasswordExpires);

        // Send email with reset code
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Code",
            text: `Your password reset code is: ${resetCode}. This code will expire in 10 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ message: "Error sending reset email" });
            }
            res.json({ success: true, message: "Reset code sent to email" });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/verify-reset-code", async (req, res) => {
    const { email, code } = req.body;

    try {
        console.log(`Verifying reset code for email: ${email}, code: ${code}`);
        
        const user = await User.findOne({
            email,
            resetPasswordToken: code, 
            resetPasswordExpires: { $gt: Date.now() }, 
        });

        if (!user) {
            console.log("User not found or invalid/expired code.");
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        console.log("Code verified successfully.");
        res.json({ success: true, message: "Reset code verified" });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: "Server error" });
    }
});



// Reset Password Route
router.post("/reset-password", async (req, res) => {
    const { email, resetCode, newPassword } = req.body;

    try {
        // Find the user by email and check if the reset code is valid and not expired
        const user = await User.findOne({
            email,
            resetPasswordToken: resetCode, // Ensure reset code matches
            resetPasswordExpires: { $gt: Date.now() }, // Ensure token has not expired
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear the reset code fields after successful reset
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: "Password reset successfully!" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
