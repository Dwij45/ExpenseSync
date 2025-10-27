const mongoose = require('mongoose');
const {ExpenseModel}= require('../models/ExpenseModel')
const {IncomeModel}= require('../models/IncomeModel');
const user = require('../router/user');

function matchgroupid(time){

    let groupId;
      if (time === "day") {
        groupId = { day: { $dayOfMonth: "$date" }, month: { $month: "$date" }, year: { $year: "$date" } };
      } else if (time === "month") {
        groupId = { month: { $month: "$date" }, year: { $year: "$date" } };
      } else {
        groupId = { year: { $year: "$date" } };
      }
    return groupId;
}

async function getSummary(groupId,userId){
     if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [ExpenseSummary,IncomeSummary] = await Promise.allSettled([
      ExpenseModel.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: groupId, total: { $sum: "$amount" } } },
        { $project: { _id: 0, time: "$_id", total: 1 } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ]),
      IncomeModel.aggregate([
        { $match: { userId:userObjectId } },
        { $group: { _id: groupId, total: { $sum: "$amount" } } },
        { $project: { _id: 0, time: "$_id", total: 1 } },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
      ])
  ]);

    // Process the results
    const ExpenseSummaryData = ExpenseSummary.status === 'fulfilled' ? ExpenseSummary.value : [];
    const IncomeSummaryData = IncomeSummary.status === 'fulfilled' ? IncomeSummary.value : [];

    return {ExpenseSummaryData,IncomeSummaryData}
}

async function getCategorySummary(userId){

if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });

const userObjectId = new mongoose.Types.ObjectId(userId);

const [expense,income] = await Promise.allSettled([
      ExpenseModel.aggregate([
        { $match:{ userId:userObjectId } },
        { $group:{ _id:"$category", total:{$sum:"$amount" } } },
        { $project:{ _id:0, category:"$_id", total:1 } }
      ]),
      IncomeModel.aggregate([
        { $match:{ userId: userObjectId } },
        { $group:{ _id:"$category", total:{$sum:"$amount" } } },
        { $project:{ _id:0, category:"$_id", total:1 } }
      ])
    ]);
    
    const expenseData = expense.status === 'fulfilled' ? expense.value : [];
    const incomeData = income.status === 'fulfilled' ? income.value : [];

return {expenseData,incomeData}
}

async function getAllInfo(userId){
    if(!userId) throw Object.assign(new Error('Missing userId'),{status:400});
    const userObjectId = new mongoose.Types.ObjectId(userId);

    groupId = { month: { $month: "$date" }, year: { $year: "$date" } };
        let summary=await ExpenseModel.aggregate([
      { $match: { userId: userObjectId} },
      {
        $project: {
          _id: 0,
          day: { $dayOfMonth: "$date" },
          month: { $month: "$date" },
          year: { $year: "$date" },
          category: 1,
          amount: 1
        }
      },
      { $sort: { year: 1, month: 1, day: 1 } }
    ]);
return summary;
}

module.exports={
  getSummary,
  matchgroupid,
  getCategorySummary,
  getAllInfo
}