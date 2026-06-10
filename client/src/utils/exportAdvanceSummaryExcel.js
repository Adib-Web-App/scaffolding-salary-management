import ExcelJS from 'exceljs';
import { formatDateColumnLabel, todayYMD } from './dateUtils.js';

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
      const cellValue = cell.value?.toString?.() || '';
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });
    column.width = Math.min(Math.max(maxLength, 12), 28);
  });
}

/**
 * @param {{ dates: string[], rows: Array }} advanceSummary
 */
export async function exportAdvanceSummaryToExcel(advanceSummary) {
  const { dates = [], rows = [], dateFrom, dateTo } = advanceSummary || {};
  const dateLabels = dates.map(formatDateColumnLabel);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'COREBUILD CONSTRUCTION';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Advance Summary', {
    views: [{ state: 'frozen', ySplit: 1, xSplit: 1 }],
  });

  const headers = ['Name', ...dateLabels, 'Total Advance'];

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

  const totalCol = 2 + dates.length;

  for (const row of rows) {
    const values = [
      row.worker_name,
      ...dates.map((day) => {
        const cell = row.daily?.[day];
        if (!cell?.hasActivity) return '';
        return Number(cell.advance) || 0;
      }),
      Number(row.total_advance) || 0,
    ];
    const dataRow = sheet.addRow(values);
    dataRow.eachCell((cell, colNumber) => {
      cell.border = BORDER_STYLE;
      if (colNumber > 1 && typeof cell.value === 'number') {
        cell.numFmt = RM_FORMAT;
      }
      if (colNumber === totalCol) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFBEB' },
        };
        cell.font = { bold: true };
      }
    });
  }

  autoFitColumns(sheet);

  const rangeLabel =
    dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : todayYMD();
  const filename = `advance-summary-${rangeLabel}.xlsx`;

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
