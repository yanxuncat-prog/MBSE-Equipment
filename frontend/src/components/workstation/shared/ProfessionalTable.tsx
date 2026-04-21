import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Equipment } from '../../../types';

interface Props {
  columns: ColumnsType<Equipment>;
  data: Equipment[];
  scrollX?: number;
  onRowClick?: (equip: Equipment) => void;
  rowClassName?: (record: Equipment) => string;
}

export function ProfessionalTable({ columns, data, scrollX = 1600, onRowClick, rowClassName }: Props) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ x: scrollX, y: 'calc(100vh - 340px)' }}
      rowClassName={rowClassName}
      onRow={onRowClick ? (record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } }) : undefined}
    />
  );
}
