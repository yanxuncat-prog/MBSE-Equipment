import React from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Column<T> {
  title: string;
  dataIndex?: string;
  key: string;
  width?: number;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface ProfessionalTableProps<T> {
  columns: Column<T>[];
  dataSource: T[];
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T) => { onClick?: () => void };
  selectedRowKey?: string;
  maxHeight?: string;
  className?: string;
}

export function ProfessionalTable<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey = 'id',
  onRow,
  selectedRowKey,
  maxHeight = 'calc(100vh - 300px)',
  className,
}: ProfessionalTableProps<T>) {
  const getKey = (record: T) =>
    typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey]);

  return (
    <ScrollArea className={cn("rounded-lg border", className)} style={{ maxHeight }}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map(col => (
              <TableHead
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataSource.map((record, rowIndex) => {
            const key = getKey(record);
            const rowProps = onRow?.(record);
            return (
              <TableRow
                key={key}
                onClick={rowProps?.onClick}
                className={cn(
                  rowProps?.onClick && "cursor-pointer",
                  selectedRowKey === key && "bg-primary/5"
                )}
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                  >
                    {col.render
                      ? col.render(col.dataIndex ? record[col.dataIndex] : undefined, record, rowIndex)
                      : col.dataIndex ? String(record[col.dataIndex] ?? '') : ''}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {dataSource.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
