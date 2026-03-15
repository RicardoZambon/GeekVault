import * as React from "react"
import { cn } from "@/lib/utils"
import { SkeletonRect } from "./skeleton"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

export interface DataTableColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  sortable?: boolean
  sortKey?: string
  render?: (value: unknown, row: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  onSort?: (key: string, direction: "asc" | "desc") => void
  sortKey?: string
  sortDirection?: "asc" | "desc"
  loading?: boolean
  loadingRows?: number
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

function getCellValue<T>(row: T, accessor: DataTableColumn<T>["accessor"]): unknown {
  if (typeof accessor === "function") {
    return accessor(row)
  }
  return row[accessor]
}

function DataTableInner<T>(
  {
    columns,
    data,
    onSort,
    sortKey,
    sortDirection,
    loading = false,
    loadingRows = 5,
    emptyState,
    onRowClick,
    className,
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return
    /* v8 ignore next 2 */
    const key = column.sortKey ?? (typeof column.accessor === "string" ? column.accessor : "")
    if (!key) return
    const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc"
    onSort(key, newDirection)
  }

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null
    /* v8 ignore next */
    const key = column.sortKey ?? (typeof column.accessor === "string" ? column.accessor : "")
    if (sortKey === key) {
      return sortDirection === "asc" ? (
        <ChevronUp className="ml-1 inline h-4 w-4" />
      ) : (
        <ChevronDown className="ml-1 inline h-4 w-4" />
      )
    }
    return <ChevronsUpDown className="ml-1 inline h-4 w-4 opacity-40" />
  }

  if (!loading && data.length === 0 && emptyState) {
    return (
      <div ref={ref} className={className}>
        {emptyState}
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((col, i) => (
              <th
                key={i}
                className={cn(
                  "px-4 py-3 text-left font-medium text-muted-foreground",
                  col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                  col.className
                )}
                onClick={() => handleSort(col)}
              >
                {col.header}
                {renderSortIcon(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border last:border-0">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={cn("px-4 py-3", col.className)}>
                      <SkeletonRect height={16} width="75%" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors hover:bg-muted/30",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIdx) => {
                    const value = getCellValue(row, col.accessor)
                    return (
                      <td key={colIdx} className={cn("px-4 py-3", col.className)}>
                        {col.render ? col.render(value, row) : (value as React.ReactNode)}
                      </td>
                    )
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

const DataTable = React.forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement | null

export { DataTable }
