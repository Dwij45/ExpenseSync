const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema = new Schema({
    id: ObjectId,
    name: {type: String,required:true},
    email: { type: String, required: true , unique: true},
    password: String
})

const UserModel = mongoose.model('User', UserSchema);
module.exports = { UserModel };