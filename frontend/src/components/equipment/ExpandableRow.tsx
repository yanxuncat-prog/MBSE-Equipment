import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Equipment } from '@/types';

interface Props {
  equipment: Equipment;
  configId: string;
  onSaved: () => void;
}

function display(v: string | number | null | undefined, suffix = ''): string {
  if (v === null || v === undefined || v === '') return '-';
  return `${v}${suffix}`;
}

function displayBool(v: boolean | null | undefined): string {
  if (v === true) return '是';
  if (v === false) return '否';
  return '-';
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={cn("text-sm", highlight && value !== '-' ? "font-semibold text-foreground" : value === '-' ? "text-muted-foreground/40" : "font-medium")}>{value}</p>
    </div>
  );
}

/* ── Tab definitions with colors ── */
const TABS = [
  {
    key: 'weight',
    label: '重量/布置',
    dot: 'bg-blue-400',
    active: 'bg-blue-50 text-blue-700 border-blue-200',
    inactive: 'hover:bg-blue-50/50 hover:text-blue-600 hover:border-blue-100',
    contentBg: 'bg-blue-50/40',
  },
  {
    key: 'electrical',
    label: '电负载',
    dot: 'bg-amber-400',
    active: 'bg-amber-50 text-amber-700 border-amber-200',
    inactive: 'hover:bg-amber-50/50 hover:text-amber-600 hover:border-amber-100',
    contentBg: 'bg-amber-50/40',
  },
  {
    key: 'environment',
    label: '环境综合',
    dot: 'bg-emerald-400',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-100',
    contentBg: 'bg-emerald-50/40',
  },
] as const;

export function ExpandableRow({ equipment }: Props) {
  const [activeTab, setActiveTab] = useState('weight');
  const e = equipment;

  const currentTab = TABS.find(t => t.key === activeTab)!;

  return (
    <div className={cn("p-4 h-[280px] overflow-y-auto rounded-b transition-colors", currentTab.contentBg)}>
      {/* Color tag tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer border",
                isActive
                  ? tab.active
                  : `bg-transparent text-muted-foreground border-border/40 ${tab.inactive}`
              )}
            >
              <span className={cn("size-2 rounded-full", tab.dot)} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'weight' && (
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <Field label="重量" value={display(e.config_data?.mass_kg?.toFixed(2), ' kg')} highlight />
          <Field label="重量指标" value={display(e.config_data?.weight_target_kg, ' kg')} />
          <Field label="重心X" value={display(e.config_data?.cg_x)} />
          <Field label="重心Y" value={display(e.config_data?.cg_y)} />
          <Field label="重心Z" value={display(e.config_data?.cg_z)} />
          <Field label="超重风险" value={display(e.config_data?.overweight_risk)} highlight />
          <Field label="尺寸" value={display(e.dimensions_mm)} />
          <Field label="STA" value={display(e.config_data?.sta)} highlight />
          <Field label="BL" value={display(e.config_data?.bl)} />
          <Field label="WL" value={display(e.config_data?.wl)} />
          <Field label="安装方式" value={display(e.config_data?.install_method)} />
          <Field label="布置调整" value={display(e.config_data?.layout_adjustment)} />
          <Field label="PACE图纸" value={displayBool(e.config_data?.in_pace_drawing)} />
          <Field label="搭接位置" value={display(e.config_data?.bonding_position)} />
          <Field label="负责人" value={display(e.config_data?.responsible_person)} />
        </div>
      )}

      {activeTab === 'electrical' && (
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <Field label="供电电压" value={display(e.power_voltage)} highlight />
          <Field label="正常功耗" value={display(e.config_data?.power_kva_normal, ' kW')} highlight />
          <Field label="应急功耗" value={display(e.config_data?.power_kva_emergency, ' kW')} />
          <Field label="峰值功耗" value={display(e.config_data?.power_kva_max, ' kW')} />
          <Field label="供电余度" value={display(e.power_redundancy)} />
          <Field label="电压范围" value={display(e.voltage_range)} />
          <Field label="用电功率" value={display(e.power_watts)} />
          <Field label="搭接方式" value={display(e.bonding_method)} />
          <Field label="搭接类型" value={display(e.bonding_type)} />
          <Field label="搭接阻值" value={display(e.bonding_resistance)} />
          <Field label="是否电设备" value={displayBool(e.is_electrical)} />
          <Field label="一级用电" value={displayBool(e.is_primary_electrical)} />
          <Field label="EICD" value={displayBool(e.has_eicd)} />
        </div>
      )}

      {activeTab === 'environment' && (
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <span className="col-span-4 text-sm text-muted-foreground">DO-160 数据已迁移至 DO-160 鉴定记录表</span>
        </div>
      )}
    </div>
  );
}
