// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const userRoutes = require('./routes/user');

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// // Connect to MongoDB
// mongoose.connect('mongodb+srv://Deepika:Deepika2004@lms.3uvwm.mongodb.net/Disease?retryWrites=true&w=majority').then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// // Routes
// app.use('/signup', userRoutes);

// // Start the server
// const PORT = 5001;
// app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
