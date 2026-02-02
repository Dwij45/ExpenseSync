const express =require('express');
const {Router} =require('express')
const downloadRouter=Router();

const {downloadPdf,downloadCsv,downloadExcel} = require('../controllers/fileDownloadController')
const { ExpenseModel } = require('../models/ExpenseModel')
const { userMiddleware } = require('../middleware/userauth')
const PDFDocument = require('pdfkit-table'); // Assuming you have a package for PDF generation
downloadRouter.use(express.json());


downloadRouter.get("/pdf", userMiddleware, downloadPdf);
downloadRouter.get("/csv", userMiddleware, downloadCsv)
downloadRouter.get("/excel", userMiddleware,downloadExcel )

module.exports={
    downloadRouter: downloadRouter
}