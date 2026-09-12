import { useCallback, useState } from 'react';

const STORAGE_KEY = 'dailySalarySummaryColumns';

const DEFAULT_COLUMNS = {
  totalSalary: true,
  totalAdvance: true,
  totalHousekeeping: true,
  totalNettSalary: true,
};

function readStoredColumns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COLUMNS };
    const parsed = JSON.parse(raw);
    return {
      totalSalary: parsed.totalSalary !== false,
      totalAdvance: parsed.totalAdvance !== false,
      totalHousekeeping: parsed.totalHousekeeping !== false,
      totalNettSalary: parsed.totalNettSalary !== false,
    };
  } catch {
    return { ...DEFAULT_COLUMNS };
  }
}

function persistColumns(columns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch {
    /* ignore */
  }
}

export function useDailySalarySummaryColumns() {
  const [columns, setColumns] = useState(readStoredColumns);

  const setColumnVisible = useCallback((key, visible) => {
    setColumns((prev) => {
      const next = { ...prev, [key]: visible };
      persistColumns(next);
      return next;
    });
  }, []);

  const showAll = useCallback(() => {
    const next = { ...DEFAULT_COLUMNS };
    persistColumns(next);
    setColumns(next);
  }, []);

  return { columns, setColumnVisible, showAll };
}
