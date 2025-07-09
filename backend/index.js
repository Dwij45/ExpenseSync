const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

require('dotenv').config();

const {userRouter} =require('./router/user')
const {expenseRouter}=require('./router/dashboard')

const app = express();
const mongoURI = process.env.MONGO_URI;

app.use('/user',userRouter);
app.use('/dashboard',expenseRouter)

async function main(){
 
await mongoose.connect(process.env.MONGO_URI)
    app.listen(3000)
    console.log("listining on port 3000")
}
main();