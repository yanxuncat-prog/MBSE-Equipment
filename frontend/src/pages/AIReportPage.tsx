import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Trash2, Clock, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/store/configStore';
import { toast } from 'sonner';
import {
  generateReport,
  listReports,
  deleteReport,
  type AIReport,
} from '@/api/ai-reports';

export function AIReportPage() {
  const { activeConfigId } = useConfigStore();
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<AIReport | null>(null);
  const [history, setHistory] = useState<AIReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load history
  useEffect(() => {
    if (!activeConfigId) return;
    setLoadingHistory(true);
    listReports(activeConfigId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [activeConfigId]);

  const handleGenerate = async () => {
    if (!activeConfigId) {
      toast.error('请先选择构型');
      return;
    }
    if (!title.trim()) {
      toast.error('请输入报告标题');
      return;
    }
    setGenerating(true);
    try {
      const report = await generateReport({
        config_id: activeConfigId,
        report_title: title.trim(),
        template_text: template.trim() || undefined,
      });
      setCurrentReport(report);
      setHistory(prev => [report, ...prev]);
      toast.success('报告生成成功');
    } catch {
      toast.error('报告生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      setHistory(prev => prev.filter(r => r.id !== id));
      if (currentReport?.id === id) setCurrentReport(null);
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
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
        <Sparkles className="size-5 text-primary" />
        <h2 className="text-lg font-bold">AI 报告生成</h2>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Input section (60%) */}
        <div className="lg:col-span-3 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">报告配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  报告标题
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="例如: CE-25A 0号机设备综合报告"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  报告模板 (可选)
                </label>
                <Textarea
                  value={template}
                  onChange={e => setTemplate(e.target.value)}
                  placeholder={'输入报告模板，使用 {{设备总数}} {{总重量}} {{构型名称}} {{电设备数量}} {{总功耗_正常}} {{ATA章节数}} {{DO160_总数}} {{DO160_合规}} 等关键词...\n\n留空将生成标准设备综合报告。'}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || !title.trim()}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    生成报告
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Report display (40%) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4" />
                报告预览
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentReport ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>
                      {new Date(currentReport.generated_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-[600px] rounded-md border p-4 bg-muted/30"
                    dangerouslySetInnerHTML={{
                      __html: simpleMarkdownToHtml(currentReport.content),
                    }}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  生成报告后将在此处显示
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">历史报告</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              暂无历史报告
            </div>
          ) : (
            <div className="space-y-1">
              {history.map(report => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors group"
                  onClick={() => setCurrentReport(report)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{report.title}</span>
                    {report.template && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        自定义模板
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.generated_at).toLocaleDateString('zh-CN')}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(report.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Minimal markdown-to-HTML converter for report display.
 * Handles headings, tables, bold, italic, horizontal rules, and paragraphs.
 */
function simpleMarkdownToHtml(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inTable = false;
  let tableHeader = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inTable) { html.push('</tbody></table>'); inTable = false; }
      html.push('<hr/>');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inTable) { html.push('</tbody></table>'); inTable = false; }
      const level = headingMatch[1].length;
      html.push(`<h${level}>${escapeHtml(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.trim().slice(1, -1).split('|').map(c => c.trim());

      // Check if next line is separator
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const isSeparator = /^\|[\s\-:|]+\|$/.test(nextLine);

      if (!inTable) {
        html.push('<table><thead><tr>');
        cells.forEach(c => html.push(`<th>${escapeHtml(c)}</th>`));
        html.push('</tr></thead>');
        inTable = true;
        tableHeader = true;
        if (isSeparator) i++; // skip separator line
        continue;
      }

      // Skip separator lines
      if (/^[\s\-:|]+$/.test(cells.join('|'))) continue;

      if (tableHeader) {
        html.push('<tbody>');
        tableHeader = false;
      }
      html.push('<tr>');
      cells.forEach(c => html.push(`<td>${escapeHtml(c)}</td>`));
      html.push('</tr>');
      continue;
    }

    // Close table if no longer in table rows
    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
      tableHeader = false;
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Italic text
    line = line.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Bold text
    line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // List items
    if (/^\s*[-*]\s+/.test(line)) {
      html.push(`<li>${escapeHtml(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }

    // Paragraph
    html.push(`<p>${line}</p>`);
  }

  if (inTable) html.push('</tbody></table>');
  return html.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
