import { useEffect, useRef, useState } from 'react';

export default function WorkerMultiSelect({
  workers = [],
  selected = [],
  onChange,
  label = 'Workers',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectedSet = new Set(selected);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredWorkers = workers.filter((name) =>
    name.toLowerCase().includes(normalizedSearch)
  );

  const count = selected.length;
  const triggerLabel =
    count === 0 ? 'All Workers' : `${count} worker${count === 1 ? '' : 's'} selected`;

  const toggleWorker = (name) => {
    if (selectedSet.has(name)) {
      onChange(selected.filter((w) => w !== name));
      return;
    }
    onChange([...selected, name]);
  };

  const handleSelectAll = () => {
    const next = new Set(selected);
    for (const name of workers) next.add(name);
    onChange([...next]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="label-field">{label}</label>
      <button
        type="button"
        className="input-field flex w-full items-center justify-between gap-2 text-left"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={`truncate ${count === 0 ? 'text-slate-500' : 'text-slate-900'}`}>
          {triggerLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              type="search"
              className="input-field py-2 text-sm"
              placeholder="Search workers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <button
              type="button"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
              onClick={handleSelectAll}
              disabled={workers.length === 0}
            >
              Select All
            </button>
            <button
              type="button"
              className="text-xs font-medium text-slate-600 hover:text-slate-800"
              onClick={handleClearAll}
              disabled={count === 0}
            >
              Clear All
            </button>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
            {filteredWorkers.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">No workers found</li>
            ) : (
              filteredWorkers.map((name) => {
                const checked = selectedSet.has(name);
                return (
                  <li key={name}>
                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={checked}
                        onChange={() => toggleWorker(name)}
                      />
                      <span className="truncate text-sm text-slate-800">{name}</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
