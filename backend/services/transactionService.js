// backend/services/transactionService.js
const mongoose = require('mongoose');
const { ExpenseModel } = require('../models/ExpenseModel');
const { IncomeModel } = require('../models/IncomeModel');

const { Types } = mongoose;

function toObjectId(userId) {
  try {
    return new mongoose.Types.ObjectId(userId);
  } catch (e) {
    throw Object.assign(new Error('Invalid id'), { status: 400, details: e.message });
  }
}

async function addExpense(userId, payload) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  const userObjectId = toObjectId(userId);
  const doc = {
    amount: payload.amount,
    category: payload.category,
    comment: payload.comment || payload.category,
    date: payload.date ? new Date(payload.date) : new Date(),
    userId: userObjectId
  };
  const expense = await ExpenseModel.create(doc);
  return expense;
}


async function addIncome(userId, payload) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  userObjectId= toObjectId(userId)
  const doc = {
    amount: payload.amount,
    category: payload.category,
    comment: payload.comment || '',
    date: payload.date ? new Date(payload.date) : new Date(),
    userId: userObjectId
  };
 const income = await IncomeModel.create(doc);
  // return income;
}

async function findCategory(userId, category) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  if (!category) return [];
  const userObjectId = toObjectId(userId);
  return ExpenseModel.find({ userId: userObjectId, category }).lean();
}


async function deleteExpenseById(id) {
  if (!id) throw Object.assign(new Error('Missing id'), { status: 400 });
  const expense = await ExpenseModel.findById(id);
  return ExpenseModel.findByIdAndDelete(id);
}


async function getTransactions(userId, { page = 1, limit = 10 } = {}) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  
  const userObjectId = toObjectId(userId);
  
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const pipeline = [
    { $match: { userId: userObjectId } },
    { $addFields: { type: 'expense' } },
    {
      $unionWith: {
        coll: 'incomes',
        pipeline: [
          { $match: { userId: userObjectId } },
          { $addFields: { type: 'income' } }
        ]
      }
    },
    { $sort: { date: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }]
      }
    }
  ];

  const results = await ExpenseModel.aggregate(pipeline);

  const metadata = results[0]?.metadata?.[0];
  const total = metadata ? metadata.total : 0;
  const transactions = results[0]?.data || [];

  return {
    transactions,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum
  };
}


async function getSummary(userId) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  
  const userObjectId = toObjectId(userId);
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [
    allIncomes,
    allExpenses,
    monthlyIncomes,
    monthlyExpenses
  ] = await Promise.all([
    IncomeModel.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    ExpenseModel.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    IncomeModel.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    ExpenseModel.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const totalIncome = allIncomes[0]?.total || 0;
  const totalExpense = allExpenses[0]?.total || 0;
  const monthlyIncome = monthlyIncomes[0]?.total || 0;
  const monthlyExpensesNum = monthlyExpenses[0]?.total || 0;

  return {
    totalBalance: totalIncome - totalExpense,
    monthlyIncome,
    monthlyExpenses: monthlyExpensesNum
  };
}


async function getCategorySummary(userId) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  const userObjectId = toObjectId(userId);

  const categoryData = await ExpenseModel.aggregate([
    { $match: { userId: userObjectId } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const summary = categoryData.reduce((acc, item) => {
    acc[item._id] = item.total;
    return acc;
  }, {});

  return summary;
}


async function transactionsFiltering(userId, filters = {}) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  const userObjectId = toObjectId(userId);

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.max(1, parseInt(filters.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const matchQuery = { userId: userObjectId };

  if (filters.start && filters.end) {
    matchQuery.date = { $gte: new Date(filters.start), $lte: new Date(filters.end) };
  } else if (filters.start) {
    matchQuery.date = { $gte: new Date(filters.start) };
  } else if (filters.end) {
    matchQuery.date = { $lte: new Date(filters.end) };
  }

  if (filters.category) matchQuery.category = filters.category;
  if (filters.comment) matchQuery.comment = { $regex: filters.comment, $options: 'i' };

  const expensePipeline = [
    { $match: matchQuery },
    { $addFields: { type: 'expense' } }
  ];

  const incomePipeline = [
    { $match: matchQuery },
    { $addFields: { type: 'income' } }
  ];

  let finalPipeline;
  if (filters.type === 'expense') {
    finalPipeline = [...expensePipeline];
  } else if (filters.type === 'income') {
    finalPipeline = [...incomePipeline];
  } else {
    finalPipeline = [
      ...expensePipeline,
      {
        $unionWith: {
          coll: 'incomes',
          pipeline: incomePipeline
        }
      }
    ];
  }

  finalPipeline.push(
    { $sort: { date: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    }
  );

  let results;
  if (filters.type === 'income') {
    results = await IncomeModel.aggregate(finalPipeline);
  } else {
    results = await ExpenseModel.aggregate(finalPipeline);
  }

  const transactions = results[0]?.data || [];
  const total = results[0]?.metadata?.[0]?.total || 0;

  return {
    transactions,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
}

module.exports = {
  addExpense,
  addIncome,
  findCategory,
  deleteExpenseById,
  getTransactions,
  getSummary,
  getCategorySummary,
  transactionsFiltering
};