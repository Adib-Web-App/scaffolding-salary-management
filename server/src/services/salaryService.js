export function calculateVolume(length, width, height) {
  return Number(length) * Number(width) * Number(height);
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

export function buildJobCalculations(project, workType, length, width, height, workers) {
  const uniqueWorkers = [...new Set(workers.map((w) => w.trim()).filter(Boolean))];
  if (uniqueWorkers.length === 0) {
    const err = new Error('At least one worker is required');
    err.status = 400;
    throw err;
  }

  const volume = calculateVolume(length, width, height);
  const rate = getRateForWorkType(project, workType);
  const totalSalary = calculateTotalSalary(volume, rate);
  const { individualSalary } = splitSalaryAmongWorkers(totalSalary, uniqueWorkers.length);
  const volumeShare = splitVolumeAmongWorkers(volume, uniqueWorkers.length);

  return {
    volume,
    rate,
    total_salary: totalSalary,
    workers: uniqueWorkers.map((worker_name) => ({
      worker_name,
      individual_salary: individualSalary,
      volume_share: volumeShare,
    })),
  };
}
