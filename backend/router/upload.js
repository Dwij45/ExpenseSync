const express = require('express');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Router } = require('express');

const uploadRouter = Router();
const { userMiddleware } = require('../middleware/userauth');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // add timestamp to avoid collisions
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
            return cb(new Error('Only Excel files (.xlsx, .xls, .csv) are allowed'), false);
        }
        cb(null, true);
    }
});

// POST /upload/uploads - parse uploaded spreadsheet and return JSON
uploadRouter.post('/uploads', upload.single('uploaded_file'), function (req, res) {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        console.log('file uploaded successfully');
        console.log(req.file.path);

        // parsing
        const workbook = xlsx.readFile(req.file.path); // load Excel file
        const sheetName = workbook.SheetNames[0]; // take first sheet
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log('Excel Parsed:', data);
        res.json(data); // send parsed data
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error parsing uploaded file', error: err.message });
    }
});

module.exports = {
    uploadRouter
};