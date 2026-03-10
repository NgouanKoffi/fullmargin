// src/pages/communaute/private/community-details/hooks/useCommunitySales.js
export function useCommunitySales() {
  return {
    salesLoading: false,
    salesSummary: [],
    salesRows: [],
    salesPage: 1,
    salesHasMore: false,
    salesFilters: {},
    setSalesFilters: () => {},
    refreshSalesAll: () => {},
    loadMoreSales: () => {},
  };
}
