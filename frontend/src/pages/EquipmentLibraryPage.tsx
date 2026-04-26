import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listLibraryEquipment,
  getATAOptions,
  validateEquipment,
  validateBatch,
  deleteLibraryEquipment,
  updateLibraryEquipment,
  type LibraryEquipment,
  type ATAOption,
} from '@/api/equipment-library';
import { libraryActions } from '@/components/layout/GlobalNav';
import { LibraryFilters } from '@/components/equipment-library/LibraryFilters';
import { TableView } from '@/components/equipment-library/TableView';
import { CardView } from '@/components/equipment-library/CardView';
import { EditDialog } from '@/components/equipment-library/EditDialog';

type StatusTab = 'all' | 'draft' | 'valid';

export function EquipmentLibraryPage() {
  const [items, setItems] = useState<LibraryEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [selectedATAs, setSelectedATAs] = useState<string[]>([]);
  const [ataOptions, setAtaOptions] = useState<ATAOption[]>([]);
  const [attrGroup, setAttrGroup] = useState('identity');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editItem, setEditItem] = useState<LibraryEquipment | null>(null);
  const [editGroup, setEditGroup] = useState<string | undefined>(undefined);

  // Sync with GlobalNav
  useEffect(() => {
    libraryActions.viewMode = viewMode;
    libraryActions.total = total;
    libraryActions.onViewModeChange = (m) => setViewMode(m);
    return () => { libraryActions.onViewModeChange = null; };
  }, [viewMode, total]);

  // Load ATA options once
  useEffect(() => {
    getATAOptions().then(setAtaOptions).catch(() => {});
  }, []);

  // Load equipment list
  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusTab === 'all' ? undefined : statusTab;
      const ataParam = selectedATAs.length > 0 ? selectedATAs.join(',') : undefined;
      const res = await listLibraryEquipment({ ata_chapters: ataParam, library_status: status, limit: 2000 });
      setItems(res.items);
      setTotal(res.total);
      libraryActions.total = res.total;
    } catch (err) {
      console.error('设备库加载失败', err);
    } finally {
      setLoading(false);
    }
  }, [statusTab, selectedATAs]);

  useEffect(() => {
    setSelected(new Set());
    fetchList();
  }, [fetchList]);

  const draftCount = useMemo(() => items.filter(i => i.library_status === 'draft').length, [items]);
  const validCount = useMemo(() => items.filter(i => i.library_status === 'valid').length, [items]);
  const showActions = statusTab !== 'valid';

  const handleConfirmOne = async (id: string) => {
    try { await validateEquipment(id); toast.success('设备已确认入库'); fetchList(); }
    catch { toast.error('确认失败'); }
  };

  const handleEdit = (id: string, group?: string) => {
    const item = items.find(i => i.id === id);
    if (item) { setEditItem(item); setEditGroup(group); }
  };

  const handleSave = async (id: string, data: Record<string, any>) => {
    try {
      await updateLibraryEquipment(id, data);
      toast.success('保存成功');
      setEditItem(null);
      fetchList();
    } catch {
      toast.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该设备吗？')) return;
    try { await deleteLibraryEquipment(id); toast.success('设备已删除'); fetchList(); }
    catch { toast.error('删除失败'); }
  };

  const handleBatchConfirm = async () => {
    if (selected.size === 0) { toast.error('请先选择设备'); return; }
    try {
      const r = await validateBatch(Array.from(selected));
      toast.success(`已确认 ${r.validated_count} 台设备入库`);
      setSelected(new Set());
      fetchList();
    } catch { toast.error('批量确认失败'); }
  };

  const handleSelectAll = () => {
    const draftIds = items.filter(i => i.library_status === 'draft').map(i => i.id);
    setSelected(prev => prev.size === draftIds.length ? new Set() : new Set(draftIds));
  };

  const handleToggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="space-y-2">
      <LibraryFilters
        ataOptions={ataOptions}
        selectedATAs={selectedATAs}
        onATAChange={setSelectedATAs}
        statusTab={statusTab}
        onStatusChange={setStatusTab}
        draftCount={draftCount}
        validCount={validCount}
        selectedCount={selected.size}
        onBatchConfirm={handleBatchConfirm}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === 'table' ? (
        <TableView
          items={items}
          attrGroup={attrGroup}
          onAttrGroupChange={setAttrGroup}
          selected={selected}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onConfirmOne={handleConfirmOne}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showActions={showActions}
        />
      ) : (
        <CardView
          items={items}
          onConfirmOne={handleConfirmOne}
          showActions={showActions}
        />
      )}
      <EditDialog
        equipment={editItem}
        open={editItem !== null}
        onClose={() => { setEditItem(null); setEditGroup(undefined); }}
        onSave={handleSave}
        initialGroup={editGroup}
      />
    </div>
  );
}
