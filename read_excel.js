const fs = require('fs');
const xlsx = require('xlsx');

const filePath = 'd:\\Unique-Estimation Engine\\unique-cranes-erp\\public\\35-5T  x 28 M span AMNS AW-038.xlsx';
const workbook = xlsx.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===\n`);
    console.log(xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]).substring(0, 3000)); // Limit to first 3000 chars
});
