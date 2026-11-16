export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  return (
    <div className="pagination">
      <label>
        Baris per halaman
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </label>
      <span>
        {total === 0
          ? "0"
          : `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, total)}`}{" "}
        of {total}
      </span>
      <div className="pagination-buttons">
        <button
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Sebelumnya
        </button>
        <span>
          Halaman {safePage} dari {pageCount}
        </span>
        <button
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
