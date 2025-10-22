const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
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
      'Salary', 'Business', 'Investment', 'Gift','Other'
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

const IncomeModel=mongoose.model('Income',IncomeSchema);
module.exports = IncomeModel;