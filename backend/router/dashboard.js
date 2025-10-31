const express =require('express');
const {Router} =require('express')
const {userMiddleware} = require('../middleware/userauth')

const {ExpenseModel} = require('../models/ExpenseModel');
const {IncomeModel} = require('../models/IncomeModel');

const mongoose = require('mongoose');
const { da } = require('zod/locales');
const dashboard = require('./transaction');
const dashboardRouter=Router();
dashboardRouter.use(express.json());

const {timeCategory,totalSummary,allInfo}= require('../controllers/dashController')


// dashboardRouter.get('/category-summary',userMiddleware,async (req, res) => {
//   try {
//     let summary = await ExpenseModel.aggregate([
//       { $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, // filter by user
//       {
//         $group: {
//           _id: "$category",
//           // amount: "$amount",
//           total: { $sum: "$amount" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           category: "$_id",
//           total: 1
//         }
//       }
//     ]);

//     res.json(summary); // e.g. [{ category: "Food", total: 4500 }, ...]
//     console.log(req.userId);
//     console.log(typeof(req.userId));
//   } catch (err) {
//     res.status(500).json({ message: "Error getting summary" });
//   }
// });
// dashboardRouter.get('/income-category-summary',userMiddleware,async (req, res) => {
//   try {
//     let summary = await IncomeModel.aggregate([
//       { $match: { userId: new mongoose.Types.ObjectId(req.userId) } }, // filter by user
//       {
//         $group: {
//           _id: "$category",
//           total: { $sum: "$amount" }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           category: "$_id",
//           total: 1
//         }
//       }
//     ]);

//     res.json(summary); // e.g. [{ category: "Food", total: 4500 }, ...]
//     console.log(req.userId);
//     console.log(typeof(req.userId));
//   } catch (err) {
//     res.status(500).json({ message: "Error getting summary" });
//   }
//   const docs = await IncomeModel.find({ userId: req.userId });
// console.log("Matched incomes:", docs);

// });

// && time and total amount

dashboardRouter.get('/time-category-summary',userMiddleware,timeCategory)

dashboardRouter.get('/total-summary',userMiddleware,totalSummary)

dashboardRouter.get('/all-info',userMiddleware,allInfo)


module.exports={
  dashboardRouter
}