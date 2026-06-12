import { useCallback, useState } from 'react';

const STORAGE_KEY = 'dashboard_selected_workers';

function readStoredWorkers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function persistWorkers(workers) {
  try {
    if (workers.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(workers));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useDashboardWorkerFilter() {
  const stored = readStoredWorkers();
  const [selectedWorkers, setSelectedWorkersState] = useState(stored);
  const [appliedWorkers, setAppliedWorkersState] = useState(stored);

  const setSelectedWorkers = useCallback((workers) => {
    const next = Array.isArray(workers) ? workers : [];
    setSelectedWorkersState(next);
  }, []);

  const applySelectedWorkers = useCallback(() => {
    setAppliedWorkersState(selectedWorkers);
    persistWorkers(selectedWorkers);
  }, [selectedWorkers]);

  const clearSelectedWorkers = useCallback(() => {
    setSelectedWorkersState([]);
    setAppliedWorkersState([]);
    persistWorkers([]);
  }, []);

  return {
    selectedWorkers,
    appliedWorkers,
    setSelectedWorkers,
    applySelectedWorkers,
    clearSelectedWorkers,
  };
}
