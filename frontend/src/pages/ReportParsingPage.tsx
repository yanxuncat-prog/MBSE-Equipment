import { useState, useEffect, useRef } from 'react';
import { FileSearch, Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/store/configStore';
import { toast } from 'sonner';
import { listEquipment } from '@/api/equipment';
import {
  uploadAndParse,
  applyParsedFields,
  type ParsedField,
} from '@/api/report-parsing';
import type { Equipment } from '@/types';

const FIELD_LABELS: Record<string, string> = {
  part_number: '件号',
  name: '设备名称',
  mass_kg: '重量 (kg)',
  ata_chapter: 'ATA 章节',
  dimensions_mm: '尺寸 (mm)',
  voltage_range: '工作电压',
  power_watts: '用电功率',
  dal: 'DAL 等级',
};

export function ReportParsingPage() {
  const { activeConfigId } = useConfigStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([]);
  const [rawPreview, setRawPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [applying, setApplying] = useState(false);

  // Load equipment list
  useEffect(() => {
    if (!activeConfigId) return;
    listEquipment({ config_id: activeConfigId, limit: 2000 })
      .then(res => {
        setEquipment(res.items as Equipment[]);
        if (res.items.length > 0) setSelectedEquipId((res.items[0] as Equipment).id);
      })
      .catch(() => setEquipment([]));
  }, [activeConfigId]);

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'pdf') {
      toast.error('仅支持 .docx 和 .pdf 文件');
      return;
    }
    setParsing(true);
    setParsedFields([]);
    setRawPreview('');
    try {
      const result = await uploadAndParse(file);
      setParsedFields(result.parsed_fields);
      setRawPreview(result.raw_text_preview);
      if (result.parsed_fields.length === 0) {
        toast.warning('未从文件中解析到字段');
      } else {
        toast.success(`解析到 ${result.parsed_fields.length} 个字段`);
      }
    } catch {
      toast.error('文件解析失败');
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleApply = async () => {
    if (!activeConfigId || !selectedEquipId || parsedFields.length === 0) return;
    setApplying(true);
    try {
      const result = await applyParsedFields({
        config_id: activeConfigId,
        equipment_id: selectedEquipId,
        fields: parsedFields.map(f => ({
          field_name: f.field_name,
          value: f.field_value,
        })),
      });
      toast.success(
        `已应用 ${result.applied_count} 个字段，跳过 ${result.skipped_count} 个`
      );
    } catch {
      toast.error('应用失败');
    } finally {
      setApplying(false);
    }
  };

  if (!activeConfigId) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        请先在顶部选择构型
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileSearch className="size-5 text-primary" />
        <h2 className="text-lg font-bold">报告解析</h2>
      </div>

      {/* Upload area */}
      <Card>
        <CardContent className="pt-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`
              flex flex-col items-center justify-center rounded-lg border-2 border-dashed
              py-12 cursor-pointer transition-colors
              ${dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'}
            `}
          >
            {parsing ? (
              <>
                <Loader2 className="size-8 mb-3 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">正在解析文件...</p>
              </>
            ) : (
              <>
                <Upload className="size-8 mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">拖拽文件到此处或点击上传</p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持 .docx 和 .pdf 格式
                </p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,.pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>

      {/* Raw text preview */}
      {rawPreview && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowPreview(!showPreview)}
          >
            <CardTitle className="text-sm flex items-center gap-2">
              原文预览
              <Badge variant="outline" className="text-[10px]">
                {showPreview ? '收起' : '展开'}
              </Badge>
            </CardTitle>
          </CardHeader>
          {showPreview && (
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 rounded-md p-3 max-h-48 overflow-auto font-mono">
                {rawPreview}
              </pre>
            </CardContent>
          )}
        </Card>
      )}

      {/* Parsed fields */}
      {parsedFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              解析结果 ({parsedFields.length} 个字段)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">字段</th>
                    <th className="text-left py-2 px-3 font-medium">解析值</th>
                    <th className="text-center py-2 px-3 font-medium">置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedFields.map((field, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2 px-3 font-medium">
                        {FIELD_LABELS[field.field_name] || field.field_name}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {field.field_value}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge
                          variant={
                            field.confidence === 'high'
                              ? 'default'
                              : field.confidence === 'medium'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            field.confidence === 'high'
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                              : field.confidence === 'medium'
                                ? 'bg-amber-500/10 text-amber-700 border-amber-200'
                                : 'bg-red-500/10 text-red-700 border-red-200'
                          }
                        >
                          {field.confidence === 'high'
                            ? '高'
                            : field.confidence === 'medium'
                              ? '中'
                              : '低'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Apply section */}
            <div className="mt-4 pt-4 border-t flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  目标设备
                </label>
                <select
                  value={selectedEquipId}
                  onChange={e => setSelectedEquipId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.part_number})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleApply}
                disabled={applying || !selectedEquipId}
              >
                {applying ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    应用中...
                  </>
                ) : (
                  <>
                    <Check className="size-4 mr-2" />
                    应用到设备
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!parsing && parsedFields.length === 0 && !rawPreview && (
        <div className="py-8 text-center text-muted-foreground">
          <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">上传 Word 或 PDF 报告文件以开始解析</p>
        </div>
      )}
    </div>
  );
}
