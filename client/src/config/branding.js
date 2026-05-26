export const BRAND = {
  company: 'COREBUILD CONSTRUCTION',
  app: 'Salary Management System',
  fullTitle: 'COREBUILD CONSTRUCTION - Salary Management System',
  excelCreator: 'COREBUILD CONSTRUCTION',
};

export function documentTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} | ${BRAND.company}`;
  }
  return BRAND.fullTitle;
}
