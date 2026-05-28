export function calculateVolume(length, width, height) {
  return Number(length) * Number(width) * Number(height);
}

export function normalizeDimensionLines(dimensions = []) {
  return (Array.isArray(dimensions) ? dimensions : [])
    .map((line) => ({
      length: Number(line?.length) || 0,
      width: Number(line?.width) || 0,
      height: Number(line?.height) || 0,
    }))
    .filter((line) => line.length > 0 && line.width > 0 && line.height > 0)
    .map((line) => ({
      ...line,
      volume: calculateVolume(line.length, line.width, line.height),
    }));
}

export function getRateForWorkType(project, workType) {
  return workType === 'Erection' ? Number(project.erection_rate) : Number(project.dismantle_rate);
}

export function calculateTotalSalary(volume, rate) {
  return volume * rate;
}

export function splitSalaryAmongWorkers(totalSalary, workerCount) {
  if (!workerCount || workerCount < 1) {
    const err = new Error('At least one worker is required');
    err.status = 400;
    throw err;
  }
  const individualSalary = totalSalary / workerCount;
  return {
    individualSalary,
    workerCount,
  };
}

export function splitVolumeAmongWorkers(volume, workerCount) {
  if (!workerCount || workerCount < 1) return 0;
  return volume / workerCount;
}

export function buildJobCalculations(project, workType, dimensions, workers) {
  const uniqueWorkers = [...new Set(workers.map((w) => w.trim()).filter(Boolean))];
  if (uniqueWorkers.length === 0) {
    const err = new Error('At least one worker is required');
    err.status = 400;
    throw err;
  }

  const normalizedDimensions = normalizeDimensionLines(dimensions);
  if (normalizedDimensions.length === 0) {
    const err = new Error('At least one valid dimension line is required');
    err.status = 400;
    throw err;
  }

  const volume = normalizedDimensions.reduce((sum, line) => sum + line.volume, 0);
  const rate = getRateForWorkType(project, workType);
  const totalSalary = calculateTotalSalary(volume, rate);
  const { individualSalary } = splitSalaryAmongWorkers(totalSalary, uniqueWorkers.length);
  const volumeShare = splitVolumeAmongWorkers(volume, uniqueWorkers.length);

  return {
    volume,
    rate,
    total_salary: totalSalary,
    dimensions: normalizedDimensions,
    workers: uniqueWorkers.map((worker_name) => ({
      worker_name,
      individual_salary: individualSalary,
      volume_share: volumeShare,
    })),
  };
}
