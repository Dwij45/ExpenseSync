// backend/services/transactionService.js
const mongoose = require('mongoose');
const { ExpenseModel } = require('../models/ExpenseModel');
const { IncomeModel } = require('../models/IncomeModel');

const { Types } = mongoose;

function toObjectId(id) {
  try {
    return new Types.ObjectId(id);
  } catch (e) {
    throw Object.assign(new Error('Invalid id'), { status: 400, details: e.message });
  }
}

/**
 * Create an expense
 * @param {string} userId
 * @param {{amount:number, category:string, comment?:string, date?:string|Date}} payload
 */
async function createExpense(userId, payload) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  const userObjectId = toObjectId(userId);
  const doc = {
    amount: payload.amount,
    category: payload.category,
    comment: payload.comment || '',
    date: payload.date ? new Date(payload.date) : new Date(),
    userId: userObjectId
  };
  return ExpenseModel.create(doc);
}

/**
 * Create an income entry
 */
async function createIncome(userId, payload) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  const userObjectId = toObjectId(userId);
  const doc = {
    amount: payload.amount,
    category: payload.category,
    comment: payload.comment || '',
    date: payload.date ? new Date(payload.date) : new Date(),
    userId: userObjectId
  };
  return IncomeModel.create(doc);
}

/**
 * Find expenses by category for the user
 */
async function findByCategory(userId, category) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  if (!category) return [];
  const userObjectId = toObjectId(userId);
  return ExpenseModel.find({ userId: userObjectId, category }).lean();
}

/**
 * Delete an expense by id (returns deleted doc or null)
 * Note: dashboard.js delete route expects deletion from ExpenseModel.
 */
async function deleteExpenseById(id) {
  if (!id) throw Object.assign(new Error('Missing id'), { status: 400 });
  return ExpenseModel.findByIdAndDelete(id);
}

/**
 * Get combined transactions (expenses + incomes) with pagination
 * Returns { transactions, total, totalPages, currentPage }
 */
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

/**
 * Compute totals: all-time totals and this-month totals
 */
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

/**
 * Category summary for expenses (convert to object like {Food: 1500, ...})
 */
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

/**
 * Filter transactions with flexible filters and pagination
 * filters: { start, end, category, type, comment, page, limit }
 */
async function filterTransactions(userId, filters = {}) {
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
  createExpense,
  createIncome,
  findByCategory,
  deleteExpenseById,
  getTransactions,
  getSummary,
  getCategorySummary,
  filterTransactions
};