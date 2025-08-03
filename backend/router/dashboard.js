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
        const userId = req.userId; //  userMiddleware sets this

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
  // const inputcateg=req.body.category
  // $
  const inputcateg=req.query.category
    try
    {
      // const cate=req.body.category
      const data = await ExpenseModel.find({
        category:`${inputcateg}`
    })
    const amounts = data.map(item => item.amount);
    data.forEach(exp => {
  console.log(exp._id);  // <---- This is what you need
});
// console.log(data._id)
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

expenseRouter.get('/category-summary',userMiddleware,async (req, res) => {
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
expenseRouter.delete('/delete', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await ExpenseModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.status(200).json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = {
    expenseRouter: expenseRouter,
    amounts:this.amounts
};