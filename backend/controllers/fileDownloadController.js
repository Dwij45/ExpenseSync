const { pdfGenerator, csvGenerator, excelGenerator} = require('../services/fileDownloadService');

async function downloadPdf(req, res) {
    try {
        const userId = req.userId;
        const streamPdf = await pdfGenerator(userId);
        // streamPdf is a function that accepts the express response and streams the PDF
        streamPdf(res);
        // streaming will end the response when doc.end() is called in the service
        return;
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });
    }
}

async function downloadCsv(req, res) {
    try {
        const userId = req.userId;
        const streamCsv = await csvGenerator(userId);
        streamCsv(res);
        return;
    } catch (err) {
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });
    }
}

async function downloadExcel(req, res) {
    try{
        const userId = req.userId;
        const streamExcel = await excelGenerator(userId);
        streamExcel(res);
        return;
    }catch(err){
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });

    }
}
module.exports = {
    downloadPdf,
    downloadCsv,
    downloadExcel
};