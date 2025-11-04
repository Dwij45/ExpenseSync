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
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });

  const userObjectId = toObjectId(userId);
  const expense = await ExpenseModel.find({ userId: userObjectId }).lean();

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

const rows = expense.map(exp => [
  exp.category,
  'Rs. ' + exp.amount,
  exp.date ? exp.date.toISOString().split('T')[0] : '',
  exp.comment || exp.category
]);

  // Return a function that writes the PDF to the provided response stream
  return function streamPdfToResponse(res) {
    const doc = new PDFDocument();
    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.pdf");
    doc.pipe(res);

    const table = {
      title: "Expense Report",
      subtitle: "Generated from MongoDB",
      headers: ["Category", "Amount", "Date", "comments"],
      rows
    };

    // Draw table and finalize PDF
    // pdfkit-table may be synchronous; if it's async, it should return a Promise
    try {
      // if doc.table returns a promise await it
      if (typeof doc.table === 'function') {
        // call table; if it returns a promise we don't block here - stream will flush when doc.end() is called
        doc.table(table, { columnsSize: [200, 100, 100, 300] });
      }
    } catch (e) {
      // In case table drawing fails, end the document and propagate
      doc.end();
      throw e;
    }

    doc.end();
    // Do not return anything; response is streamed
  };
}
async function csvGenerator(userId) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  const userObjectId = toObjectId(userId);
  const expenses = await ExpenseModel.find({ userId: userObjectId }).lean();

  // CSV headers
  const headers = ["Category", "Amount", "Date", "comment"];

  // CSV rows
  const rows = expenses.map(exp => [
    exp.category,
    `${exp.amount} ₹`,
    exp.date ? exp.date.toISOString().split("T")[0] : '',
    exp.comment || ''
  ]);

  // Convert to CSV string
  const csvContent = [
    headers.join(","), // Header row
    ...rows.map(row => row.map(cell => String(cell).replace(/"/g, '""')).join(","))
  ].join("\n");

  // Return a function that will write CSV to response
  return function streamCsvToResponse(res) {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.send(csvContent);
  };
}
module.exports={
    pdfGenerator,
    csvGenerator
}