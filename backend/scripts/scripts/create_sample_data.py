"""Generate sample CE-25A equipment Excel file."""
from openpyxl import Workbook

HEADERS = ["件号", "名称", "ATA章节", "类型", "重量kg", "STA", "WL", "BL", "区域ID", "母线ID", "功耗kVA", "状态", "描述"]

EQUIPMENT = [
    ["FMC-800A", "飞行管理计算机", "34-21", "LRU", 15.2, 280, 180, 0, "131", "AC BUS 1", 0.8, "approved", "双余度飞行管理"],
    ["IRS-C2", "惯性基准系统", "34-22", "LRU", 12.8, 300, 175, 10, "131", "AC BUS 2", 1.2, "approved", "激光陀螺仪"],
    ["ADC-500", "大气数据计算机", "34-11", "LRU", 8.5, 260, 185, -10, "131", "AC BUS 1", 0.5, "approved", "全静压系统"],
    ["GPS-4200", "GPS接收机", "34-25", "LRU", 3.1, 310, 190, 5, "131", "DC ESS", 0.3, "approved", "双频接收"],
    ["AHRS-100", "航姿基准系统", "34-23", "LRU", 6.2, 295, 178, -5, "131", "AC BUS 1", 0.6, "approved", "MEMS传感器"],
    ["FCC-A1", "飞行控制计算机A", "27-10", "LRU", 18.5, 350, 160, 0, "132", "AC BUS 1", 1.5, "approved", "三余度飞控"],
    ["FCC-B1", "飞行控制计算机B", "27-10", "LRU", 18.5, 355, 160, 15, "132", "AC BUS 2", 1.5, "approved", "三余度飞控备份"],
    ["VHF-1", "甚高频通信电台1", "23-11", "LRU", 5.8, 400, 200, -20, "132", "AC BUS 1", 0.4, "approved", "25kHz间隔"],
    ["VHF-2", "甚高频通信电台2", "23-11", "LRU", 5.8, 405, 200, 20, "132", "AC BUS 2", 0.4, "approved", "8.33kHz间隔"],
    ["HF-500", "高频通信电台", "23-12", "LRU", 9.2, 420, 195, 0, "132", "AC BUS 1", 0.8, "approved", "SSB/AM"],
    ["ATC-6000", "应答机", "34-51", "LRU", 4.5, 380, 185, 0, "132", "DC ESS", 0.3, "approved", "Mode-S增强"],
    ["TCAS-3000", "防撞系统", "34-52", "LRU", 7.8, 385, 188, 10, "132", "AC BUS 1", 0.7, "approved", "TCAS II"],
    ["WXR-800", "气象雷达", "34-41", "LRU", 22.0, 150, 170, 0, "131", "AC BUS 1", 2.0, "approved", "X波段"],
    ["EGPWS-MK7", "增强近地警告", "34-53", "LRU", 5.5, 290, 182, 0, "131", "DC ESS", 0.4, "approved", "地形数据库"],
    ["DME-450", "测距仪", "34-31", "LRU", 6.0, 370, 192, 0, "132", "AC BUS 2", 0.5, "approved", "X/Y信道"],
    ["CVR-120", "驾驶舱语音记录器", "31-31", "LRU", 4.8, 900, 150, 0, "141", "DC MAIN", 0.2, "approved", "2小时记录"],
    ["DFDR-250", "数字飞行数据记录器", "31-32", "LRU", 6.5, 910, 155, 10, "141", "DC MAIN", 0.3, "approved", "256参数"],
    ["ELT-406B", "紧急定位发射机", "25-60", "LRU", 3.2, 920, 160, -10, "141", "DC ESS", 0.1, "approved", "406MHz"],
    ["SATCOM-1", "卫星通信系统", "23-15", "LRU", 11.5, 430, 205, 0, "132", "AC BUS 1", 1.0, "approved", "Inmarsat"],
    ["APU-ECU", "APU电子控制", "49-10", "LRU", 8.0, 1050, 140, 0, "142", "DC MAIN", 0.6, "approved", "全权数控"],
    ["PACK-CTRL1", "空调组件控制器1", "21-51", "LRU", 4.2, 500, 130, -30, "132", "AC BUS 1", 0.3, "approved", "温度调节"],
    ["PACK-CTRL2", "空调组件控制器2", "21-51", "LRU", 4.2, 505, 130, 30, "132", "AC BUS 2", 0.3, "approved", "温度调节"],
    ["ELEC-GCU1", "发电机控制单元1", "24-21", "LRU", 7.5, 460, 140, -25, "132", "AC BUS 1", 0.4, "approved", "恒频控制"],
    ["ELEC-GCU2", "发电机控制单元2", "24-21", "LRU", 7.5, 465, 140, 25, "132", "AC BUS 2", 0.4, "approved", "恒频控制"],
    ["FUEL-QTY", "燃油量指示计算机", "28-41", "LRU", 5.0, 550, 135, 0, "132", "DC ESS", 0.3, "approved", "电容式测量"],
    ["HYD-CTRL1", "液压控制面板", "29-11", "LRU", 3.8, 480, 145, -15, "132", "DC MAIN", 0.2, "approved", "系统1控制"],
    ["FIRE-DET1", "火警探测控制器", "26-11", "LRU", 3.5, 440, 150, 0, "132", "DC ESS", 0.2, "approved", "发动机火警"],
    ["OXY-CTRL", "氧气系统控制器", "35-11", "LRU", 2.8, 520, 155, 0, "132", "DC MAIN", 0.15, "approved", "客舱释压"],
    ["PRESS-CTRL", "增压控制器", "21-31", "LRU", 6.0, 530, 138, 0, "132", "AC BUS 1", 0.5, "approved", "座舱高度控制"],
    ["EFIS-L", "电子飞行仪表(左)", "31-63", "LRU", 8.0, 200, 210, -40, "131", "AC BUS 1", 0.9, "approved", "LCD显示"],
    ["EFIS-R", "电子飞行仪表(右)", "31-63", "LRU", 8.0, 200, 210, 40, "131", "AC BUS 2", 0.9, "approved", "LCD显示"],
]

def create_sample_xlsx(output_path: str):
    wb = Workbook()
    ws = wb.active
    ws.title = "设备清单"
    ws.append(HEADERS)
    for row in EQUIPMENT:
        ws.append(row)
    wb.save(output_path)
    print(f"Created {output_path} with {len(EQUIPMENT)} equipment rows")

if __name__ == "__main__":
    import os
    output = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample", "ce25a_equipment.xlsx")
    os.makedirs(os.path.dirname(output), exist_ok=True)
    create_sample_xlsx(output)
