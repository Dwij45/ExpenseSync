const {createExpense,createIncome,findByCategory,deleteExpenseById,getTransactions,getSummary,getCategorySummary,filterTransactions} = require('../services/transactionService');

async function createExpense(req, res) {
  try {
    const userId = req.userId;
    const payload = req.body || {};
    const doc = await transactionService.createExpense(userId, payload);
    return res.status(201).json({ message: 'Expense created', expense: doc });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function createIncome(req, res) {
  try {
    const userId = req.userId;
    const payload = req.body || {};
    const doc = await transactionService.createIncome(userId, payload);
    return res.status(201).json({ message: 'Income created', income: doc });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function findByCategory(req, res) {
  try {
    const userId = req.userId;
    const category = req.query.category || req.body.category;
    const data = await transactionService.findByCategory(userId, category);
    // returns list of expense docs
    return res.status(200).json({ data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function deleteExpense(req, res) {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ message: 'Missing id query parameter' });
    const deleted = await transactionService.deleteExpenseById(id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    return res.status(200).json({ message: 'Expense deleted', deleted });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function getTransactions(req, res) {
  try {
    const userId = req.userId;
    const { page, limit } = req.query;
    const data = await transactionService.getTransactions(userId, { page, limit });
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function getSummary(req, res) {
  try {
    const userId = req.userId;
    const data = await transactionService.getSummary(userId);
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function getCategorySummary(req, res) {
  try {
    const userId = req.userId;
    const data = await transactionService.getCategorySummary(userId);
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function filterTransactions(req, res) {
  try {
    const userId = req.userId;
    const filters = {
      start: req.query.start,
      end: req.query.end,
      category: req.query.category,
      type: req.query.type,
      comment: req.query.comment,
      page: req.query.page,
      limit: req.query.limit
    };
    const data = await transactionService.filterTransactions(userId, filters);
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

module.exports = {
  createExpense,
  createIncome,
  findByCategory,
  deleteExpense,
  getTransactions,
  getSummary,
  getCategorySummary,
  filterTransactions
};