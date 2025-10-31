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
const {createExpense,createIncome,findByCategory,deleteExpense,renderTransactions,summary,CategorySummary,filterTransactions} = require('../controllers/transactionController');


// expense creation routes
transactionRouter.post('/expense',userMiddleware,createExpense)
transactionRouter.post('/income',userMiddleware,createIncome)
// find expense by category(query param)
transactionRouter.get('/find',userMiddleware,findByCategory)
// ! delete route

transactionRouter.delete('/delete',userMiddleware,deleteExpense);

transactionRouter.get('/get-transactions', userMiddleware,renderTransactions);
// Add this route to your backend router
transactionRouter.get('/summary', userMiddleware,summary)
// Add this route to your backend router
transactionRouter.get('/category-summary', userMiddleware,CategorySummary)
transactionRouter.get('/filter', userMiddleware,filterTransactions)

module.exports = {
    transactionRouter: transactionRouter
    };