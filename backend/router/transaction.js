const express =require('express');
const {Router} =require('express')
const transactionRouter=Router();

const {Types} = require('mongoose');
const {ExpenseModel} = require('../models/ExpenseModel')
const {IncomeModel} = require('../models/IncomeModel')

const {userMiddleware} = require('../middleware/userauth')
const PDFDocument = require('pdfkit-table'); // Assuming you have a package for PDF generation
const { all, get } = require('axios');

transactionRouter.use(express.json())
const {createExpense,createIncome,findByCategory,deleteExpense,renderTransactions,Summary,CategorySummary,filterTransactions} = require('../controllers/transactionController');


// expense creation routes
transactionRouter.post('/expense',userMiddleware,createExpense)
transactionRouter.post('/income',userMiddleware,createIncome)
// find expense by category(query param)
transactionRouter.get('/find',userMiddleware,findByCategory)
// delete route
transactionRouter.delete('/delete',userMiddleware,deleteExpense);
// transaction
transactionRouter.get('/get-transactions', userMiddleware,renderTransactions);
// summary of total income - expense and total balance
transactionRouter.get('/summary', userMiddleware,Summary)
// give grouping of income-expense according to category
transactionRouter.get('/category-summary', userMiddleware,CategorySummary)
//filtering
transactionRouter.get('/filter', userMiddleware,filterTransactions)

module.exports = {
    transactionRouter: transactionRouter
    };