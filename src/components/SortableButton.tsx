import { ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableButtonProps<T> {
  column: T;
  sortState: {
    column: T;
    direction: "asc" | "desc";
  };
  onClick: (column: T) => void;
  children: React.ReactNode;
}

export function SortableButton<T>({
  column,
  sortState,
  onClick,
  children,
}: SortableButtonProps<T>) {
  const isSorted = sortState.column === column;
  const SortIcon = isSorted
    ? sortState.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;

  return (
    <Button variant="ghost" onClick={() => onClick(column)} className="px-2 py-1 h-auto">
      <span className="mr-2">{children}</span>
      <SortIcon className="h-4 w-4" />
    </Button>
  );
}
