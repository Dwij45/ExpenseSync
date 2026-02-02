const { ExpenseModel} = require("../models/ExpenseModel");
const { IncomeModel } = require("../models/IncomeModel");
const PDFDocument = require('pdfkit-table'); 
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

function toObjectId(userId) {
  try {
    return new mongoose.Types.ObjectId(userId);
  } catch (e) {
    throw Object.assign(new Error('Invalid id'), { status: 400, details: e.message });
  }
}

async function pdfGenerator(userId) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });

  const userObjectId = toObjectId(userId);

  // 1. Fetch both Income and Expenses in parallel
  const [expenses, incomes] = await Promise.all([
    ExpenseModel.find({ userId: userObjectId }).lean(),
    IncomeModel.find({ userId: userObjectId }).lean()
  ]);

  // 2. Format Data for Tables
  const formatDate = (date) => date ? date.toISOString().split('T')[0] : '';
  
  // Expenses Rows
  const expenseRows = expenses.map(exp => [
    exp.category,
    `Rs. ${exp.amount}`,
    formatDate(exp.date),
    exp.comment || exp.description || ''
  ]);

  // Income Rows
  const incomeRows = incomes.map(inc => [
    inc.category, // or 'source' if your model uses that
    `Rs. ${inc.amount}`,
    formatDate(inc.date),
    inc.comment || inc.description || ''
  ]);

  // 3. Calculate Totals for the Summary Header
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Return the streaming function
  return async function streamPdfToResponse(res) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Set HTTP Headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=financial_report.pdf");
    doc.pipe(res);

    // ===========================
    // SECTION 1: FINANCIAL SUMMARY
    // ===========================
    doc.fontSize(20).text("Financial Report", { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Draw a Summary Box
    doc.fontSize(12);
    doc.text(`Total Income:   Rs. ${totalIncome}`, { align: 'left' });
    doc.text(`Total Expenses: Rs. ${totalExpense}`, { align: 'left' });
    doc.moveDown(0.5);
    
    // Color code the Net Balance
    const balanceColor = netBalance >= 0 ? 'green' : 'red';
    doc.fillColor(balanceColor).fontSize(14).text(`Net Balance:    Rs. ${netBalance}`, { align: 'left' });
    doc.fillColor('black'); // Reset color
    doc.moveDown(2);

    // ===========================
    // SECTION 2: INCOME TABLE
    // ===========================
    const tableIncome = {
      title: "Income Details",
      subtitle: "Breakdown of all earnings",
      headers: ["Source", "Amount", "Date", "Comments"],
      rows: incomeRows
    };

    try {
      await doc.table(tableIncome, { 
        columnsSize: [150, 100, 100, 200],
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#2ecc71"), // Green Header for Income
        prepareRow: (row, indexColumn, indexRow, rect, rowData) => {
          doc.font("Helvetica").fontSize(10).fillColor("black");
          // Optional: Add alternate row shading here if desired
        }
      });
    } catch (e) {
      console.error("Error generating income table", e);
    }

    doc.moveDown(2); // Add space between tables

    // ===========================
    // SECTION 3: EXPENSE TABLE
    // ===========================
    const tableExpense = {
      title: "Expense Details",
      subtitle: "Breakdown of all spending",
      headers: ["Category", "Amount", "Date", "Comments"],
      rows: expenseRows
    };

    try {
      await doc.table(tableExpense, { 
        columnsSize: [150, 100, 100, 200],
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor("#e74c3c"), // Red Header for Expense
        prepareRow: (row, indexColumn, indexRow, rect, rowData) => {
          doc.font("Helvetica").fontSize(10).fillColor("black");
        }
      });
    } catch (e) {
      console.error("Error generating expense table", e);
    }

    doc.end();
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

async function excelGenerator(userId) {
  if (!userId) throw Object.assign(new Error('Missing userId'), { status: 400 });
  
  const userObjectId = toObjectId(userId);

  // 1. Fetch BOTH Expenses and Income in parallel
  const [expenses, incomes] = await Promise.all([
    ExpenseModel.find({ userId: userObjectId }).lean(),
    IncomeModel.find({ userId: userObjectId }).lean()
  ]);

  return async function streamExcelToResponse(res) {
    const workbook = new ExcelJS.Workbook();

    // =========================================
    // SHEET 1: EXPENSES
    // =========================================
    const expenseSheet = workbook.addWorksheet('Expenses');
    expenseSheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Comment', key: 'comment', width: 30 }
    ];
    expenseSheet.getRow(1).font = { bold: true }; // Bold Header

    if (expenses.length > 0) {
      expenses.forEach(exp => {
        expenseSheet.addRow({
          category: exp.category || 'Uncategorized',
          amount: exp.amount,
          date: exp.date ? exp.date.toISOString().split('T')[0] : '',
          comment: exp.comment || exp.description || ''
        });
      });
    } else {
      expenseSheet.addRow({ category: 'No expenses recorded', amount: 0 });
    }

    // =========================================
    // SHEET 2: INCOME
    // =========================================
    const incomeSheet = workbook.addWorksheet('Income');
    incomeSheet.columns = [
      { header: 'Source', key: 'category', width: 20 }, // 'Category' usually holds source like 'Salary'
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Comment', key: 'comment', width: 30 }
    ];
    
    // Style header row for Income sheet (Green text to distinguish)
    incomeSheet.getRow(1).font = { bold: true, color: { argb: 'FF2E7D32' } }; 

    if (incomes.length > 0) {
      incomes.forEach(inc => {
        incomeSheet.addRow({
          category: inc.category || 'Uncategorized',
          amount: inc.amount,
          date: inc.date ? inc.date.toISOString().split('T')[0] : '',
          comment: inc.comment || inc.description || ''
        });
      });
    } else {
      incomeSheet.addRow({ category: 'No income recorded', amount: 0 });
    }

    // =========================================
    // FINALIZE
    // =========================================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=financial_report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  };
}

module.exports={
    pdfGenerator,
    csvGenerator,
    excelGenerator
}