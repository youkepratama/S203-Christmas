import ExcelJS from 'exceljs';

export const STUDENT_TEMPLATE_COLUMNS = [
  'nama_siswa',
  'gender',
  'email_siswa',
  'nis',
  'class_group',
  'academic_advisor',
  'academic_year',
  'dormitory',
  'specific_building',
  'dorm_parents',
  'room',
  'bed',
  'supervisor',
];

function cellText(cell) {
  let value = cell.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('text' in value) value = value.text; // rich text
    else if ('result' in value) value = value.result; // formula
    else if (value instanceof Date) value = value.toISOString().slice(0, 10);
    else if ('richText' in value) value = value.richText.map((r) => r.text).join('');
  }
  return String(value).trim();
}

export async function parseStudentWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerMap = {};
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const normalizedHeader = String(cell.value ?? '').trim().toLowerCase();
    if (STUDENT_TEMPLATE_COLUMNS.includes(normalizedHeader)) headerMap[colNumber] = normalizedHeader;
  });

  const rows = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const normalized = Object.fromEntries(STUDENT_TEMPLATE_COLUMNS.map((c) => [c, '']));
    let hasValue = false;
    for (const [colNumber, col] of Object.entries(headerMap)) {
      const value = cellText(row.getCell(Number(colNumber)));
      normalized[col] = value;
      if (value) hasValue = true;
    }
    if (hasValue) rows.push(normalized);
  }
  return rows;
}

const TEMPLATE_EXAMPLE = {
  nama_siswa: 'Angelina Wijaya',
  gender: 'Perempuan',
  email_siswa: 'angelina@student.uphcollege.sch.id',
  nis: '2024001',
  class_group: '11-B',
  academic_advisor: 'Youke P. S. F. Dachi',
  academic_year: '2026/2027',
  dormitory: 'Dormitory Putri',
  specific_building: 'Building B',
  dorm_parents: 'Ibu Sarah',
  room: 'B-201',
  bed: 'Bed 2',
  supervisor: 'Bapak Andre',
};

export async function buildStudentTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Template Siswa');
  sheet.addRow(STUDENT_TEMPLATE_COLUMNS);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(STUDENT_TEMPLATE_COLUMNS.map((c) => TEMPLATE_EXAMPLE[c]));
  // Force the nis column to text format so Excel never drops a leading zero.
  const nisColIndex = STUDENT_TEMPLATE_COLUMNS.indexOf('nis') + 1;
  sheet.getColumn(nisColIndex).numFmt = '@';
  sheet.columns.forEach((col) => {
    col.width = 22;
  });
  return workbook.xlsx.writeBuffer();
}

export async function buildWorkbookFromSheets(sheets) {
  const workbook = new ExcelJS.Workbook();
  for (const { name, rows } of sheets) {
    const sheet = workbook.addWorksheet(name.slice(0, 31));
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      sheet.addRow(columns);
      sheet.getRow(1).font = { bold: true };
      for (const row of rows) sheet.addRow(columns.map((c) => row[c] ?? ''));
      sheet.columns.forEach((col) => {
        col.width = 20;
      });
    }
  }
  return workbook.xlsx.writeBuffer();
}
