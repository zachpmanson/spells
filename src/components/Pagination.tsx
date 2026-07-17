import { Button } from './Button'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
}

export function Pagination({ page, pageSize, total }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (pageCount <= 1) return null

  return (
    <div className="pagination">
      {page > 0 ? (
        <Button size="sm" to="." search={{ page: page - 1 }}>
          Previous
        </Button>
      ) : (
        <Button size="sm" disabled>
          Previous
        </Button>
      )}
      <span>
        Page {page + 1} of {pageCount}
      </span>
      {page < pageCount - 1 ? (
        <Button size="sm" to="." search={{ page: page + 1 }}>
          Next
        </Button>
      ) : (
        <Button size="sm" disabled>
          Next
        </Button>
      )}
    </div>
  )
}
