const mongoose = require('mongoose');
const ObjectId = Schema.ObjectId;

const UserSchema=new Schema({
    id:ObjectId,
    name:String,
    email:String,
    password:String
})

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;