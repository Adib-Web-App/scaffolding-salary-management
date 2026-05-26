import ExcelJS from 'exceljs';

const RM_FORMAT = '"RM"#,##0.00';

const HEADERS = [
  'Date',
  'Worker',
  'Project',
  'Advance Amount (RM)',
  'Remarks',
];

/** Merged vertically per date + project group (1-based). */
const MERGE_COLUMN_INDEXES = [1, 3];

const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

const MERGED_CELL_ALIGNMENT = {
  vertical: 'middle',
  horizontal: 'center',
  wrapText: true,
};

function autoFitColumns(worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = column.header?.length || 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const cellValue = cell.value?.toString?.() || '';
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });
    column.width = Math.min(Math.max(maxLength, 12), 40);
  });
}

function groupKey(advance) {
  const projectKey = advance.project_id ?? advance.project_name ?? '';
  return `${advance.advance_date}::${projectKey}`;
}

/**
 * Group advances by date + project for merged export rows.
 */
export function groupAdvancesForExport(advances) {
  const sorted = [...advances].sort((a, b) => {
    if (a.advance_date !== b.advance_date) {
      return a.advance_date.localeCompare(b.advance_date);
    }
    const pA = a.project_name || '';
    const pB = b.project_name || '';
    if (pA !== pB) return pA.localeCompare(pB);
    return a.worker_name.localeCompare(b.worker_name);
  });

  const groups = [];
  let current = null;

  for (const advance of sorted) {
    const key = groupKey(advance);
    if (!current || current.key !== key) {
      current = { key, rows: [] };
      groups.push(current);
    }
    current.rows.push(advance);
  }

  return groups;
}

function projectLabel(advance) {
  return advance.project_name || '—';
}

function expandGroupToRows(group) {
  return group.rows.map((advance, index) => {
    const isFirst = index === 0;
    return [
      isFirst ? advance.advance_date : '',
      advance.worker_name || '',
      isFirst ? projectLabel(advance) : '',
      Number(advance.amount) || 0,
      advance.remarks || '-',
    ];
  });
}

function applyCellBorder(cell) {
  cell.border = BORDER_STYLE;
}

function mergeGroupCells(sheet, startRow, endRow) {
  if (endRow <= startRow) return;

  for (const col of MERGE_COLUMN_INDEXES) {
    sheet.mergeCells(startRow, col, endRow, col);
    const cell = sheet.getCell(startRow, col);
    cell.alignment = MERGED_CELL_ALIGNMENT;
  }
}

function styleDataRow(row, isFirstInGroup) {
  const amountCell = row.getCell(4);
  if (typeof amountCell.value === 'number') {
    amountCell.numFmt = RM_FORMAT;
  }

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyCellBorder(cell);

    if (MERGE_COLUMN_INDEXES.includes(colNumber)) {
      if (isFirstInGroup) {
        cell.alignment = MERGED_CELL_ALIGNMENT;
      }
    } else {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }
  });
}

/**
 * Export filtered advance records to .xlsx.
 * @param {Array} advances - filtered advance records from API
 */
export async function exportAdvancesToExcel(advances) {
  const groups = groupAdvancesForExport(advances);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'COREBUILD CONSTRUCTION';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Advance Payments', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const headerRow = sheet.addRow(HEADERS);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;
  headerRow.eachCell((cell) => applyCellBorder(cell));

  let rowCount = 0;

  groups.forEach((group) => {
    const groupStartRow = sheet.lastRow.number + 1;
    const rowValues = expandGroupToRows(group);

    rowValues.forEach((values, index) => {
      const row = sheet.addRow(values);
      styleDataRow(row, index === 0);
      rowCount++;
    });

    const groupEndRow = sheet.lastRow.number;
    mergeGroupCells(sheet, groupStartRow, groupEndRow);
  });

  const lastDataRow = sheet.lastRow.number;

  sheet.columns.forEach((col, i) => {
    col.width = Math.max(HEADERS[i]?.length || 10, 12) + 2;
  });
  autoFitColumns(sheet);

  if (rowCount > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: lastDataRow, column: HEADERS.length },
    };
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `advance-payments-${dateStr}.xlsx`;

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

  return { filename, count: rowCount, groupCount: groups.length };
}
