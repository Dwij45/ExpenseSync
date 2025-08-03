const jwt =require("jsonwebtoken");
const userPassword = process.env.usersecretkey

function userMiddleware(req,res,next){
    const token=req.headers.token;
    
    if (!token) {
        return res.status(401).json({
            message: "No token provided"
        });
    }
    
    try {
        const decoded = jwt.verify(token, userPassword);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({
            message: "Invalid token"
        });
    }
}

module.exports={
    userMiddleware:userMiddleware
}