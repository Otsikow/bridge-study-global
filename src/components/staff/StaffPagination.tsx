import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface StaffPaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export function StaffPagination({ page, total, pageSize = 25, onChange }: StaffPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const goTo = (value: number) => {
    if (value < 1 || value > totalPages) return;
    onChange(value);
  };

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious onClick={() => goTo(page - 1)} aria-disabled={page <= 1} />
        </PaginationItem>
        {[...Array(totalPages)].map((_, index) => {
          const value = index + 1;
          return (
            <PaginationItem key={value}>
              <PaginationLink isActive={value === page} onClick={() => goTo(value)}>
                {value}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext onClick={() => goTo(page + 1)} aria-disabled={page >= totalPages} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default StaffPagination;
