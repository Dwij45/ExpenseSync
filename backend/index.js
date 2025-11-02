const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios')

require('dotenv').config();

const connectDB=require('../backend/config/db.js')

const {authRouter} =require('./router/user')
const {transactionRouter}=require('./router/transaction.js')
const {downloadRouter}=require('./router/download.js')
const {uploadRouter}=require('./router/upload.js')
const {dashboardRouter} = require('./router/dashboard.js')
const {userMiddleware} = require('./middleware/userauth')

const app = express();
app.use(express.json());
const mongoURI = process.env.MONGO_URI;
const cors = require('cors');

app.use(cors({
//   origin: ['http://127.0.0.1:5500', 'http://localhost:3000'], // or whatever your frontend port is
//   credentials: true, // needed if using cookies or Authorization header
//   allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from public directory
// !
app.use(express.static(path.join(__dirname, '../public')));

app.use('/user',authRouter);
app.use('/transaction',transactionRouter)
app.use('/download',downloadRouter);
app.use('/upload',uploadRouter);
app.use('/dashboard',dashboardRouter);

connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));