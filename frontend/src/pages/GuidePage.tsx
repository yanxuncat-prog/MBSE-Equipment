import React from 'react';
import { Typography, Card, Steps, Divider, Tag, Space, Alert } from 'antd';
import {
  ToolOutlined,
  EnvironmentOutlined,
  BranchesOutlined,
  LoginOutlined,
  PlusOutlined,
  SearchOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SwapOutlined,
  LockOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const sectionCard = (
  icon: React.ReactNode,
  title: string,
  color: string,
  children: React.ReactNode,
) => (
  <Card
    size="small"
    style={{ marginBottom: 16, borderLeft: `4px solid ${color}` }}
    title={
      <Space>
        {icon}
        <span>{title}</span>
      </Space>
    }
  >
    {children}
  </Card>
);

export function GuidePage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3}>AeroEquip 使用指南</Title>
      <Paragraph type="secondary">
        AeroEquip 是大型商用运输类飞机的设备管理数字化平台，用于管理机载设备的选型、安装、构型和约束校验。
      </Paragraph>

      <Alert
        message="快速开始"
        description={
          <span>
            登录后，先在顶部导航栏选择 <Text strong>型号 → 系列 → 构型</Text>，
            然后进入「工程师工作台」查看和管理设备。
          </span>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Divider orientation="left">核心功能</Divider>

      {sectionCard(
        <ToolOutlined style={{ color: '#1677ff' }} />,
        '工程师工作台',
        '#1677ff',
        <>
          <Paragraph>这是你的主要工作界面，分为左右两个区域：</Paragraph>
          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: '设备列表（左侧）',
                description: (
                  <>
                    <Paragraph style={{ marginBottom: 4 }}>
                      显示当前构型下的所有设备。支持按件号/名称 <SearchOutlined /> 搜索，按 ATA 章节筛选。
                    </Paragraph>
                    <Space size={4}>
                      <Tag icon={<PlusOutlined />} color="blue">添加设备</Tag>
                      <Tag color="default">点击行 → 查看详情</Tag>
                      <Tag color="red">删除设备</Tag>
                    </Space>
                  </>
                ),
              },
              {
                title: '约束面板（右侧）',
                description: (
                  <>
                    <Paragraph style={{ marginBottom: 4 }}>
                      实时显示当前构型的重量/CG 和电气负荷状态。添加或修改设备后自动更新。
                    </Paragraph>
                    <Space size={4}>
                      <Tag color="green">绿色 = 正常</Tag>
                      <Tag color="orange">橙色 = 接近限值</Tag>
                      <Tag color="red">红色 = 超限</Tag>
                    </Space>
                  </>
                ),
              },
              {
                title: '添加设备',
                description: (
                  <Paragraph style={{ marginBottom: 0 }}>
                    点击「添加设备」按钮，在弹窗中依次填写：
                    基本信息（件号、名称、ATA章节）→ 安装位置（STA/WL/BL）→ 重量数据 → 电气数据。
                    保存后右侧约束面板会自动重新计算。
                  </Paragraph>
                ),
              },
            ]}
          />
        </>,
      )}

      {sectionCard(
        <EnvironmentOutlined style={{ color: '#52c41a' }} />,
        '空间视图',
        '#52c41a',
        <>
          <Paragraph>以 2D SVG 图形展示设备在飞机上的物理安装位置，提供三个视角：</Paragraph>
          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: '侧视图',
                description: '从侧面观察飞机，设备按 STA（站位）和 WL（水线）定位。不同颜色代表不同 ATA 系统。鼠标悬停查看设备信息，点击打开详情。',
              },
              {
                title: '俯视图',
                description: '从上方俯视，设备按 STA 和 BL（翼肋线）定位。适合查看左右对称设备的分布。',
              },
              {
                title: '截面图',
                description: '选择一个 STA 位置，查看该站位附近的设备横截面分布。通过滑块调整截面位置。',
              },
            ]}
          />
          <Paragraph style={{ marginTop: 8 }}>
            <Text strong>区域着色：</Text> 半透明色块表示不同的设备安装区域（Zone 131/132/141/142）。
          </Paragraph>
        </>,
      )}

      {sectionCard(
        <BranchesOutlined style={{ color: '#722ed1' }} />,
        '构型管理',
        '#722ed1',
        <>
          <Paragraph>管理设备构型的版本历史，支持版本对比和基线锁定。</Paragraph>
          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: '版本时间线（左侧）',
                description: '显示所有构型版本。点击切换当前活动构型。带锁图标的是已锁定的基线版本。',
              },
              {
                title: (
                  <Space>
                    <span>构型对比（右侧）</span>
                    <SwapOutlined />
                  </Space>
                ),
                description: (
                  <>
                    选择两个构型版本进行对比，查看：
                    <br />
                    <Space size={4} style={{ marginTop: 4 }}>
                      <Tag color="green">+ 新增设备</Tag>
                      <Tag color="red">- 移除设备</Tag>
                      <Tag color="orange">△ 变更设备</Tag>
                    </Space>
                    <br />
                    底部显示净重量变化等影响汇总。
                  </>
                ),
              },
              {
                title: '操作',
                description: (
                  <Space direction="vertical" size={2}>
                    <span><Tag icon={<PlusOutlined />}>新建构型</Tag> 创建空的草稿版本</span>
                    <span><Tag>克隆当前</Tag> 复制当前构型的所有设备到新版本</span>
                    <span><Tag icon={<LockOutlined />}>锁定基线</Tag> 将当前草稿锁定为不可修改的基线</span>
                  </Space>
                ),
              },
            ]}
          />
        </>,
      )}

      <Divider orientation="left">典型工作流程</Divider>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps
          size="small"
          direction="vertical"
          items={[
            {
              title: '1. 选择构型',
              description: '在顶部导航栏选择型号 → 系列 → 构型版本（通常选择 draft 草稿版本进行编辑）',
            },
            {
              title: '2. 管理设备',
              description: '在「工程师工作台」添加/修改/删除设备，填写重量、位置和电气参数',
            },
            {
              title: '3. 实时校验',
              description: '每次操作后，右侧约束面板自动更新 CG 位置和母线负荷，绿色表示安全',
            },
            {
              title: '4. 空间确认',
              description: '切换到「空间视图」确认设备安装位置是否合理，检查区域分布',
            },
            {
              title: '5. 版本管理',
              description: '方案确定后，在「构型管理」中锁定为基线；需要修改时，先克隆再编辑新版本',
            },
          ]}
        />
      </Card>

      <Divider orientation="left">账号信息</Divider>

      <Card size="small">
        <Paragraph>
          <Text strong>管理员：</Text> <Text code>admin</Text> / <Text code>admin123</Text>
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>工程师：</Text> <Text code>engineer</Text> / <Text code>eng123</Text>
        </Paragraph>
      </Card>
    </div>
  );
}
