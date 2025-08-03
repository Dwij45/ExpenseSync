const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserSchema=new Schema({
    id:ObjectId,
    name:String,
    email:String,
    password:String
})

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Food', 'Transportation', 'Shopping', 'Entertainment',
      'Housing', 'Utilities', 'Healthcare', 'Other'
    ]
  },
  comment: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  }
});

const ExpenseModel = mongoose.model('Expense', ExpenseSchema);
const UserModel=mongoose.model('User',UserSchema)

module.exports={
ExpenseModel,
UserModel
}