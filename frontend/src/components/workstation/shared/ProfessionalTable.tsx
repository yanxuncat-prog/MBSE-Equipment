import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Pencil, Filter, X, Download, Upload, ChevronRight } from 'lucide-react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Column<T> {
  title: string;
  dataIndex?: string;
  key: string;
  width?: number;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  editable?: boolean | 'select';
  editOptions?: { value: string; label: string }[];
}

interface ProfessionalTableProps<T> {
  columns: Column<T>[];
  dataSource: T[];
  rowKey?: string | ((record: T) => string);
  onRow?: (record: T) => { onClick?: () => void };
  onEdit?: (record: T) => void;
  selectedRowKey?: string;
  /** Max height for the scrollable area. Defaults to none (auto height). Pass a CSS value to constrain. */
  maxHeight?: string;
  className?: string;
  ataField?: string;
  hideATA?: boolean;
  exportConfigId?: string;
  onImportClick?: () => void;
  onPendingChangesUpdate?: (changes: Map<string, Record<string, any>>) => void;
  expandable?: {
    render: (record: T) => React.ReactNode;
  };
}

export function ProfessionalTable<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey = 'id',
  onRow,
  onEdit,
  selectedRowKey,
  maxHeight,
  className,
  ataField = 'ata_chapter',
  hideATA = false,
  exportConfigId,
  onImportClick,
  onPendingChangesUpdate,
  expandable,
}: ProfessionalTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const [searchCol, setSearchCol] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedATA, setSelectedATA] = useState<string>('__all__');
  // Column value filters: key -> set of selected values
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ rowKey: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, any>>>(new Map());
  const editInputRef = useRef<HTMLInputElement>(null);

  const getKey = (record: T) =>
    typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey]);

  // ATA values
  const ataValues = useMemo(() => {
    const set = new Set<string>();
    for (const r of dataSource) {
      const v = r[ataField];
      if (v != null && String(v).trim()) set.add(String(v).trim());
    }
    return Array.from(set).sort();
  }, [dataSource, ataField]);

  // Unique values per column (for filter dropdowns)
  const colUniqueValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const col of columns) {
      if (!col.dataIndex) continue;
      const set = new Set<string>();
      for (const r of dataSource) {
        const v = r[col.dataIndex];
        const s = v == null ? '' : String(v).trim();
        if (s) set.add(s);
      }
      if (set.size > 0 && set.size <= 10) {
        result[col.key] = Array.from(set).sort();
      }
    }
    return result;
  }, [dataSource, columns]);

  // Apply all filters: ATA → column value filters → text search
  const filteredData = useMemo(() => {
    let data = dataSource;

    // ATA filter
    if (selectedATA !== '__all__') {
      data = data.filter(r => String(r[ataField] ?? '').trim() === selectedATA);
    }

    // Column value filters
    for (const [colKey, selectedValues] of Object.entries(colFilters)) {
      if (selectedValues.size === 0) continue;
      const col = columns.find(c => c.key === colKey);
      if (!col?.dataIndex) continue;
      data = data.filter(r => {
        const v = r[col.dataIndex!];
        const s = v == null ? '' : String(v).trim();
        return selectedValues.has(s);
      });
    }

    // Text search
    if (searchCol && searchText.trim()) {
      const col = columns.find(c => c.key === searchCol);
      if (col) {
        const term = searchText.toLowerCase();
        data = data.filter(r => {
          const val = col.dataIndex ? r[col.dataIndex] : '';
          return String(val ?? '').toLowerCase().includes(term);
        });
      }
    }

    return data;
  }, [dataSource, selectedATA, ataField, colFilters, searchCol, searchText, columns]);

  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0) + (onEdit ? 60 : 0) + (expandable ? 30 : 0);

  const activeFilterCount = Object.values(colFilters).filter(s => s.size > 0).length
    + (selectedATA !== '__all__' ? 1 : 0);

  const toggleColFilter = (colKey: string, value: string) => {
    setColFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[colKey] || []);
      set.has(value) ? set.delete(value) : set.add(value);
      next[colKey] = set;
      return next;
    });
  };

  const clearColFilter = (colKey: string) => {
    setColFilters(prev => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  };

  const clearAllFilters = () => {
    setColFilters({});
    setSelectedATA('__all__');
    setSearchCol(null);
    setSearchText('');
  };

  const toggleSearch = (colKey: string) => {
    if (searchCol === colKey) {
      setSearchCol(null);
      setSearchText('');
    } else {
      setSearchCol(colKey);
      setSearchText('');
    }
  };

  // Inline editing handlers
  const handleCellDoubleClick = (rowKey: string, col: Column<T>, currentValue: any) => {
    if (!col.editable) return;
    setEditingCell({ rowKey, colKey: col.key });
    setEditValue(currentValue == null ? '' : String(currentValue));
  };

  const handleCellSave = (rowKey: string, colKey: string) => {
    setPendingChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(rowKey) || {};
      existing[colKey] = editValue;
      next.set(rowKey, existing);
      return next;
    });
    setEditingCell(null);
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const clearAllChanges = () => {
    setPendingChanges(new Map());
  };

  // Notify parent of pending changes
  useEffect(() => {
    onPendingChangesUpdate?.(pendingChanges);
  }, [pendingChanges, onPendingChangesUpdate]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  return (
    <div className={cn("rounded-lg border", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-3 py-1.5">
        {/* ATA filter */}
        {!hideATA && ataValues.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">ATA:</span>
            <Select value={selectedATA} onValueChange={(v) => { if (v) setSelectedATA(v); }}>
              <SelectTrigger size="sm" className="h-6 w-[120px] text-xs">
                <SelectValue>
                  {selectedATA === '__all__' ? '全部' : `ATA-${selectedATA}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部</SelectItem>
                {ataValues.map(ata => (
                  <SelectItem key={ata} value={ata}>ATA-{ata}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1">
            {Object.entries(colFilters).map(([colKey, values]) => {
              if (values.size === 0) return null;
              const col = columns.find(c => c.key === colKey);
              return (
                <Badge key={colKey} variant="secondary" className="h-6 gap-1 px-1.5 text-xs">
                  {col?.title}: {values.size}项
                  <button onClick={() => clearColFilter(colKey)} className="hover:text-foreground">
                    <X className="size-2.5" />
                  </button>
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-muted-foreground" onClick={clearAllFilters}>
              清除全部
            </Button>
          </div>
        )}

        {/* Search */}
        {searchCol && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Search className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {columns.find(c => c.key === searchCol)?.title}:
            </span>
            <Input
              autoFocus
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索..."
              className="h-6 w-[160px] text-xs"
            />
            <button onClick={() => { setSearchCol(null); setSearchText(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Export */}
        {exportConfigId && (
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
            onClick={() => {
              const token = localStorage.getItem('token');
              window.open(`/api/export/equipment?config_id=${exportConfigId}&token=${token}`, '_blank');
            }}>
            <Download className="size-3" />
            导出Excel
          </Button>
        )}

        {/* Import */}
        {onImportClick && (
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
            onClick={onImportClick}>
            <Upload className="size-3" />
            导入
          </Button>
        )}

        {/* Pending changes indicator */}
        {pendingChanges.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">已修改 {pendingChanges.size} 行</Badge>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAllChanges}>撤销全部</Button>
          </div>
        )}

        {/* Count */}
        <span className={cn("text-xs tabular-nums text-muted-foreground", !searchCol && "ml-auto")}>
          {filteredData.length}/{dataSource.length}
        </span>
      </div>

      <ScrollArea style={{ maxHeight }}>
        <div className="overflow-x-auto">
          <Table style={{ minWidth: totalWidth }}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {expandable && <TableHead style={{ width: 30 }} />}
                {onEdit && <TableHead style={{ width: 60 }} />}
                {columns.map(col => {
                  const hasFilter = (colFilters[col.key]?.size || 0) > 0;
                  const uniqueVals = colUniqueValues[col.key];
                  return (
                    <TableHead
                      key={col.key}
                      style={col.width ? { width: col.width } : undefined}
                      className={cn(
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        'group',
                      )}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col.title}
                        {/* Search button */}
                        {col.dataIndex && (
                          <button
                            className={cn(
                              "inline-flex size-4 items-center justify-center rounded opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity",
                              searchCol === col.key && "!opacity-100 text-primary"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleSearch(col.key); }}
                          >
                            <Search className="size-2.5" />
                          </button>
                        )}
                        {/* Column filter button */}
                        {uniqueVals && (
                          <Popover>
                            <PopoverTrigger render={
                              <button
                                className={cn(
                                  "inline-flex size-4 items-center justify-center rounded opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity",
                                  hasFilter && "!opacity-100 text-primary"
                                )}
                              >
                                <Filter className="size-2.5" />
                              </button>
                            } />
                            <PopoverContent className="w-[220px]" side="bottom" align="start">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium">筛选: {col.title}</span>
                                {hasFilter && (
                                  <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => clearColFilter(col.key)}>
                                    清除
                                  </Button>
                                )}
                              </div>
                              <ScrollArea className="max-h-[240px]">
                                <div className="space-y-0.5">
                                  {uniqueVals.map(val => (
                                    <div key={val} className="flex items-center gap-2 py-0.5">
                                      <Checkbox
                                        id={`filter-${col.key}-${val}`}
                                        checked={colFilters[col.key]?.has(val) || false}
                                        onCheckedChange={() => toggleColFilter(col.key, val)}
                                      />
                                      <label htmlFor={`filter-${col.key}-${val}`} className="text-xs cursor-pointer truncate max-w-[160px]">
                                        {val}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        )}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record, rowIndex) => {
                const key = getKey(record);
                const rowProps = onRow?.(record);
                return (
                  <React.Fragment key={key}>
                  <TableRow
                    onClick={rowProps?.onClick}
                    className={cn(
                      "group/row",
                      rowIndex % 2 === 1 && "bg-muted/[0.08]",
                      rowProps?.onClick && "cursor-pointer",
                      selectedRowKey === key && "bg-primary/[0.06] ring-1 ring-inset ring-primary/20",
                      expandable && expandedKeys.has(key) && "bg-primary/[0.05] border-l-[3px] border-l-primary !border-b-0"
                    )}
                  >
                    {expandable && (
                      <TableCell className="px-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleExpand(key); rowProps?.onClick?.(); }}>
                        <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", expandedKeys.has(key) && "rotate-90")} />
                      </TableCell>
                    )}
                    {onEdit && (
                      <TableCell className="px-1">
                        <button
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-primary hover:bg-primary/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                        >
                          <Pencil className="size-3" />
                          <span className="text-xs">编辑</span>
                        </button>
                      </TableCell>
                    )}
                    {columns.map(col => {
                      const isEditing = editingCell?.rowKey === key && editingCell?.colKey === col.key;
                      const rawValue = col.dataIndex ? record[col.dataIndex] : undefined;
                      const hasPendingChange = pendingChanges.has(key) && pendingChanges.get(key)?.[col.key] !== undefined;
                      const displayValue = hasPendingChange ? pendingChanges.get(key)![col.key] : rawValue;

                      return (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                            hasPendingChange && 'border-l-2 border-l-primary bg-primary/5',
                            col.editable && !isEditing && 'cursor-pointer',
                          )}
                          onDoubleClick={() => handleCellDoubleClick(key, col, displayValue)}
                        >
                          {isEditing ? (
                            col.editable === 'select' && col.editOptions ? (
                              <Select
                                value={editValue}
                                onValueChange={(v) => {
                                  if (v == null) return;
                                  setEditValue(v);
                                  // Auto-save on select change
                                  setPendingChanges(prev => {
                                    const next = new Map(prev);
                                    const existing = next.get(key) || {};
                                    existing[col.key] = v;
                                    next.set(key, existing);
                                    return next;
                                  });
                                  setEditingCell(null);
                                }}
                              >
                                <SelectTrigger size="sm" className="h-7 text-xs" autoFocus>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {col.editOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                ref={editInputRef}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleCellSave(key, col.key);
                                  if (e.key === 'Escape') handleCellCancel();
                                }}
                                onBlur={() => handleCellSave(key, col.key)}
                                className="h-7 text-xs"
                                autoFocus
                              />
                            )
                          ) : (
                            col.render
                              ? col.render(displayValue, record, rowIndex)
                              : col.dataIndex ? String(displayValue ?? '') : ''
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {expandable && expandedKeys.has(key) && (
                    <tr>
                      <td colSpan={columns.length + (onEdit ? 1 : 0) + 1} className="p-0 border-b border-l-[3px] border-l-primary">
                        <div className="bg-muted/[0.12]">
                          {expandable.render(record)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + (onEdit ? 1 : 0) + (expandable ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    {activeFilterCount > 0 || searchText ? '无匹配结果' : '暂无数据'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
