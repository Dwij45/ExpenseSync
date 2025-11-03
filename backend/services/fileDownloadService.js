const { ExpenseModel } = require("../models/ExpenseModel");
const PDFDocument = require('pdfkit-table'); 
const mongoose = require('mongoose');

function toObjectId(userId) {
  try {
    return new mongoose.Types.ObjectId(userId);
  } catch (e) {
    throw Object.assign(new Error('Invalid id'), { status: 400, details: e.message });
  }
}

async function pdfGenerator(userId){
if(!userId) throw Object.assign(new Error('Missing userId'),{status:400});

const userObjectId = toObjectId(userId);
const expense = await ExpenseModel.find({userId:userObjectId}).lean()

// Convert MongoDB docs into table rows
    const rows = expenses.map(exp => [
      exp.category,
      `${exp.amount} ₹`,
      exp.date.toISOString().split("T")[0],
      exp.comment || "No comments"
    ]);

    // PDF setup
        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=expenses.pdf");
        doc.pipe(res);  //Instead of saving it to disk, you’re sending it directly to the browser.
    
    // Table data
        const table = {
          title: "Expense Report",
          subtitle: "Generated from MongoDB",
          headers: ["Category", "Amount", "Date","comments"],
          rows
        };
    // Draw table
        const pdf = await doc.table(table, { columnsSize: [200, 100, 100,300] });
        doc.end();
        return pdf;
}
async function csvGenerator(userId) {
    if(!userId) throw Object.assign(new Error('Missing userId'),{status:400});
    const userObjectId = toObjectId(userId);
     // CSV headers
    const headers = ["Category", "Amount", "Date", "comment"];
    
    // CSV rows
    const rows = expenses.map(exp => [
      exp.category,
      `${exp.amount} ₹`,
      exp.date.toISOString().split("T")[0],
      exp.comment || exp.category
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","), // Header row
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Set headers so browser downloads it
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    return csvContent;
   
}
module.exports={
    pdfGenerator,
    csvGenerator
}