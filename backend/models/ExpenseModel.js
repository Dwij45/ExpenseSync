const mongoose = require('mongoose');

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
      'Housing', 'Investment', 'Healthcare', 'Other'
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
module.exports = { ExpenseModel };