
const { matchgroupid, getSummary,getCategorySummary , getAllInfo} = require('../services/dashService');
const { getCategorySummary2 } = require('../services/dashService');

// GET /charts/time-category-summary
async function timeCategory(req, res) {
    try {
        const getmonth= req.query.getmonth
        const time = req.query.time || 'month';
        const userId = req.userId;
        const groupId = matchgroupid(time);
        const { ExpenseSummaryData, IncomeSummaryData } = await getSummary(groupId, userId,getmonth);
        return res.json({ ExpenseSummaryData, IncomeSummaryData });
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });
    }
}
async function totalSummary(req,res){
try{
    const userId = req.userId;
    const month= req.query.month
    const year= req.query.year
    // const getmonth= req.query.getmonth
    const {ExpenseSummaryData,IncomeSummaryData} = await getCategorySummary(userId,month,year);
    // const {ExpenseSummaryData,IncomeSummaryData} = await getCategorySummary2(userId);
    return res.json({ExpenseSummaryData,IncomeSummaryData});
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