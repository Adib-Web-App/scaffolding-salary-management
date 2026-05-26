import { BRAND } from '../config/branding';
import BrandIcon from './BrandIcon';

/**
 * @param {'login' | 'sidebar' | 'header' | 'loading'} variant
 * @param {string} [pageTitle] - used with header variant
 */
export default function AppBranding({ variant = 'sidebar', pageTitle }) {
  if (variant === 'login') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 shadow-xl shadow-black/30">
          <BrandIcon className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{BRAND.company}</h1>
        <p className="mt-2 text-base font-medium tracking-wide text-slate-300 sm:text-lg">{BRAND.app}</p>
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-600" />
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-gradient-to-br from-slate-800 to-slate-900 text-amber-500 shadow-sm">
          <BrandIcon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold leading-tight tracking-tight text-slate-900">{BRAND.company}</p>
          <p className="text-[10px] font-medium leading-tight text-slate-500">{BRAND.app}</p>
        </div>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
          {BRAND.company}
        </p>
        <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">{pageTitle}</h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{BRAND.app}</p>
      </div>
    );
  }

  if (variant === 'loading') {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-br from-slate-800 to-slate-900 text-amber-500 shadow-lg">
          <BrandIcon className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <p className="text-lg font-extrabold tracking-tight text-slate-900">{BRAND.company}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{BRAND.app}</p>
      </div>
    );
  }

  return null;
}
