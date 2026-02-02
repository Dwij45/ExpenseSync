const {addIncome,addExpense,findCategory,deleteExpenseById,getTransactions,getSummary,getCategorySummary,transactionsFiltering} = require('../services/transactionService');

async function createExpense(req, res) {
  try {
    const userId = req.userId;
    const payload = req.body || {};
    const doc = await addExpense(userId, payload);
    return res.status(201).json({ message: 'Expense created'});
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function createIncome(req, res) {
  try {
    const userId = req.userId;
    console.log(userId)
    const payload = req.body || {};
    const doc = await addIncome(userId,payload);
    return res.status(201).json({ message: 'Income added sucessfully'});
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function findByCategory(req, res) {
  try {
    const userId = req.userId;
    const category = req.query.category || req.body.category;
    const data = await findCategory(userId, category);
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
    const type=req.query.type
    console.log("id and type is ", id,type)
    if (!id) return res.status(400).json({ message: 'Missing id query parameter' });
    const deleted = await deleteExpenseById(id,type);
    if (!deleted) return res.status(404).json({ message: 'Expense not found' });
    return res.status(200).json({ message: 'Expense deleted', deleted });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function renderTransactions(req, res) {
  try {
    const userId = req.userId;
    const { page, limit } = req.query;
    const data = await getTransactions(userId, { page, limit });
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function Summary(req, res) {
  try {
    const userId = req.userId;
    const data = await getSummary(userId);
    return res.status(200).json(data);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
  }
}

async function CategorySummary(req, res) {
  try {
    const userId = req.userId;
    const data = await getCategorySummary(userId);
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
    const data = await transactionsFiltering(userId, filters);
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
  renderTransactions,
  Summary,
  CategorySummary,
  filterTransactions
};