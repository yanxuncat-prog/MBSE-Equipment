export interface KnowledgeEntry {
  label: string;
  definition: string;
  values?: string;
  standard?: string;
}

export const KNOWLEDGE: Record<string, KnowledgeEntry> = {
  part_number: { label: '件号 (Part Number)', definition: '设备在设计图纸和制造中的唯一编号。格式为 NNNNENNNNNGXXX，前4位对应ATA章节。', standard: 'ATA iSpec 2200' },
  dal: { label: 'DAL (Design Assurance Level)', definition: '设计保证等级，源自 DO-178C/DO-254 标准，定义软件/硬件开发严格程度。', values: 'A (灾难性) → B (危险) → C (重大) → D (轻微) → E (无影响)', standard: 'RTCA DO-178C §2.2, SAE ARP4754A' },
  is_electrical: { label: '是否电设备', definition: '标识该设备是否需要电力供应才能工作。电设备需纳入电负载分析。' },
  is_primary_electrical: { label: '一级用电设备', definition: '关键飞行安全相关的电气设备，断电可能影响飞行安全，需优先保障供电。', standard: 'CS-25.1351' },
  has_eicd: { label: 'EICD (电气接口控制文件)', definition: '标识该设备是否已建立 EICD 文档，定义电气连接器针脚分配和信号接口。', standard: 'ARP4754A' },
  power_voltage: { label: '供电电压', definition: '设备正常工作所需的电源电压等级。CE-25A 采用 270VDC/28VDC/800VDC 三种电压体制。', values: '270V / 28V / 800V' },
  power_kva_normal: { label: '正常功耗 (kW)', definition: '设备在正常工作模式下的稳态功率消耗。' },
  power_kva_emergency: { label: '应急功耗 (kW)', definition: '设备在应急模式下的功率消耗，通常低于正常模式（部分功能降级）。' },
  power_kva_max: { label: '峰值功耗 (kW)', definition: '设备启动或瞬态过程中的最大功率，通常持续时间很短。' },
  dimensions_mm: { label: '外形尺寸 (mm)', definition: '设备外廓的长×高×宽尺寸，用于布置空间校核。' },
  connector_count: { label: '连接器数量', definition: '设备上的电气连接器或接线柱总数，影响线束设计和 EWIS 分析。' },
  is_metal_shell: { label: '金属壳体', definition: '壳体材质是否为金属。金属壳体影响接地方式和电磁屏蔽特性。' },
  metal_shell_non_conductive: { label: '壳体不导电处理', definition: '金属壳体是否经过特殊处理使其不易导电（如阳极氧化、涂层）。' },
  bonding_method: { label: '电搭接方式', definition: '设备与飞机结构之间建立电气连接的方式，确保电磁兼容和雷电防护。', values: '面搭接 / 线搭接', standard: 'SAE ARP1870' },
  bonding_type: { label: '电搭接类型', definition: '搭接的分类等级，决定搭接阻值要求和测试标准。', values: 'A类 / B类 / C类' },
  bonding_resistance: { label: '搭接阻值要求 (mΩ)', definition: '搭接连接的最大允许电阻值。A类要求最严格（≤2.5mΩ）。', standard: 'SAE ARP1870, MIL-B-5087' },
  screw_spec: { label: '螺钉牌号', definition: '安装设备所用紧固件的型号规格（长度待定需现场确认）。' },
  bracket_delegated_158: { label: '托架委托158设计+装配', definition: '标识该设备的安装托架是否由158厂负责设计和装配。' },
  has_tolerance_drawing: { label: '公差尺寸工程图', definition: '标识该设备是否已提供包含公差标注的安装接口工程图纸。' },
  soft_start: { label: '软启动', definition: '设备是否需要软启动（缓慢升压），避免启动瞬间的大电流冲击。' },
  emergency_sheddable: { label: '应急可卸', definition: '在应急供电模式下，该设备是否可以被切断供电（卸载），以节省电力给关键设备。' },
  dissimilar_supply: { label: '异类供电', definition: '设备是否需要来自不同类型电源的冗余供电（如同时需要左发电机和右发电机）。' },
  internal_grounding: { label: '设备内共地', definition: '设备内部各电路模块的接地连接方式（共地/独立地/浮地）。' },
  shell_grounding_method: { label: '壳体接地方式', definition: '设备金属壳体与飞机结构之间的接地连接方式。' },
  shell_grounding_fault_path: { label: '故障电流路径', definition: '壳体接地是否作为故障电流的回流路径。' },
  grounding_special_requirements: { label: '接地特殊要求', definition: '超出常规接地规范的特殊接地需求。' },
  grounding_terminal_diameter: { label: '接地端子内径', definition: '安装位置结构件上接地端子的内径尺寸，用于选配接地线缆。' },
  voltage_range: { label: '工作电压范围', definition: '设备能正常工作的电压范围（最小值~最大值）。' },
  power_redundancy: { label: '供电余度', definition: '设备供电通道的冗余设计（如双通道、三通道）。' },
  power_watts: { label: '用电功率', definition: '设备的额定用电功率。' },
  peak_power_time_s: { label: '峰值功率持续时间(s)', definition: '峰值功率的持续时间，通常在启动阶段出现。' },
  name: { label: '设备类型名称', definition: '设备在设备库中的标准中文名称，用于统一标识同一类设备。' },
  name_en: { label: '英文名称', definition: '设备的英文名称，用于国际化文档和对外交流。' },
  abbreviation_en: { label: '英文缩写', definition: '设备英文名称的缩写形式。' },
  ata_chapter: { label: 'ATA 章节', definition: 'ATA 100/iSpec 2200 标准中的系统章节编号，用于设备分类。', standard: 'ATA iSpec 2200' },
  equipment_type: { label: '设备类型', definition: '设备的硬件分类。', values: 'LRU (外场可更换单元) / SRU (车间可更换单元) / 结构件 / 线缆' },
  supplier_part_number: { label: '供应商件号', definition: '设备供应商使用的零件编号。' },
  description: { label: '描述', definition: '设备的功能说明或补充描述信息。' },
};
