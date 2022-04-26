const ExcelJs = require('exceljs');

exports.excelWriteAll = async (data, headers, filePath) => {
    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet('Product_Details');
    worksheet.columns = headers;
    
    data.forEach(element => {
        worksheet.addRow(element);
    });
    await workbook.xlsx.writeFile(filePath);
}