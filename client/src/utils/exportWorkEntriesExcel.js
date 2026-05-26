import ExcelJS from 'exceljs';

const RM_FORMAT = '"RM"#,##0.00';
const NUMBER_FORMAT = '#,##0.00';

const HEADERS = [
  'Date',
  'Project',
  'Location',
  'Work Type',
  'Worker',
  'Length',
  'Width',
  'Height',
  'Total Volume',
  'Rate (RM)',
  'Total Salary (RM)',
  'Salary Per Worker (RM)',
  'Remarks',
];

/** Column indexes merged vertically per job (1-based). Excludes Worker and Salary Per Worker. */
const MERGE_COLUMN_INDEXES = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13];

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

/**
 * Group API results into one record per work job (by id).
 */
export function normalizeJobsForExport(jobs) {
  const byId = new Map();

  for (const item of jobs) {
    const id = item.id;
    if (id == null) continue;

    if (!byId.has(id)) {
      byId.set(id, {
        id,
        entry_date: item.entry_date,
        project_name: item.project_name,
        location: item.location || '',
        work_type: item.work_type,
        length: item.length,
        width: item.width,
        height: item.height,
        volume: item.volume,
        rate: item.rate,
        total_salary: item.total_salary,
        remarks: item.remarks || '',
        workers: [],
      });
    }

    const job = byId.get(id);
    mergeJobFields(job, item);
    collectWorkers(job, item);
  }

  return Array.from(byId.values());
}

function mergeJobFields(target, source) {
  const fields = [
    'entry_date',
    'project_name',
    'location',
    'work_type',
    'length',
    'width',
    'height',
    'volume',
    'rate',
    'total_salary',
    'remarks',
  ];
  for (const key of fields) {
    const val = source[key];
    if (val !== undefined && val !== null && val !== '') {
      target[key] = val;
    }
  }
}

function collectWorkers(job, item) {
  if (Array.isArray(item.workers)) {
    for (const w of item.workers) {
      const name = typeof w === 'string' ? w : w?.worker_name;
      if (!name) continue;
      const existing = job.workers.find((x) => x.worker_name === name);
      if (!existing) {
        job.workers.push({
          worker_name: name,
          individual_salary: w?.individual_salary ?? null,
        });
      } else if (w?.individual_salary != null) {
        existing.individual_salary = w.individual_salary;
      }
    }
  }
  if (item.worker_name) {
    const existing = job.workers.find((x) => x.worker_name === item.worker_name);
    if (!existing) {
      job.workers.push({
        worker_name: item.worker_name,
        individual_salary: item.individual_salary ?? null,
      });
    }
  }
}

/**
 * One row per worker; shared job values only on the first row (merged vertically).
 */
function expandJobToWorkerRows(job) {
  const workers = job.workers?.length
    ? job.workers
    : [{ worker_name: '', individual_salary: 0 }];

  const defaultPerWorker =
    workers[0]?.individual_salary ??
    (workers.length ? Number(job.total_salary) / workers.length : 0);

  return workers.map((worker, index) => {
    const isFirst = index === 0;
    const salaryPerWorker = Number(
      worker.individual_salary ?? defaultPerWorker ?? 0
    );

    return [
      isFirst ? job.entry_date : '',
      isFirst ? job.project_name : '',
      isFirst ? job.location || '' : '',
      isFirst ? job.work_type : '',
      worker.worker_name || '',
      isFirst ? Number(job.length) || 0 : '',
      isFirst ? Number(job.width) || 0 : '',
      isFirst ? Number(job.height) || 0 : '',
      isFirst ? Number(job.volume) || 0 : '',
      isFirst ? Number(job.rate) || 0 : '',
      isFirst ? Number(job.total_salary) || 0 : '',
      salaryPerWorker,
      isFirst ? job.remarks || '-' : '',
    ];
  });
}

function applyRowFormats(row) {
  const formatIfNumber = (colIndex, fmt) => {
    const cell = row.getCell(colIndex);
    if (typeof cell.value === 'number') {
      cell.numFmt = fmt;
    }
  };

  formatIfNumber(6, NUMBER_FORMAT);
  formatIfNumber(7, NUMBER_FORMAT);
  formatIfNumber(8, NUMBER_FORMAT);
  formatIfNumber(9, NUMBER_FORMAT);
  formatIfNumber(10, RM_FORMAT);
  formatIfNumber(11, RM_FORMAT);
  formatIfNumber(12, RM_FORMAT);
}

function applyCellBorder(cell) {
  cell.border = BORDER_STYLE;
}

function mergeJobRowCells(sheet, startRow, endRow) {
  if (endRow <= startRow) return;

  for (const col of MERGE_COLUMN_INDEXES) {
    sheet.mergeCells(startRow, col, endRow, col);
    const cell = sheet.getCell(startRow, col);
    cell.alignment = MERGED_CELL_ALIGNMENT;
  }
}

function styleDataRow(row, isFirstRowOfJob) {
  applyRowFormats(row);

  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    applyCellBorder(cell);

    if (MERGE_COLUMN_INDEXES.includes(colNumber)) {
      if (isFirstRowOfJob) {
        cell.alignment = MERGED_CELL_ALIGNMENT;
      }
    } else if (colNumber === 5 || colNumber === 12) {
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
  });
}

/**
 * Export filtered daily work jobs to .xlsx — one row per worker, merged shared cells.
 * @param {Array} jobs - work job records from API (current filters applied)
 */
export async function exportWorkEntriesToExcel(jobs) {
  const normalized = normalizeJobsForExport(jobs);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'COREBUILD CONSTRUCTION';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Daily Work Entry', {
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

  const sorted = [...normalized].sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date.localeCompare(b.entry_date);
    return (a.id || 0) - (b.id || 0);
  });

  let rowCount = 0;

  sorted.forEach((job) => {
    const workerRows = expandJobToWorkerRows(job);
    const jobStartRow = sheet.lastRow.number + 1;

    workerRows.forEach((values, index) => {
      const row = sheet.addRow(values);
      styleDataRow(row, index === 0);
      rowCount++;
    });

    const jobEndRow = sheet.lastRow.number;
    mergeJobRowCells(sheet, jobStartRow, jobEndRow);
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
  const filename = `daily-work-entry-${dateStr}.xlsx`;

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

  return { filename, count: rowCount, jobCount: sorted.length };
}
