const download = require('../router/download');
const {pdfGenerator,csvGenerator} = require('../services/fileDownloadService');

async function downloadPdf(req,res){
    try{
        const userId = req.userId;
        const pdfFile = await pdfGenerator(userId);
        res.send(pdfFile);
    }catch(err){
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });
    }

}
async function downloadCsv(req,res){
    try{
        const userId = req.userId;
        const csvFile = await csvGenerator(userId);
        res.send(csvFile);
    }catch(err){
        const status = err.status || 500;
        return res.status(status).json({ message: err.message, details: err.details });

    }
}
module.exports={
    downloadPdf,
    downloadCsv
}