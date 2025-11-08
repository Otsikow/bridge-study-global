import { useState, useCallback } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<T> {
  column: T;
  direction: SortDirection;
}

export const useSort = <T>(initialState: SortState<T>) => {
  const [sortState, setSortState] = useState<SortState<T>>(initialState);

  const setSortColumn = useCallback((column: T) => {
    setSortState((prev) => {
      if (prev.column === column) {
        return {
          ...prev,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        column,
        direction: "asc",
      };
    });
  }, []);

  return {
    sortState,
    setSortColumn,
  };
};
