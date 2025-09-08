const express =require('express');
const {Router} =require('express')
const {userMiddleware} = require('../middleware/userauth')

const {ExpenseModel} = require('../db');
const {IncomeModel} = require('../db');

const mongoose = require('mongoose');
const chartRouter=Router();
chartRouter.use(express.json());

// chartRouter.get('/category-summary',userMiddleware,async (req, res) => {
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
// chartRouter.get('/income-category-summary',userMiddleware,async (req, res) => {
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

chartRouter.get('/time-category-summary',userMiddleware,async (req, res) => {
  try {
    const time = req.query.time || 'month'; // default to month if not provided

    let groupId;
      if (time === "day") {
        groupId = { day: { $dayOfMonth: "$date" }, month: { $month: "$date" }, year: { $year: "$date" } };
      } else if (time === "month") {
        groupId = { month: { $month: "$date" }, year: { $year: "$date" } };
      } else {
        groupId = { year: { $year: "$date" } };
      }

      // && day-month-year of income and expense both

const [ExpenseSummary,IncomeSummary] = await Promise.allSettled([
      ExpenseModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
        { $group: { _id: groupId, total: { $sum: "$amount" } } },
        { $project: { _id: 0, time: "$_id", total: 1 } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]),
      IncomeModel.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
        { $group: { _id: groupId, total: { $sum: "$amount" } } },
        { $project: { _id: 0, time: "$_id", total: 1 } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ])
  ]);

    // Process the results
    const ExpenseSummaryData = ExpenseSummary.status === 'fulfilled' ? ExpenseSummary.value : [];
    const IncomeSummaryData = IncomeSummary.status === 'fulfilled' ? IncomeSummary.value : [];

    // res.json({ExpenseSummary,IncomeSummary});
    res.json({ExpenseSummaryData,IncomeSummaryData}); // e.g. [{ category: "Food", total: 4500 }, ...]
    console.log(req.userId);
    console.log(typeof(req.userId));
  } catch (err) {
    res.status(500).json({ message: "Error getting summary" });
  }
});

chartRouter.get('/total-summary',userMiddleware,async (req, res) => {
  
  try{
    const [expense,income] = await Promise.allSettled([
      ExpenseModel.aggregate([
        { $match:{ userId: new mongoose.Types.ObjectId(req.userId) } },
        { $group:{ _id:"$category", total:{$sum:"$amount" } } },
        { $project:{ _id:0, category:"$_id", total:1 } }
      ]),
      IncomeModel.aggregate([
        { $match:{ userId: new mongoose.Types.ObjectId(req.userId) } },
        { $group:{ _id:"$category", total:{$sum:"$amount" } } },
        { $project:{ _id:0, category:"$_id", total:1 } }
      ])
    ]);
    // Process the results
    const expenseData = expense.status === 'fulfilled' ? expense.value : [];
    const incomeData = income.status === 'fulfilled' ? income.value : [];

    res.json({ expenseData, incomeData });
  } catch(err){

          res.status(500).json({ message: "Error getting summary" });
  }
});
module.exports={
  chartRouter
}