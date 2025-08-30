// TODO : //  csv and excel download

const express =require('express');
const {Router} =require('express')
const downloadRouter=Router();

const {ExpenseModel} = require('../db')
const {userMiddleware} = require('../middleware/userauth')
const PDFDocument = require('pdfkit-table'); // Assuming you have a package for PDF generation
downloadRouter.use(express.json());


downloadRouter.get("/pdf", async (req, res) => {
  try {
    const expenses = await ExpenseModel.find().lean();

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
    await doc.table(table, { columnsSize: [200, 100, 100,300] });
    doc.end();
    console.log(expenses)

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});
downloadRouter.get("/csv", async (req, res) => {
  try {
    const expenses = await ExpenseModel.find().lean();

    // CSV headers
    const headers = ["Category", "Amount", "Date", "ID"];
    
    // CSV rows
    const rows = expenses.map(exp => [
      exp.category,
      `${exp.amount} ₹`,
      exp.date.toISOString().split("T")[0],
      exp.comment || "No comments"
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","), // Header row
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Set headers so browser downloads it
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.send(csvContent);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating CSV");
  }
});

module.exports={
    downloadRouter: downloadRouter
}