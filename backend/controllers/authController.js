const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const UserModel=  require("../models/UserModel");

const {createUser,authenticate} = require('../services/authService')


function isvalid(){

}
async function  signup(req,res,next) {
    try{
console.log("hi  from coontroller")
    const { email, password, name } = req.body;
    const user = await createUser({ email, password, name });
    res.status(201).json({ success: true, user });
    }catch(err){
        const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message, details: err.details });
    }
}
async function signin(req,res,next){
    try{
        const { email, password } = req.body;
        const { token, userId } = await authenticate(email, password);
        return res.json({ success: true, token, userId });
    }catch{
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
module.exports={
signup,
signin
}