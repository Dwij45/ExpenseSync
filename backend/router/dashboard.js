const express =require('express');
const {Router} =require('express')
const expenseRouter=Router();

const {ExpenseModel} = require('../db')
const {userMiddleware} = require('../middleware/userauth')

expenseRouter.use(express.json())

expenseRouter.post('/',userMiddleware,async function (req,res) {
    try {
        const amount = req.body.amount;
        const category = req.body.category;
        const comment = req.body.comment;
        const date = req.body.date;
        const userId = req.userId; // Assuming userMiddleware sets this

        const expense = await ExpenseModel.create({
            amount,
            category,
            comment,
            date,
            userId
        });

        res.status(201).json({
            message: "Expense created successfully",
            expense
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating expense",
            error: error.message
        });
    }
})
//! 
expenseRouter.get('/find',userMiddleware,async function(req,res){
    try
    {const data = await ExpenseModel.find({
        category:"Transportation"
    })
    const amounts = data.map(item => item.amount);

    res.json({
      amounts
    });
}catch(error){
res.json({
    message:"nope it dont exist"
})
}
})

// /routes/expenseRouter.js

expenseRouter.get('/category-summary', async (req, res) => {
  try {
    const summary = await ExpenseModel.aggregate([
    //   { $match: { userId: req.userId } }, // filter by user
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: 1
        }
      }
    ]);

    res.json(summary); // e.g. [{ category: "Food", total: 4500 }, ...]
  } catch (err) {
    res.status(500).json({ message: "Error getting summary" });
  }
});

module.exports = {
    expenseRouter: expenseRouter,
    amounts:this.amounts
};