const express = require('express')
const xlsx = require('xlsx');
const csv = require('csv-parser')
const fs = require('fs')
const multer  = require('multer')
const {Router} = require('express')


const uploadRouter = Router();
const {userMiddleware} = require('../middleware/userauth')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ 
    storage: storage,
    fileFilter:(req, file, cb) => {
     const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        ];

        const allowedExtensions = ['.xlsx', '.xls','.csv'];
        const fileExtension = path.extname(file.originalname).toLowerCase();

    if ( !allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(fileExtension)) {
        return cb(new Error('Only Excel files (.xlsx, .xls, .csv) are allowed'), false);
        }
    }
});


// const upload = multer({ dest: './uploads/' })
uploadRouter.post('/uploads', upload.single('uploaded_file'), function (req, res) {
  console.log("file uploaded sucessfully")
  console.log(req.file)
  console.log(req.file.path)

  //parsing
  const workbook = xlsx.readFile(req.file.path);        // load Excel file
  const sheetName = workbook.SheetNames[0];             // take first sheet
  
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); 
  
  console.log("Excel Parsed:", data);
  res.json(data);  // send parsed data
  console.log(data.length)
  const headers = Object.keys(data[0]);
  console.log(headers);

});
module.exports = {
    uploadRouter
}