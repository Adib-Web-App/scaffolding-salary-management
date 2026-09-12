import ExcelJS from 'exceljs';
import { formatRM } from '../services/api';
import { formatDateColumnLabel, todayYMD } from './dateUtils.js';

export { formatDateColumnLabel };

const RM_FORMAT = '"RM"#,##0.00';

const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

function autoFitColumns(worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const cellValue = cell.value?.richText
        ? cell.value.richText.map((part) => part.text).join('')
        : cell.value?.toString?.() || '';
      const longest = cellValue.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
      maxLength = Math.max(maxLength, longest + 2);
    });
    column.width = Math.min(Math.max(maxLength, 12), 28);
  });
}

function formatDailyExcelCell(cell) {
  if (!cell?.hasActivity) return '';
  const richText = [];
  if (Number(cell.salary) !== 0) {
    richText.push({
      text: formatRM(cell.salary),
      font: { color: { argb: 'FF334155' } },
    });
  }
  for (const amount of cell.advances || []) {
    if (richText.length) richText.push({ text: '\n', font: { color: { argb: 'FFDC2626' }, size: 9 } });
    richText.push({
      text: `(${formatRM(amount)})`,
      font: { color: { argb: 'FFDC2626' }, size: 9 },
    });
  }
  return richText.length ? { richText } : '';
}

/**
 * @param {{ dates: string[], rows: Array }} dailySalarySummary
 */
export async function exportDailySalarySummaryToExcel(dailySalarySummary) {
  const { dates = [], rows = [], dateFrom, dateTo } = dailySalarySummary || {};
  const dateLabels = dates.map(formatDateColumnLabel);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'COREBUILD CONSTRUCTION';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Daily Salary Summary', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }],
  });

  const headers = [
    'Name',
    ...dateLabels,
    'Total Salary',
    'Total Advance',
    'Total Nett Salary',
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.border = BORDER_STYLE;
  });

  const summaryStartCol = 2 + dates.length;

  for (const row of rows) {
    const values = [
      row.worker_name,
      ...dates.map((day) => formatDailyExcelCell(row.daily?.[day])),
      Number(row.total_salary) || 0,
      Number(row.total_advance) || 0,
      Number(row.total_nett) || 0,
    ];
    const dataRow = sheet.addRow(values);
    const lineCount = dates.reduce((max, day) => {
      const cell = row.daily?.[day];
      const salaryLines = Number(cell?.salary) !== 0 ? 1 : 0;
      const advanceLines = cell?.advances?.length || 0;
      return Math.max(max, salaryLines + advanceLines);
    }, 1);
    dataRow.height = Math.max(18, lineCount * 14);
    dataRow.eachCell((cell, colNumber) => {
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'top', horizontal: colNumber === 1 ? 'left' : 'right', wrapText: true };
      if (colNumber > 1 && typeof cell.value === 'number') {
        cell.numFmt = RM_FORMAT;
      }
      if (colNumber >= summaryStartCol) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' },
        };
        cell.font = { bold: true };
      }
    });
  }

  autoFitColumns(sheet);

  const rangeLabel =
    dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : todayYMD();
  const filename = `daily-salary-summary-${rangeLabel}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { filename, count: rows.length };
}
