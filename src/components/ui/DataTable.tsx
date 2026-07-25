import { type ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Ref/id/date-style cells: monospace, tabular figures, forced LTR. */
  code?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered instead of the table when `rows` is empty. */
  emptyState?: ReactNode;
}

/**
 * Shared compact data table (32px rows via `--row-height`) — header on
 * `--color-surface-2`, hover rows, ref/date columns forced monospace/LTR.
 * One shape for every results table in the console (work rule 4).
 */
export function DataTable<T>({ columns, rows, rowKey, emptyState }: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.code ? styles.codeCell : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={styles.row}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={[column.code ? styles.codeCell : '', column.className ?? '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
