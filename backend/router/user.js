const {z} =require('zod');
const express =require('express');
const jwt= require('jsonwebtoken');
const mongoose= require('mongoose');
const bcrypt= require('bcrypt') 

const {Router} =require('express')

const {UserModel} = require('../models/UserModel')
const  {signup,signin} =require('../controllers/authController')
// const {UserModel} = require('../db')
const secretkey =process.env.usersecretkey;

const authRouter=Router();
authRouter.use(express.json());//! important to parse the body of the request

authRouter.post('/signup',signup)

authRouter.post('/signin',signin)

module.exports={
   authRouter:authRouter
}