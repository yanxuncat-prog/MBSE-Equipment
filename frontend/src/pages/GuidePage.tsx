import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Wrench,
  MapPin,
  GitBranch,
  Plus,
  Search,
  ArrowLeftRight,
  Lock,
} from 'lucide-react';

function StepList({ items }: { items: { title: React.ReactNode; description: React.ReactNode }[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {i + 1}
          </div>
          <div className="pt-0.5">
            <div className="text-sm font-medium">{item.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{item.description}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SectionCard({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm" className="mb-4" style={{ borderLeft: `4px solid ${color}` }}>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function GuidePage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <h2 className="text-lg font-semibold">AeroEquip 使用指南</h2>
      <p className="text-sm text-muted-foreground">
        AeroEquip 是大型商用运输类飞机的设备管理数字化平台，用于管理机载设备的选型、安装、构型和约束校验。
      </p>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm mb-6 mt-4">
        <div className="font-medium mb-1">快速开始</div>
        <span>
          登录后，先在顶部导航栏选择 <strong>型号 → 系列 → 构型</strong>，
          然后进入「工程师工作台」查看和管理设备。
        </span>
      </div>

      <div className="flex items-center gap-2 my-4">
        <span className="text-sm font-medium text-muted-foreground">核心功能</span>
        <Separator className="flex-1" />
      </div>

      <SectionCard
        icon={<Wrench className="size-4 text-[#1677ff]" />}
        title="工程师工作台"
        color="#1677ff"
      >
        <p className="text-sm text-muted-foreground mb-3">这是你的主要工作界面，分为左右两个区域：</p>
        <StepList
          items={[
            {
              title: '设备列表（左侧）',
              description: (
                <>
                  <p className="text-sm text-muted-foreground mb-1">
                    显示当前构型下的所有设备。支持按件号/名称 <Search className="inline size-3.5" /> 搜索，按 ATA 章节筛选。
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="default"><Plus className="size-3 mr-0.5" />添加设备</Badge>
                    <Badge variant="secondary">点击行 → 查看详情</Badge>
                    <Badge variant="destructive">删除设备</Badge>
                  </div>
                </>
              ),
            },
            {
              title: '约束面板（右侧）',
              description: (
                <>
                  <p className="text-sm text-muted-foreground mb-1">
                    实时显示当前构型的重量/CG 和电气负荷状态。添加或修改设备后自动更新。
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Badge className="bg-green-600 text-white">绿色 = 正常</Badge>
                    <Badge className="bg-orange-500 text-white">橙色 = 接近限值</Badge>
                    <Badge className="bg-red-600 text-white">红色 = 超限</Badge>
                  </div>
                </>
              ),
            },
            {
              title: '添加设备',
              description: (
                <p className="text-sm text-muted-foreground">
                  点击「添加设备」按钮，在弹窗中依次填写：
                  基本信息（件号、名称、ATA章节）→ 安装位置（STA/WL/BL）→ 重量数据 → 电气数据。
                  保存后右侧约束面板会自动重新计算。
                </p>
              ),
            },
          ]}
        />
      </SectionCard>

      <SectionCard
        icon={<MapPin className="size-4 text-[#52c41a]" />}
        title="空间视图"
        color="#52c41a"
      >
        <p className="text-sm text-muted-foreground mb-3">以 2D SVG 图形展示设备在飞机上的物理安装位置，提供三个视角：</p>
        <StepList
          items={[
            {
              title: '侧视图',
              description:
                '从侧面观察飞机，设备按 STA（站位）和 WL（水线）定位。不同颜色代表不同 ATA 系统。鼠标悬停查看设备信息，点击打开详情。',
            },
            {
              title: '俯视图',
              description:
                '从上方俯视，设备按 STA 和 BL（翼肋线）定位。适合查看左右对称设备的分布。',
            },
            {
              title: '截面图',
              description:
                '选择一个 STA 位置，查看该站位附近的设备横截面分布。通过滑块调整截面位置。',
            },
          ]}
        />
        <p className="text-sm text-muted-foreground mt-2">
          <strong>区域着色：</strong> 半透明色块表示不同的设备安装区域（Zone 131/132/141/142）。
        </p>
      </SectionCard>

      <SectionCard
        icon={<GitBranch className="size-4 text-[#722ed1]" />}
        title="构型管理"
        color="#722ed1"
      >
        <p className="text-sm text-muted-foreground mb-3">管理设备构型的版本历史，支持版本对比和基线锁定。</p>
        <StepList
          items={[
            {
              title: '版本时间线（左侧）',
              description:
                '显示所有构型版本。点击切换当前活动构型。带锁图标的是已锁定的基线版本。',
            },
            {
              title: (
                <div className="flex items-center gap-2">
                  <span>构型对比（右侧）</span>
                  <ArrowLeftRight className="size-3.5" />
                </div>
              ),
              description: (
                <>
                  选择两个构型版本进行对比，查看：
                  <br />
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    <Badge className="bg-green-600 text-white">+ 新增设备</Badge>
                    <Badge className="bg-red-600 text-white">- 移除设备</Badge>
                    <Badge className="bg-orange-500 text-white">△ 变更设备</Badge>
                  </div>
                  <br />
                  底部显示净重量变化等影响汇总。
                </>
              ),
            },
            {
              title: '操作',
              description: (
                <div className="flex flex-col gap-1">
                  <span><Badge variant="outline"><Plus className="size-3 mr-0.5" />新建构型</Badge> 创建空的草稿版本</span>
                  <span><Badge variant="outline">克隆当前</Badge> 复制当前构型的所有设备到新版本</span>
                  <span><Badge variant="outline"><Lock className="size-3 mr-0.5" />锁定基线</Badge> 将当前草稿锁定为不可修改的基线</span>
                </div>
              ),
            },
          ]}
        />
      </SectionCard>

      <div className="flex items-center gap-2 my-4">
        <span className="text-sm font-medium text-muted-foreground">典型工作流程</span>
        <Separator className="flex-1" />
      </div>

      <Card size="sm" className="mb-4">
        <CardContent>
          <StepList
            items={[
              {
                title: '1. 选择构型',
                description:
                  '在顶部导航栏选择型号 → 系列 → 构型版本（通常选择 draft 草稿版本进行编辑）',
              },
              {
                title: '2. 管理设备',
                description:
                  '在「工程师工作台」添加/修改/删除设备，填写重量、位置和电气参数',
              },
              {
                title: '3. 实时校验',
                description:
                  '每次操作后，右侧约束面板自动更新 CG 位置和母线负荷，绿色表示安全',
              },
              {
                title: '4. 空间确认',
                description:
                  '切换到「空间视图」确认设备安装位置是否合理，检查区域分布',
              },
              {
                title: '5. 版本管理',
                description:
                  '方案确定后，在「构型管理」中锁定为基线；需要修改时，先克隆再编辑新版本',
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 my-4">
        <span className="text-sm font-medium text-muted-foreground">账号信息</span>
        <Separator className="flex-1" />
      </div>

      <Card size="sm">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong>管理员：</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">admin</code> / <code className="rounded bg-muted px-1.5 py-0.5 text-xs">admin123</code>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>工程师：</strong> <code className="rounded bg-muted px-1.5 py-0.5 text-xs">engineer</code> / <code className="rounded bg-muted px-1.5 py-0.5 text-xs">eng123</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
