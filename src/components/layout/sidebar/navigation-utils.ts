
export const isNavItemActive = (pathname: string, itemPath: string, exactMatch = false): boolean => {
  if (exactMatch) return pathname === itemPath;
  return pathname.startsWith(itemPath);
};

export const isTenantRouteActive = (pathname: string): boolean => {
  return pathname.startsWith('/tenant');
};
