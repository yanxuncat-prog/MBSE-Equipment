export type ColDef = {
  key: string;
  label: string;
  align?: 'center' | 'right';
  mono?: boolean;
  searchable?: boolean;
  width?: string;  // CSS width, e.g. '120px'
};

export type AttrGroup = {
  key: string;
  label: string;
  icon: string;
  color: string;
  columns: ColDef[];
};

export const ATTR_GROUPS: AttrGroup[] = [
  {
    key: 'identity', label: '标识与分类', icon: '🏷', color: 'text-foreground',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true, width: '115px' },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'name_en', label: '英文名称', searchable: true },
      { key: 'abbreviation_en', label: '英文缩写', searchable: true },
      { key: 'ata_chapter', label: 'ATA' },
      { key: 'equipment_type', label: '类型' },
      { key: 'dal', label: 'DAL' },
      { key: 'supplier_part_number', label: '供应商件号', searchable: true },
      { key: 'description', label: '描述', searchable: true },
    ],
  },
  {
    key: 'physical', label: '物理特性', icon: '📐', color: 'text-blue-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true, width: '115px' },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'dimensions_mm', label: '尺寸(mm)', searchable: true },
      { key: 'connector_count', label: '连接器数量', align: 'right' },
      { key: 'is_metal_shell', label: '金属壳体', align: 'center' },
      { key: 'metal_shell_non_conductive', label: '壳体不导电处理', searchable: true },
    ],
  },
  {
    key: 'elec-class', label: '电气分类与供电', icon: '⚡', color: 'text-amber-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true, width: '115px' },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'is_electrical', label: '电设备', align: 'center' },
      { key: 'is_primary_electrical', label: '一级用电', align: 'center' },
      { key: 'has_eicd', label: 'EICD', align: 'center' },
      { key: 'power_voltage', label: '供电电压' },
      { key: 'voltage_range', label: '电压范围' },
      { key: 'power_redundancy', label: '供电余度' },
      { key: 'dissimilar_supply', label: '异类供电' },
    ],
  },
  {
    key: 'elec-load', label: '功耗与负载', icon: '🔋', color: 'text-orange-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true, width: '115px' },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'power_watts', label: '用电功率' },
      { key: 'power_kva_normal', label: '正常功耗(kW)', align: 'right' },
      { key: 'power_kva_emergency', label: '应急功耗(kW)', align: 'right' },
      { key: 'power_kva_max', label: '峰值功耗(kW)', align: 'right' },
      { key: 'soft_start', label: '软启动' },
      { key: 'peak_power_time_s', label: '峰值时间(s)' },
      { key: 'emergency_sheddable', label: '应急可卸' },
    ],
  },
  {
    key: 'grounding', label: '接地与搭接', icon: '🔌', color: 'text-emerald-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true, width: '115px' },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'internal_grounding', label: '共地', searchable: true, width: '60px' },
      { key: 'shell_grounding_method', label: '壳体接地', width: '65px' },
      { key: 'shell_grounding_fault_path', label: '故障路径', width: '60px' },
      { key: 'grounding_special_requirements', label: '接地要求', width: '65px' },
      { key: 'grounding_terminal_diameter', label: '端子径', width: '50px' },
      { key: 'bonding_method', label: '搭接方式', width: '60px' },
      { key: 'bonding_type', label: '搭接类型', width: '60px' },
      { key: 'bonding_resistance', label: '阻值mΩ', width: '55px' },
    ],
  },
  {
    key: 'mechanical', label: '机械接口', icon: '🔧', color: 'text-violet-600',
    columns: [
      { key: 'part_number', label: '件号', mono: true, searchable: true, width: '115px' },
      { key: 'name', label: '设备类型名称', searchable: true },
      { key: 'screw_spec', label: '螺钉牌号', searchable: true },
      { key: 'bracket_delegated_158', label: '托架委托158', align: 'center' },
      { key: 'has_tolerance_drawing', label: '公差工程图', align: 'center' },
    ],
  },
];

/** Find which attribute group a field key belongs to */
export function findGroupForField(fieldKey: string): string | null {
  for (const g of ATTR_GROUPS) {
    if (g.columns.some(c => c.key === fieldKey)) return g.key;
  }
  return null;
}

export function computeFillRate(item: Record<string, any>): number {
  const allKeys = ATTR_GROUPS.flatMap(g => g.columns.map(c => c.key));
  const unique = [...new Set(allKeys)];
  const filled = unique.filter(k => item[k] !== null && item[k] !== undefined && item[k] !== '').length;
  return Math.round((filled / unique.length) * 100);
}
