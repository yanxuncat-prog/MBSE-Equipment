import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ROLES = [
  { name: '系统管理员', code: 'Admin', desc: '最高权限，可执行所有操作：用户管理、角色分配、全局配置、数据导入导出', color: 'text-status-danger' },
  { name: '构型管理员', code: 'ConfigManager', desc: '设备清单行级管理：设备条目的新增、删除、启用、停用', color: 'text-chart-1' },
  { name: '专业负责人', code: 'DomainLead', desc: '本专业所属字段读写权限，可管理下属人员权限', color: 'text-status-warn' },
  { name: '专业人员', code: 'DomainUser', desc: '经授权后可编辑本专业归属字段，可查看其他专业数据（只读）', color: 'text-status-ok' },
  { name: '只读用户', code: 'Viewer', desc: '全局数据查看权限，不可编辑', color: 'text-muted-foreground' },
];

const MODULES = [
  { name: '构型模块', fields: 'ATA章节、设备名称、设备编号、LIN号、架次适用性、构型分类', owner: '构型管理团队' },
  { name: '实物管控', fields: '安装分工、安装条件、到货日期、计划安装日期、设备实物状态', owner: '各系统专业 + 总装' },
  { name: '布置模块', fields: '设备布置区域、MICD确认状态、数模发布状态、设备尺寸', owner: '布置专业' },
  { name: '环境模块', fields: '电搭接方式/类型/阻值、DO-160环境鉴定', owner: '环境专业' },
  { name: '重量模块', fields: '重量、重心坐标、惯量、重量指标、超重风险', owner: '重量专业' },
  { name: '系统集成', fields: 'EICD、电子电气设备标识、供电方式/余度/电压/功率、壳体材料', owner: '系统集成专业' },
];

const FEATURES = [
  { name: '构型查看', desc: '按ATA系统浏览设备数据，支持重量分析、电负载分析、DO-160鉴定、设备空间布置等可视化' },
  { name: '构型管理', desc: '蝶形图对比不同构型间的设备差异，按ATA系统下钻查看字段级变更' },
  { name: '管理看板', desc: '数据录入完成度、装机进度、CG包线、ATA系统分布等全局统计' },
  { name: '采购进度', desc: '设备采购状态跟踪和交付时间管理' },
];

export function IntroPage() {
  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h2 className="text-xl font-bold">飞机设备数据管理系统</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          面向航空制造的设备构型管理平台，覆盖构型、实物管控、布置、环境、重量、系统集成六大业务模块
        </p>
      </div>

      {/* Features */}
      <Card>
        <CardHeader><CardTitle>功能概览</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.name} className="rounded-lg border p-3">
                <div className="text-sm font-semibold">{f.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader><CardTitle>角色与权限</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ROLES.map(r => (
              <div key={r.code} className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">{r.code}</Badge>
                <div>
                  <span className={`text-sm font-medium ${r.color}`}>{r.name}</span>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>权限设计核心原则：</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>各专业人员仅能编辑本专业归属字段，可查看全局设备基本信息</li>
              <li>设备行的增删由构型管理员统一管控</li>
              <li>专业负责人可赋予本专业下属人员权限</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader><CardTitle>业务模块与字段归属</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MODULES.map(m => (
              <div key={m.name} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="w-20 shrink-0 text-sm font-medium">{m.name}</div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{m.fields}</div>
                  <div className="mt-1 text-xs"><span className="text-muted-foreground">归属：</span>{m.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
