const express =require('express');
const {Router} =require('express')
const expenseRouter=Router();

const {Types} = require('mongoose');
const {ExpenseModel} = require('../models/ExpenseModel')
const {IncomeModel} = require('../models/IncomeModel')

const {userMiddleware} = require('../middleware/userauth')
const PDFDocument = require('pdfkit-table'); // Assuming you have a package for PDF generation
const { all } = require('axios');

expenseRouter.use(express.json())

// expense creation routes
expenseRouter.post('/expense',userMiddleware,async function (req,res) {
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
expenseRouter.post('/income',userMiddleware,async function (req,res) {
  try {
    const amount = req.body.amount;
    const category = req.body.category;
    const comment = req.body.comment;
    const date = req.body.date;
    const userId = req.userId; //  userMiddleware sets this

    const income = await IncomeModel.create({
      amount,
      category,
      comment,  
      date,
      userId
    });

    res.status(201).json({
      message: "Income created successfully",
      income
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating income",
      error: error.message
    });
  }
})

// find expense by category(query param)
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

// ! delete route

expenseRouter.delete('/delete', async (req, res) => {
  // const { id } = req.params;
  const { id } = req.query;
  try {
    const deleted = await ExpenseModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.status(200).json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



expenseRouter.get('/get-transactions', userMiddleware, async (req, res) => {
  try {
    // 1. Get pagination params from the query
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // We must convert req.userId to a MongoDB ObjectId for the $match pipeline
    // If req.userId is already an ObjectId, you can skip this
    // If it's a string, Mongoose 'find' handles it, but 'aggregate' needs it to be explicit.
    const userId = new Types.ObjectId(req.userId); 

    // 2. Build the aggregation pipeline
    const pipeline = [
      // Stage 1: Filter expenses for the current user *first*
      {
        $match: { userId: userId }
      },
      // Stage 2: Add a 'type' field so the frontend knows what it is
      {
        $addFields: { type: 'expense' }
      },
      // Stage 3: Union with the 'incomes' collection
      {
        $unionWith: {
          coll: 'incomes', // The actual name of your incomes collection in MongoDB
          pipeline: [
            // IMPORTANT: Also filter incomes for the user *inside* the union
            { $match: { userId: userId } },
            { $addFields: { type: 'income' } }
          ]
        }
      },
      // Stage 4: Sort the *combined* list by date (newest first)
      {
        $sort: { date: -1 }
      },
      
      // Stage 5: Use $facet to get BOTH the paginated data and the total count
      // This is much more efficient than two separate queries
      {
        $facet: {
          // Branch 1: Get the total count of all documents
          metadata: [
            { $count: 'total' }
          ],
          // Branch 2: Get the paginated data
          data: [
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ];

    // 3. Run the aggregation query on the ExpenseModel
    const results = await ExpenseModel.aggregate(pipeline);

    // 4. Format the results
    const transactions = results[0].data;
    // Get total from metadata, or default to 0 if no transactions exist
    const total = results[0].metadata[0] ? results[0].metadata[0].total : 0; 

    // 5. Send the complete response to the frontend
    res.status(200).json({
      transactions,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {
    console.error('Aggregation error:', err);
    res.status(500).json({ message: 'Error fetching transactions', error: err.message });
  }
  });

// Add this route to your backend router
expenseRouter.get('/summary', userMiddleware, async (req, res) => {
    try {
        const userId = new Types.ObjectId(req.userId);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Calculate total income and expenses (all time)
        const allIncomes = await IncomeModel.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const allExpenses = await ExpenseModel.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalIncome = allIncomes[0]?.total || 0;
        const totalExpense = allExpenses[0]?.total || 0;
        const totalBalance = totalIncome - totalExpense;

        // Calculate monthly income and expenses
        const monthlyIncomes = await IncomeModel.aggregate([
            { $match: { userId: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const monthlyExpenses = await ExpenseModel.aggregate([
            { $match: { userId: userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            totalBalance: totalBalance,
            monthlyIncome: monthlyIncomes[0]?.total || 0,
            monthlyExpenses: monthlyExpenses[0]?.total || 0
        });

    } catch (err) {
        console.error('Summary error:', err);
        res.status(500).json({ message: 'Error fetching summary', error: err.message });
    }
});

// Add this route to your backend router
expenseRouter.get('/category-summary', userMiddleware, async (req, res) => {
    try {
        const userId = new Types.ObjectId(req.userId);

        const categoryData = await ExpenseModel.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        // Convert from [{ _id: 'Food', total: 1500 }, ...] 
        // to { "Food": 1500, ... }
        const summary = categoryData.reduce((acc, item) => {
            acc[item._id] = item.total;
            return acc;
        }, {});

        res.status(200).json(summary);

    } catch (err) {
        console.error('Category summary error:', err);
        res.status(500).json({ message: 'Error fetching category summary', error: err.message });
    }
});

expenseRouter.get('/filter', userMiddleware, async (req, res) => {
    try {
        // 1. Get all params, including pagination
        const { 
            start, end, category, type, comment, 
            page = 1, limit = 10 
        } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);
        const userId = new Types.ObjectId(req.userId);

        // 2. Build the dynamic $match query
        const matchQuery = { userId: userId };

        if (start && end) {
            matchQuery.date = { $gte: new Date(start), $lte: new Date(end) };
        } else if (start) {
            matchQuery.date = { $gte: new Date(start) };
        } else if (end) {
            matchQuery.date = { $lte: new Date(end) };
        }

        if (category) {
            matchQuery.category = category;
        }

        if (comment) {
            matchQuery.comment = { $regex: comment, $options: 'i' };
        }

        // 3. Build the core pipeline
        let expensePipeline = [
            { $match: matchQuery },
            { $addFields: { type: 'expense' } }
        ];

        let incomePipeline = [
            { $match: matchQuery },
            { $addFields: { type: 'income' } }
        ];

        let finalPipeline = [];

        // 4. Decide *which* collections to query based on 'type' filter
        if (type === 'expense') {
            // Only fetch expenses
            finalPipeline = expensePipeline;
        } else if (type === 'income') {
            // Only fetch incomes
            // We need to change the *source* of the aggregation
            finalPipeline = incomePipeline;
        } else {
            // Fetch both
            finalPipeline = [
                ...expensePipeline,
                {
                    $unionWith: {
                        coll: 'incomes', // Your incomes collection name
                        pipeline: incomePipeline
                    }
                }
            ];
        }

        // 5. Add sorting and pagination to the *final* pipeline
        finalPipeline.push(
            { $sort: { date: -1 } },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $skip: skip }, { $limit: limitNum }]
                }
            }
        );

        // 6. Execute the query on the correct model
        let results;
        if (type === 'income') {
            results = await IncomeModel.aggregate(finalPipeline);
        } else {
            // Default to ExpenseModel (handles 'expense' and 'all')
            results = await ExpenseModel.aggregate(finalPipeline);
        }

        // 7. Format and send the response
        const transactions = results[0].data;
        const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;

        res.status(200).json({
            transactions,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: parseInt(page)
        });

    } catch (err) {
        console.error('Filter error:', err);
        res.status(500).json({ message: 'Error filtering transactions', error: err.message });
    }
});


module.exports = {
    expenseRouter: expenseRouter
    };