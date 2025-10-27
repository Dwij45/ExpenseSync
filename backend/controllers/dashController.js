
const { matchgroupid, getSummary,getCategorySummary , getAllInfo} = require('../services/dashService');

// GET /charts/time-category-summary
async function timeCategory(req, res) {
    try {
        const time = req.query.time || 'month';
        const userId = req.userId;
        const groupId = matchgroupid(time);
        const { ExpenseSummaryData, IncomeSummaryData } = await getSummary(groupId, userId);
        return res.json({ ExpenseSummaryData, IncomeSummaryData });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });
    }
}
async function totalSummary(req,res){
try{
    const userId = req.userId;
    const {expenseData,incomeData} = await getCategorySummary(userId);
    return res.json({expenseData,incomeData});
}catch(err){
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
}
}
async function allInfo(req,res){
try{
    const userId = req.userId;
    const summary = await getAllInfo(userId);
    return res.json(summary);
}catch(err){
    const status = err.status || 500;
    return res.status(status).json({ message: err.message, details: err.details });
}
}
module.exports={
    timeCategory,
    totalSummary,
    allInfo
}