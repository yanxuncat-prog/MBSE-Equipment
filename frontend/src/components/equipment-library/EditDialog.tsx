import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ATTR_GROUPS } from './column-defs';
import type { LibraryEquipment } from '@/api/equipment-library';

interface Props {
  equipment: LibraryEquipment | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, data: Record<string, any>) => void;
}

// Fields that should not be editable
const READ_ONLY = new Set(['part_number', 'ata_chapter', 'equipment_type']);
// Fields that are boolean type
const BOOL_FIELDS = new Set(['is_electrical', 'is_primary_electrical', 'has_eicd', 'is_metal_shell', 'bracket_delegated_158', 'has_tolerance_drawing']);
// Fields that should use textarea
const TEXT_FIELDS = new Set(['description', 'notes', 'grounding_special_requirements']);

export function EditDialog({ equipment, open, onClose, onSave }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState(ATTR_GROUPS[0].key);

  useEffect(() => {
    if (!equipment || !open) return;
    const f: Record<string, any> = {};
    for (const group of ATTR_GROUPS) {
      for (const col of group.columns) {
        f[col.key] = (equipment as any)[col.key] ?? '';
      }
    }
    // Also include warnings and notes
    f['warnings'] = equipment.warnings ?? '';
    setForm(f);
    setActiveGroup(ATTR_GROUPS[0].key);
  }, [equipment, open]);

  if (!equipment) return null;

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Build update payload — only changed fields
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(form)) {
      if (READ_ONLY.has(key)) continue;
      const original = (equipment as any)[key];
      const newVal = BOOL_FIELDS.has(key)
        ? (value === true || value === 'true' ? true : value === false || value === 'false' ? false : null)
        : (value === '' ? null : value);
      if (newVal !== (original ?? null)) {
        updates[key] = newVal;
      }
    }
    await onSave(equipment.id, updates);
    setSaving(false);
  };

  const group = ATTR_GROUPS.find(g => g.key === activeGroup) || ATTR_GROUPS[0];
  const editableCols = group.columns.filter(c => c.key !== 'part_number' && c.key !== 'name');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            编辑: {equipment.name}
            <span className="text-xs text-muted-foreground ml-2 font-mono">{equipment.part_number}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Group tabs */}
        <div className="flex gap-1 flex-wrap">
          {ATTR_GROUPS.map(g => (
            <button key={g.key} onClick={() => setActiveGroup(g.key)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${activeGroup === g.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >{g.icon} {g.label}</button>
          ))}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {editableCols.map(col => {
            const isReadOnly = READ_ONLY.has(col.key);
            const isBool = BOOL_FIELDS.has(col.key);
            const isText = TEXT_FIELDS.has(col.key);
            const value = form[col.key];

            return (
              <div key={col.key} className={isText ? 'col-span-2' : ''}>
                <Label className="text-xs text-muted-foreground">{col.label}</Label>
                {isBool ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Checkbox
                      checked={value === true || value === 'true'}
                      onCheckedChange={checked => handleChange(col.key, checked)}
                      disabled={isReadOnly}
                    />
                    <span className="text-xs">{value === true || value === 'true' ? '是' : value === false || value === 'false' ? '否' : '未设置'}</span>
                  </div>
                ) : isText ? (
                  <Textarea
                    className="mt-1 text-xs h-16"
                    value={String(value ?? '')}
                    onChange={e => handleChange(col.key, e.target.value)}
                    disabled={isReadOnly}
                  />
                ) : (
                  <Input
                    className="mt-1 h-8 text-xs"
                    value={String(value ?? '')}
                    onChange={e => handleChange(col.key, e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Warnings (always visible) */}
        {form['warnings'] && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <strong>⚠ 警告：</strong>
            <pre className="whitespace-pre-wrap mt-1">{form['warnings']}</pre>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
