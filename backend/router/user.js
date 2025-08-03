const {z} =require('zod');
const express =require('express');
const jwt= require('jsonwebtoken');
const mongoose= require('mongoose');
const bcrypt= require('bcrypt') 

const {Router} =require('express')

const {UserModel} = require('../db')

const secretkey =process.env.usersecretkey;

const userRouter=Router();
userRouter.use(express.json());//! important to parse the body of the request


    userRouter.post('/signup',async function (req,res){
        
    const email=req.body.email;
    const password=req.body.password;
    const name=req.body.name;
    
    //input validations
    const requireBody=z.object({
        email:z.string().min(3).max(100).email(),
        password:z.string(),
        name:z.string().min(3).max(50)
    })
    
    const parsedDataWithSuccess=requireBody.safeParse(req.body)
    
    if(!parsedDataWithSuccess.success){
        res.json({
            message:"incorrect input",
            error:parsedDataWithSuccess.error 
        })
        const error=parsedDataWithSuccess.error
        const err = error.issues.map(issue => issue.message);
        console.log(err);
    }
    else{
        const hasedPassword = await bcrypt.hash(password, 5);
        
        await UserModel.create({
            email: email,
            password:hasedPassword,
            name: name
           
        });
        
        res.json({message: "you are signed up"})
    } 
})

    userRouter.post('/signin',async function (req,res){
        const email=req.body.email;
        const password=req.body.password;

        //custom function can also be defined 
        const user =await UserModel.findOne({
            email:email,
        })
        const passwordmatched = bcrypt.compare(password,user.password);

        if (user && passwordmatched) {
            const token = jwt.sign({
                id: user._id.toString()
            }, secretkey);
    
            res.json({
                token
            })
            console.log("user._id"+user._id.toString())

        } else {
            res.status(403).json({
                message: "Incorrect creds"
            })
        }
    })

module.exports={
   userRouter:userRouter
}