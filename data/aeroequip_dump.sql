--
-- PostgreSQL database dump
--

\restrict lO4D78LidXMo0nkJaoUCANqGvlGPcnNJbsgBEkosRYEiHfPD5ttWuZuEfqTevPE

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.zones DROP CONSTRAINT IF EXISTS zones_series_id_fkey;
ALTER TABLE IF EXISTS ONLY public.weight_balances DROP CONSTRAINT IF EXISTS weight_balances_equipment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.series DROP CONSTRAINT IF EXISTS series_program_id_fkey;
ALTER TABLE IF EXISTS ONLY public.equipment DROP CONSTRAINT IF EXISTS equipment_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.electrical_loads DROP CONSTRAINT IF EXISTS electrical_loads_equipment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.configurations DROP CONSTRAINT IF EXISTS configurations_series_id_fkey;
ALTER TABLE IF EXISTS ONLY public.configurations DROP CONSTRAINT IF EXISTS configurations_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.config_equipment DROP CONSTRAINT IF EXISTS config_equipment_zone_id_fkey;
ALTER TABLE IF EXISTS ONLY public.config_equipment DROP CONSTRAINT IF EXISTS config_equipment_equipment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.config_equipment DROP CONSTRAINT IF EXISTS config_equipment_config_id_fkey;
ALTER TABLE IF EXISTS ONLY public.config_equipment DROP CONSTRAINT IF EXISTS config_equipment_bus_id_fkey;
ALTER TABLE IF EXISTS ONLY public.change_requests DROP CONSTRAINT IF EXISTS change_requests_submitted_by_fkey;
ALTER TABLE IF EXISTS ONLY public.change_requests DROP CONSTRAINT IF EXISTS change_requests_config_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bus_definitions DROP CONSTRAINT IF EXISTS bus_definitions_series_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
DROP INDEX IF EXISTS public.ix_zones_zone_code;
DROP INDEX IF EXISTS public.ix_users_username;
DROP INDEX IF EXISTS public.ix_equipment_part_number;
DROP INDEX IF EXISTS public.ix_equipment_ata_chapter;
DROP INDEX IF EXISTS public.ix_audit_logs_entity_type;
DROP INDEX IF EXISTS public.ix_audit_logs_entity_id;
ALTER TABLE IF EXISTS ONLY public.zones DROP CONSTRAINT IF EXISTS zones_pkey;
ALTER TABLE IF EXISTS ONLY public.weight_balances DROP CONSTRAINT IF EXISTS weight_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.weight_balances DROP CONSTRAINT IF EXISTS weight_balances_equipment_id_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.series DROP CONSTRAINT IF EXISTS series_pkey;
ALTER TABLE IF EXISTS ONLY public.programs DROP CONSTRAINT IF EXISTS programs_pkey;
ALTER TABLE IF EXISTS ONLY public.programs DROP CONSTRAINT IF EXISTS programs_name_key;
ALTER TABLE IF EXISTS ONLY public.equipment DROP CONSTRAINT IF EXISTS equipment_pkey;
ALTER TABLE IF EXISTS ONLY public.electrical_loads DROP CONSTRAINT IF EXISTS electrical_loads_pkey;
ALTER TABLE IF EXISTS ONLY public.electrical_loads DROP CONSTRAINT IF EXISTS electrical_loads_equipment_id_key;
ALTER TABLE IF EXISTS ONLY public.configurations DROP CONSTRAINT IF EXISTS configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.config_equipment DROP CONSTRAINT IF EXISTS config_equipment_pkey;
ALTER TABLE IF EXISTS ONLY public.change_requests DROP CONSTRAINT IF EXISTS change_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.bus_definitions DROP CONSTRAINT IF EXISTS bus_definitions_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
DROP TABLE IF EXISTS public.zones;
DROP TABLE IF EXISTS public.weight_balances;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.series;
DROP TABLE IF EXISTS public.programs;
DROP TABLE IF EXISTS public.equipment;
DROP TABLE IF EXISTS public.electrical_loads;
DROP TABLE IF EXISTS public.configurations;
DROP TABLE IF EXISTS public.config_equipment;
DROP TABLE IF EXISTS public.change_requests;
DROP TABLE IF EXISTS public.bus_definitions;
DROP TABLE IF EXISTS public.audit_logs;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.equipment_type_enum;
DROP TYPE IF EXISTS public.equipment_status_enum;
DROP TYPE IF EXISTS public.cr_status_enum;
DROP TYPE IF EXISTS public.config_status_enum;
DROP TYPE IF EXISTS public.bus_type_enum;
--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: bus_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bus_type_enum AS ENUM (
    'AC',
    'DC'
);


--
-- Name: config_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.config_status_enum AS ENUM (
    'draft',
    'baseline',
    'frozen',
    'archived'
);


--
-- Name: cr_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cr_status_enum AS ENUM (
    'draft',
    'validating',
    'reviewing',
    'approved',
    'rejected',
    'withdrawn'
);


--
-- Name: equipment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.equipment_status_enum AS ENUM (
    'in_development',
    'qualifying',
    'approved',
    'discontinued'
);


--
-- Name: equipment_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.equipment_type_enum AS ENUM (
    'LRU',
    'SRU',
    'structural',
    'cable'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'engineer',
    'reviewer',
    'viewer'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    old_value jsonb,
    new_value jsonb,
    user_id uuid NOT NULL,
    reason character varying(500),
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bus_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bus_definitions (
    id uuid NOT NULL,
    series_id uuid NOT NULL,
    bus_name character varying(50) NOT NULL,
    bus_type public.bus_type_enum NOT NULL,
    rated_capacity_kva double precision NOT NULL,
    redundancy_group character varying(50)
);


--
-- Name: change_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.change_requests (
    id uuid NOT NULL,
    config_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    equipment_adds jsonb,
    equipment_dels jsonb,
    equipment_mods jsonb,
    impact_summary jsonb,
    status public.cr_status_enum NOT NULL,
    submitted_by uuid NOT NULL,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: config_equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.config_equipment (
    config_id uuid NOT NULL,
    equipment_id uuid NOT NULL,
    zone_id uuid,
    sta double precision,
    wl double precision,
    bl double precision,
    rack_position character varying(100),
    bus_id uuid,
    notes character varying(500),
    install_method character varying(200),
    bonding_method character varying(50),
    bonding_type character varying(100),
    bonding_resistance character varying(50),
    bonding_position character varying(200),
    in_pace_drawing boolean,
    layout_adjustment character varying(500),
    use_batch0_device boolean,
    procurement_status character varying(20),
    procurement_location character varying(50),
    planned_delivery_date date,
    estimated_delivery_date date,
    procurement_notes text
);


--
-- Name: COLUMN config_equipment.sta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.sta IS 'Fuselage Station';


--
-- Name: COLUMN config_equipment.wl; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.wl IS 'Waterline';


--
-- Name: COLUMN config_equipment.bl; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.bl IS 'Buttline';


--
-- Name: COLUMN config_equipment.install_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.install_method IS '安装方式';


--
-- Name: COLUMN config_equipment.bonding_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.bonding_method IS '电搭接方式';


--
-- Name: COLUMN config_equipment.bonding_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.bonding_type IS '电搭接类型';


--
-- Name: COLUMN config_equipment.bonding_resistance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.bonding_resistance IS '电搭接阻值要求(mΩ)';


--
-- Name: COLUMN config_equipment.bonding_position; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.bonding_position IS '搭接位置(结构零件号)';


--
-- Name: COLUMN config_equipment.in_pace_drawing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.in_pace_drawing IS '是否已在PACE图纸中体现';


--
-- Name: COLUMN config_equipment.layout_adjustment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.layout_adjustment IS '总体布置调整需求';


--
-- Name: COLUMN config_equipment.use_batch0_device; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.use_batch0_device IS '是否使用0号机设备';


--
-- Name: COLUMN config_equipment.procurement_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.procurement_status IS '采购状态: inquiry/contracted/producing/inspecting/shipping/delivered';


--
-- Name: COLUMN config_equipment.procurement_location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.procurement_location IS '设备当前位置城市';


--
-- Name: COLUMN config_equipment.planned_delivery_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.planned_delivery_date IS '计划交付日期';


--
-- Name: COLUMN config_equipment.estimated_delivery_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.estimated_delivery_date IS '预计/实际交付日期';


--
-- Name: COLUMN config_equipment.procurement_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.config_equipment.procurement_notes IS '采购备注';


--
-- Name: configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configurations (
    id uuid NOT NULL,
    series_id uuid NOT NULL,
    version character varying(20) NOT NULL,
    status public.config_status_enum NOT NULL,
    description text,
    created_by uuid,
    locked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: electrical_loads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.electrical_loads (
    id uuid NOT NULL,
    equipment_id uuid NOT NULL,
    power_kva_normal double precision NOT NULL,
    power_kva_emergency double precision,
    power_kva_max double precision
);


--
-- Name: COLUMN electrical_loads.power_kva_normal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.electrical_loads.power_kva_normal IS 'Normal mode power draw (kVA)';


--
-- Name: COLUMN electrical_loads.power_kva_emergency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.electrical_loads.power_kva_emergency IS 'Emergency mode (kVA)';


--
-- Name: COLUMN electrical_loads.power_kva_max; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.electrical_loads.power_kva_max IS 'Max/transient (kVA)';


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id uuid NOT NULL,
    part_number character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    ata_chapter character varying(20) NOT NULL,
    equipment_type public.equipment_type_enum NOT NULL,
    supplier_id uuid,
    status public.equipment_status_enum NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name_en character varying(300),
    abbreviation_en character varying(50),
    internal_number character varying(50),
    lin_number character varying(50),
    supplier_part_number character varying(100),
    dal character varying(5),
    equipment_level character varying(50),
    is_optional boolean,
    is_electrical boolean,
    is_primary_electrical boolean,
    has_eicd boolean,
    has_special_wiring boolean,
    dimensions_mm character varying(100),
    is_metal_shell boolean,
    metal_shell_non_conductive character varying(200),
    internal_grounding character varying(200),
    physical_characteristics text,
    connector_count integer,
    voltage_range character varying(100),
    power_redundancy character varying(100),
    power_voltage character varying(50),
    power_watts character varying(50),
    shell_grounding_method character varying(100),
    shell_grounding_fault_path character varying(200),
    grounding_special_requirements text,
    responsible_person character varying(50),
    aircraft_batch character varying(50),
    config_category character varying(20),
    do160_temp_design_level character varying(100),
    do160_temp_qual_level character varying(100),
    do160_temp_qual_range character varying(100),
    do160_temp_compliance character varying(200),
    normal_operating_temp character varying(50),
    short_term_temp character varying(50),
    ground_storage_temp character varying(50),
    operating_altitude character varying(50),
    qual_report_number character varying(200),
    first_flight_onboard boolean,
    phase2_onboard boolean,
    notes text
);


--
-- Name: COLUMN equipment.name_en; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.name_en IS '英文名称';


--
-- Name: COLUMN equipment.abbreviation_en; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.abbreviation_en IS '英文缩写';


--
-- Name: COLUMN equipment.internal_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.internal_number IS '内部设备编号';


--
-- Name: COLUMN equipment.lin_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.lin_number IS 'LIN号';


--
-- Name: COLUMN equipment.supplier_part_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.supplier_part_number IS '供应商件号';


--
-- Name: COLUMN equipment.dal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.dal IS '设计保证等级 A/B/C/D';


--
-- Name: COLUMN equipment.equipment_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.equipment_level IS '设备等级';


--
-- Name: COLUMN equipment.is_optional; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.is_optional IS '是否选装设备';


--
-- Name: COLUMN equipment.is_electrical; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.is_electrical IS '是否是电设备';


--
-- Name: COLUMN equipment.is_primary_electrical; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.is_primary_electrical IS '是否一级用电设备';


--
-- Name: COLUMN equipment.has_eicd; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.has_eicd IS '是否有EICD';


--
-- Name: COLUMN equipment.has_special_wiring; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.has_special_wiring IS '是否有特殊布线需求';


--
-- Name: COLUMN equipment.dimensions_mm; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.dimensions_mm IS '长×高×宽(mm)';


--
-- Name: COLUMN equipment.is_metal_shell; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.is_metal_shell IS '壳体是否金属';


--
-- Name: COLUMN equipment.metal_shell_non_conductive; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.metal_shell_non_conductive IS '金属壳体是否经特殊处理不易导电';


--
-- Name: COLUMN equipment.internal_grounding; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.internal_grounding IS '设备内共地情况';


--
-- Name: COLUMN equipment.physical_characteristics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.physical_characteristics IS '设备物理特性';


--
-- Name: COLUMN equipment.connector_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.connector_count IS '连接器或接线柱数量';


--
-- Name: COLUMN equipment.voltage_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.voltage_range IS '正常工作电压范围(V)';


--
-- Name: COLUMN equipment.power_redundancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.power_redundancy IS '供电余度';


--
-- Name: COLUMN equipment.power_voltage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.power_voltage IS '供电电压';


--
-- Name: COLUMN equipment.power_watts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.power_watts IS '用电功率';


--
-- Name: COLUMN equipment.shell_grounding_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.shell_grounding_method IS '壳体接地方式';


--
-- Name: COLUMN equipment.shell_grounding_fault_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.shell_grounding_fault_path IS '壳体接地是否故障电流路径';


--
-- Name: COLUMN equipment.grounding_special_requirements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.grounding_special_requirements IS '其他接地特殊要求';


--
-- Name: COLUMN equipment.responsible_person; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.responsible_person IS '设备负责人';


--
-- Name: COLUMN equipment.aircraft_batch; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.aircraft_batch IS '装机架次';


--
-- Name: COLUMN equipment.config_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.config_category IS '构型分类';


--
-- Name: COLUMN equipment.do160_temp_design_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.do160_temp_design_level IS '设计要求等级';


--
-- Name: COLUMN equipment.do160_temp_qual_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.do160_temp_qual_level IS 'DO-160第4章温度鉴定等级';


--
-- Name: COLUMN equipment.do160_temp_qual_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.do160_temp_qual_range IS '鉴定工作温度范围';


--
-- Name: COLUMN equipment.do160_temp_compliance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.do160_temp_compliance IS '鉴定符合情况';


--
-- Name: COLUMN equipment.normal_operating_temp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.normal_operating_temp IS '正常工作温度(℃)';


--
-- Name: COLUMN equipment.short_term_temp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.short_term_temp IS '短时工作温度(℃)';


--
-- Name: COLUMN equipment.ground_storage_temp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.ground_storage_temp IS '地面停放温度(℃)';


--
-- Name: COLUMN equipment.operating_altitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.operating_altitude IS '高度(m)';


--
-- Name: COLUMN equipment.qual_report_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.qual_report_number IS '鉴定报告编号';


--
-- Name: COLUMN equipment.first_flight_onboard; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.first_flight_onboard IS '首飞是否上机';


--
-- Name: COLUMN equipment.phase2_onboard; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.phase2_onboard IS '二阶段是否上机';


--
-- Name: COLUMN equipment.notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.equipment.notes IS '备注';


--
-- Name: programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programs (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    aircraft_type character varying(100) NOT NULL,
    description character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.series (
    id uuid NOT NULL,
    program_id uuid NOT NULL,
    variant_name character varying(100) NOT NULL,
    description character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid NOT NULL,
    name character varying(200) NOT NULL,
    country character varying(100),
    contact_email character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(50) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    display_name character varying(100) NOT NULL,
    role public.user_role NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: weight_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weight_balances (
    id uuid NOT NULL,
    equipment_id uuid NOT NULL,
    mass_kg double precision NOT NULL
);


--
-- Name: zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zones (
    id uuid NOT NULL,
    series_id uuid NOT NULL,
    zone_code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    sta_from double precision NOT NULL,
    sta_to double precision NOT NULL,
    wl_from double precision,
    wl_to double precision,
    bl_from double precision,
    bl_to double precision,
    env_category character varying(50)
);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, entity_type, entity_id, action, old_value, new_value, user_id, reason, "timestamp") FROM stdin;
\.


--
-- Data for Name: bus_definitions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bus_definitions (id, series_id, bus_name, bus_type, rated_capacity_kva, redundancy_group) FROM stdin;
7c32540a-6dea-40ee-be9e-3c9f74f315ee	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	AC BUS 1	AC	30	\N
f306bed4-d0ff-4da8-b013-e8215ba1c213	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	AC BUS 2	AC	30	\N
5edef345-8ee6-44eb-a458-3bdbb0612a9d	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	DC BUS 1	DC	15	\N
0bfc8015-1221-4853-8ea8-1f84e1a0ef66	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	DC BUS 2	DC	15	\N
1dd8298e-edf2-43a0-ad17-cb82a478fcfa	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	DC ESS	DC	8	\N
e4276060-dc3f-4260-8ff3-3deaaea6bfcc	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	HOT BAT BUS	DC	5	\N
\.


--
-- Data for Name: change_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.change_requests (id, config_id, title, description, equipment_adds, equipment_dels, equipment_mods, impact_summary, status, submitted_by, approved_at, created_at) FROM stdin;
\.


--
-- Data for Name: config_equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.config_equipment (config_id, equipment_id, zone_id, sta, wl, bl, rack_position, bus_id, notes, install_method, bonding_method, bonding_type, bonding_resistance, bonding_position, in_pace_drawing, layout_adjustment, use_batch0_device, procurement_status, procurement_location, planned_delivery_date, estimated_delivery_date, procurement_notes) FROM stdin;
67ffbbe0-1b90-4694-be64-0505c5dde861	1c4ca146-747e-4ef9-80ef-50b5bc183314	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	560.656122660773	218.0117812336478	-4.710160998016505	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	28068af6-d5af-4304-bd9c-664a29bba94a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	572.9322834243926	239.71092602647695	7.9341599259333435	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	cf6fc01a-24fe-455c-8909-49888a3eacc1	39c0da74-eb5c-4690-886e-bed04158e64d	186.04357862295797	211.73528144283344	7.886615360520118	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	2MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b6b437ad-045d-45f7-9ac8-9956805aeed6	39c0da74-eb5c-4690-886e-bed04158e64d	253.40952844561951	230.46193041757496	26.6511534324721	控制面板	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a6fca9b2-7473-4c49-aa0f-4d0aa4a980a6	39c0da74-eb5c-4690-886e-bed04158e64d	264.4658376723165	229.80930101219573	22.380829614363243	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f1b7747d-cf58-4346-ba82-6851aaad0595	39c0da74-eb5c-4690-886e-bed04158e64d	267.2650042775972	229.35443934998062	14.513362730146525	顶部	\N	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6e476b86-56a0-40cb-a81a-86fb3912f774	39c0da74-eb5c-4690-886e-bed04158e64d	195.03369325649388	202.09302940655976	18.810897139200925	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	aabcfd9d-8180-4fa5-9dc2-7f4044007c06	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	554.0217962366264	155.04436499417722	20.858122922317023	机翼外段	\N	\N	\N	\N	静电放电器复材底座	\N	\N	\N	建议更改连接形式	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	43475883-4fb9-41a0-aa52-ab323bcade9a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	622.5416448888228	243.673714059106	-19.241773131652998	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，C类锁紧器，托架下方安装风扇	面搭接	R类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0164952a-4810-4806-8b13-ba8fc891d32a	39c0da74-eb5c-4690-886e-bed04158e64d	226.98556159137593	211.65033618062017	-8.767553190083714	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	26d4e068-b246-4f7e-b3db-a7df776ca944	39c0da74-eb5c-4690-886e-bed04158e64d	191.98582480026212	218.28847426793592	-12.463320199215623	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	03688f32-e6ba-400d-bb74-9627f4e3bafb	39c0da74-eb5c-4690-886e-bed04158e64d	260.5158854351301	223.43533831012485	-17.52712333893913	控制面板	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ca95fc08-9d85-4f02-85c7-f310add5f986	39c0da74-eb5c-4690-886e-bed04158e64d	197.87862421866805	232.01714965571577	-2.7207334413393234	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b89164e5-b504-4dd0-a9d9-8fedd94fd000	39c0da74-eb5c-4690-886e-bed04158e64d	193.1610017760841	225.51469555754858	23.690280126604662	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8b59584a-ad4c-4a2b-a379-13bd9b73e6f3	39c0da74-eb5c-4690-886e-bed04158e64d	220.56989898914452	196.06684896176324	29.317794193625303	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1719f0eb-1418-4b9d-8f19-722a35f84312	39c0da74-eb5c-4690-886e-bed04158e64d	209.49632531511995	213.61765341531594	20.30614481590183	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5e5cf45d-15ad-4331-b15f-f1048bc7db99	39c0da74-eb5c-4690-886e-bed04158e64d	261.10007213959216	209.87148849439353	29.15233110298479	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d7713356-afc5-433b-9613-e7495ee95f47	39c0da74-eb5c-4690-886e-bed04158e64d	262.1476205350402	210.42426877592075	-16.376832327058835	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	24f2c420-9982-4baa-a486-c63987d3322d	39c0da74-eb5c-4690-886e-bed04158e64d	235.60573620564722	217.11526247892837	-0.6199250312122082	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3754214b-1053-411a-bb0b-c9252dff46bc	39c0da74-eb5c-4690-886e-bed04158e64d	192.7991558503387	221.28807016905256	18.537273738426784	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	19e3e232-9e7f-4629-ac14-6e35918d7e69	39c0da74-eb5c-4690-886e-bed04158e64d	214.9205412150318	211.93692206793702	-26.414418695815673	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	807b2260-9b40-4c13-9266-34d9bce16509	39c0da74-eb5c-4690-886e-bed04158e64d	194.87741771699362	231.23428262425992	12.153176799226102	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3d7a2c27-0d7c-4664-9094-b971554e992a	39c0da74-eb5c-4690-886e-bed04158e64d	263.90145841376443	203.4917101703115	-10.001974708939418	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	aa71ab81-e66d-4aeb-baa7-dfbd0dcd54d0	39c0da74-eb5c-4690-886e-bed04158e64d	229.5340639471471	234.11715876802816	17.662754168898857	控制面板	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	501a4a34-f498-4a32-909f-29cb636170ec	39c0da74-eb5c-4690-886e-bed04158e64d	186.13678486217154	208.22184555294325	-27.758523950459846	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ec440b04-68ec-4323-b6ac-f924d6b3bb02	39c0da74-eb5c-4690-886e-bed04158e64d	253.89929695564314	224.47890719478164	5.416216492898876	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3b2ff700-142e-48ef-83da-ecf917dfd69c	39c0da74-eb5c-4690-886e-bed04158e64d	245.3468097876772	219.11456059316717	-19.48635120377896	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	901ab551-3d4f-4123-9003-173070b8e4c2	39c0da74-eb5c-4690-886e-bed04158e64d	239.065377279205	226.5894395153545	-21.22214768594977	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	669c55a8-bf33-4091-98dd-ceb93d933e2c	39c0da74-eb5c-4690-886e-bed04158e64d	275.1122025493041	213.78818930454972	21.439970054733898	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	75d609ea-6735-4e45-8425-7e1c5e283f26	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	587.0826646167355	234.67728401978468	14.473749150361677	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	六角螺栓安装	线搭接	R类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8c08abfc-0e8e-4b59-a56d-bcb371d8d3d0	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	273.78635296566705	89.5595778534496	22.001962375986054	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	957836b3-3f19-4a30-9223-5667f6b4afc1	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	561.0666125228242	218.49059382918085	7.1823326273568355	后设备舱盘箱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	069cb255-137d-4af4-942c-9a008d3e2e91	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	620.4732609044155	233.490588735386	14.947193690223628	后设备舱盘箱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	77ea8529-8214-4479-93d1-4077f1a0470a	39c0da74-eb5c-4690-886e-bed04158e64d	261.4115690844346	232.87319684917554	17.120330827397602	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	3MCU托架安装，A类锁紧器	线搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	695cb5ad-954d-4cf3-8363-92ffc74b12d7	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	548.2845816885828	154.8788597361906	-2.1192493351169546	机翼外段	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	7988f9ed-45aa-4a3c-bcad-4872f4a98a4f	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	571.3405856208681	120.36797916864502	-17.43359981996923	机翼外段	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	704f48ec-3ae7-409c-870b-83a63971dd3f	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	565.5283796742817	133.13016515878286	-25.538265591135204	机翼外段	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ffc2cb35-1056-4451-82aa-c7810ab08d14	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	560.5531260050095	130.69948577963385	-3.771937868305109	机翼外段	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	67b17f78-ab6a-45c5-acd5-da75df6c1f69	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	596.53929837585	153.032076314474	21.38992180307462	中央翼盒	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	63cfaf67-6676-4ece-ab8e-f68aca7f4fc9	79db1b8c-7041-4424-a628-39739cd1db75	13.57792665003086	188.90758024783096	-0.040387379535218315	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	97fc5cff-4840-494d-917d-fefa06476cb7	79db1b8c-7041-4424-a628-39739cd1db75	55.50646000777064	180.93229383808477	-28.52731872924203	外部	\N	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1809a66a-37dc-4304-8725-529157c5ab8b	79db1b8c-7041-4424-a628-39739cd1db75	106.82406357458592	162.98563143931733	-14.336667136595793	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	cfefd2dc-8482-4ddf-a86e-c2b2c639af81	79db1b8c-7041-4424-a628-39739cd1db75	70.16157931525834	188.72009963804317	-14.60411066348107	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	10fa1eff-0a3d-4720-a5c7-e97a9a02236b	39c0da74-eb5c-4690-886e-bed04158e64d	237.65042365792627	204.95679120648586	8.926031009949504	控制面板	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	650667a7-aea0-45c1-8ffa-7732a6651947	27b4b0c3-2fbb-429f-9945-4184450b4a71	646.5644533394959	92.59387721532488	24.368249029111922	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	385a8fcb-2273-4646-8c51-3b7bffb42ee5	27b4b0c3-2fbb-429f-9945-4184450b4a71	649.5411845109304	89.55079203907461	-14.562170193065295	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f1e718ab-8470-4cab-9121-7633169b9fec	27b4b0c3-2fbb-429f-9945-4184450b4a71	673.014794519919	102.44827558134813	-26.364600470949902	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6ddded46-b3f3-4ad4-b231-4dcc9cc51ec2	79db1b8c-7041-4424-a628-39739cd1db75	19.661902870295734	172.8376230772581	-5.302488613810009	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0a39cb2a-3bae-4b14-bba6-4fed248c663c	79db1b8c-7041-4424-a628-39739cd1db75	32.990305080282766	188.1138212107115	-15.000648698129313	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	粘接安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	001e2e63-99ad-4afd-9b11-880de31e3361	39c0da74-eb5c-4690-886e-bed04158e64d	281.3346440494844	207.495933408875	15.648887016715001	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c0f9627f-0926-4cec-9f50-7bdb7418b9a9	39c0da74-eb5c-4690-886e-bed04158e64d	254.2131278719006	221.3313864085093	-13.05132094065598	右设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1480efe5-bb89-4038-b472-bf3f88dea12d	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	286.2524228918706	119.42962827911056	26.804029225519734	前设备舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e86889d5-e732-497a-9660-1c4b980fd60a	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	354.37225397913744	89.84458112423462	16.97409265992868	前设备舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	9e5b1d6f-ede3-46a9-8c63-03729ff3380e	27b4b0c3-2fbb-429f-9945-4184450b4a71	626.8212975624585	111.54078563564241	12.969721156203278	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	94d46a33-3a78-4cf9-88db-ce3c0eecdbf1	27b4b0c3-2fbb-429f-9945-4184450b4a71	714.6110405029259	85.94224847591354	9.256339358669315	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d16fce2e-7296-4860-b5dd-4ec012afe784	27b4b0c3-2fbb-429f-9945-4184450b4a71	646.8709100581162	100.63835754113468	-28.38617973508626	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	538da4b7-8817-4b62-a98d-df1ff1d42505	27b4b0c3-2fbb-429f-9945-4184450b4a71	686.6088485095556	115.01587585026923	-28.886431234133177	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a64b3184-7172-46ed-bf3a-3f9ab3c30969	79db1b8c-7041-4424-a628-39739cd1db75	60.41511516920618	181.83658004822107	16.881561675103455	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	04f5f806-75e4-475a-b51d-cb322a5a6d9e	79db1b8c-7041-4424-a628-39739cd1db75	98.2180764414954	182.13662072834097	-16.71614273551226	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	bb7abee2-9523-4ae7-9c4f-a002660df08c	39c0da74-eb5c-4690-886e-bed04158e64d	195.5233301664063	228.85157055746436	16.603513181147477	地板上	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3c8924d4-03ef-47d3-83be-22891377ac32	39c0da74-eb5c-4690-886e-bed04158e64d	282.933219707742	232.47062515903144	4.584259228021523	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5ff466ee-4105-4fc3-b2c1-639c43a11b29	39c0da74-eb5c-4690-886e-bed04158e64d	227.9791347227573	214.75360129580534	28.94817997433139	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d7007226-4f21-429d-afbf-ed94ceefea66	39c0da74-eb5c-4690-886e-bed04158e64d	281.4854305430922	221.06454203733577	8.107087797472225	顶部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	bb3fc56c-76bd-494d-a7ca-b2d8ccf5f0f9	27b4b0c3-2fbb-429f-9945-4184450b4a71	697.7784167079856	100.92638325306706	-12.710255386707296	主起落架舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	9fdaf6f9-f4a5-4412-93b9-d60a5fa2bd8b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	507.1700822021798	140.6975054303488	-26.535781750976994	机翼外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	af8276d8-ac7a-4218-a03f-e3695508adab	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	583.4410457690938	154.48112005206022	-7.769005448813132	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	7596c827-3493-432b-a84b-f48315379a75	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	552.526622825417	136.92323591424048	-7.526796920715867	机翼外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5a525990-1de0-48cc-95dc-78c24253da53	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	589.3835812116957	146.84318717127286	20.786867799202547	机翼外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	635d85f4-4741-4d48-a482-58fb217f2208	668881a2-a105-4e0d-ba81-aae942960a8e	946.360042523344	191.58654970232703	10.124318050442753	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b0909d0d-8a59-4ddb-b1df-032ab378f36d	668881a2-a105-4e0d-ba81-aae942960a8e	949.5497008755044	200.278521881406	-10.562987837487999	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5c843dc6-e31c-4120-86fa-a8de99eccff5	9228048c-6de1-46ea-a674-6c987557c210	400.6316705480014	208.20073436825214	29.115974770423293	\N	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	81900d04-81e6-450f-8d39-895ad28b6438	9228048c-6de1-46ea-a674-6c987557c210	434.778521271407	174.60524346031755	0.1942851611255172	\N	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d9f04d9c-329c-432e-b306-a6744942b132	39c0da74-eb5c-4690-886e-bed04158e64d	266.09356230502385	204.5774501278537	6.068179108056285	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	925380ec-cd31-4ff1-9446-0875975e1e58	39c0da74-eb5c-4690-886e-bed04158e64d	206.232001671722	207.4433050156328	-20.87073807936467	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b7067f22-fe3f-416a-872c-ae7048c4826f	39c0da74-eb5c-4690-886e-bed04158e64d	261.6475108823214	233.35044583892227	-24.05210526985143	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1909fcff-23cf-4d59-8fbe-f8f35c54664b	79db1b8c-7041-4424-a628-39739cd1db75	34.564032638684296	192.59732390436318	-2.5311087985566516	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	24de86bf-a2a0-4bab-970c-06cceec4e6c9	79db1b8c-7041-4424-a628-39739cd1db75	77.69915210670487	176.532798755035	-4.610856905004159	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8aca1953-2c88-47bb-a776-03bdaa34c4be	79db1b8c-7041-4424-a628-39739cd1db75	68.25269481550313	175.6906995948808	-18.6416155224426	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f97b7ce5-2e0e-4919-846d-b2a08467c731	79db1b8c-7041-4424-a628-39739cd1db75	63.038853779058925	181.5149831223714	15.832375672627663	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	aa813874-eaa8-426c-b293-e8d6a2079624	79db1b8c-7041-4424-a628-39739cd1db75	36.95292641841329	193.8373057291131	14.39416102046637	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	24edad55-612b-49aa-9a14-8c9c8d167632	79db1b8c-7041-4424-a628-39739cd1db75	54.81311717721926	193.60506989055455	25.70478852212512	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2b58d018-ea3f-470c-b396-664a5301bbd8	79db1b8c-7041-4424-a628-39739cd1db75	59.401111699569434	193.65884357652016	-3.30542866945126	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	681850ca-ba18-4be6-b7d4-56a8cc8e5264	79db1b8c-7041-4424-a628-39739cd1db75	35.342657490043166	160.2187377977352	-14.62830315560334	前附件舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f61ab3f2-8b9f-4739-b3c8-67a798dcf728	39c0da74-eb5c-4690-886e-bed04158e64d	245.6451872362441	201.74575759099946	11.33591553920376	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	7961e6b5-d00b-42e0-b440-e3df0f3fbd12	39c0da74-eb5c-4690-886e-bed04158e64d	213.7946273550746	211.98082039487844	-6.3130413813575785	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	16d889c4-748b-42ef-a1bc-aa48a11542e7	668881a2-a105-4e0d-ba81-aae942960a8e	978.5931873216183	173.59332405598587	-10.333601913506119	垂直尾翼	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f8b9698b-13f0-4a0c-9ec4-befba4222db2	668881a2-a105-4e0d-ba81-aae942960a8e	951.723418592907	192.60136871792486	10.344867886637033	垂直尾翼	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	18aaf178-059c-4dd3-8607-60ec26d863f8	39c0da74-eb5c-4690-886e-bed04158e64d	201.78878894655472	208.28872703829202	-22.44127613511456	左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	标准托架安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	43a3828f-b9f8-4cc3-9c4e-c0f1ecd069ef	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	535.0057559971043	239.3766340053626	-20.969164695070837	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4a6330dc-54aa-4502-941a-5ecca30b43b6	79db1b8c-7041-4424-a628-39739cd1db75	30.544833682517694	155.532191277166	-19.270340535639235	雷达舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	aa65930f-304c-4e52-b6c4-062b85a25766	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	531.878008526315	239.98788609876414	27.042156434751575	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	fc6e049d-5609-4808-9f7d-27a9abbf7a2a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	526.5159354470388	221.76541410982594	4.297827310271558	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	A类	\N	\N	\N	选用高度更低的天线	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	29dfaf3c-8d81-4e14-8dec-b334430f74c7	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	543.7602285207162	240.07865457466363	5.395418148612691	后设备舱右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	两角螺栓安装	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	69854094-3a63-43ee-ae98-f6dad96055d3	668881a2-a105-4e0d-ba81-aae942960a8e	983.4860146247679	186.91412991496298	-20.295802096804533	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	832b98c0-92aa-41ba-a780-b53506f485bc	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	592.5937276553157	147.94130165610827	-21.11434605003717	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	安装角度调整	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c32e680f-4b7c-4b7b-949b-96cac4efa432	39c0da74-eb5c-4690-886e-bed04158e64d	206.87267770018062	219.97344075663838	1.5970219193122084	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a6994310-6bd2-4350-b22b-f31bc73f88ab	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	537.8112170697664	230.1670062989638	12.386699809241676	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b1aff6df-38ad-427a-8f5b-ccd53559a2ca	39c0da74-eb5c-4690-886e-bed04158e64d	232.678373350303	212.68977385936037	21.08430326743735	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1cea840f-bf72-437f-8e91-ac8633316a95	dacf6d7d-1e58-46f8-ad30-da511844cfba	565.2656133654028	157.30129212339008	-26.276477871229396	\N	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	75b44e92-48d1-42a2-8f07-48647fc088ce	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	328.4563002684689	108.36618318679587	-9.991161427365732	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	dc931f6f-4820-4ab2-8532-77aa5a48ee38	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	298.0319496541695	106.19174026098892	29.993861131381067	2号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e51bbed1-d8a7-4ca9-b186-909f3a365347	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	324.77564912499776	91.76161923135335	-1.1358102787751854	3号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	42222abb-a04d-4ed3-8aae-04498ef0016d	27b4b0c3-2fbb-429f-9945-4184450b4a71	679.0058904074657	92.6478468722968	7.805911745648231	中设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	cb14ede9-1ced-48e9-9669-4efc0cbd47f2	27b4b0c3-2fbb-429f-9945-4184450b4a71	669.173983401273	102.53841448723264	18.111411292069796	4号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3f336d5a-fe18-4cba-a563-2d8ec8b72a6b	27b4b0c3-2fbb-429f-9945-4184450b4a71	656.8885554721332	110.65283208802461	-7.031746675845191	5号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	9ea7a3c0-7524-4b4f-9ba4-669e015f7553	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	576.9016357287064	233.38362021535937	-15.862037596610916	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	fab18237-9df9-4f1f-87eb-d3e584456607	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	587.6622840402258	230.3519762435231	-3.6782168596391536	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ccd3c921-bea4-48e1-8d01-6c9f961e384e	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	558.3017258366776	206.80713994019936	-22.799075219757842	地板上	\N	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	11d9b0d4-f7cb-4b86-a6cd-5194dbe3c70b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	534.5542395688808	231.42151671931725	-16.684227748413456	地板上	\N	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	33e79ced-e1fa-448a-b788-0ec683c1e230	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	588.3188444470495	215.31271045598137	19.84763571774465	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	87f90282-b1b3-4d47-b624-d493e4b76acc	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	564.4846133060481	233.01548156737834	22.816964916777323	地板上	\N	\N	\N	\N	C类，28V负极在机身部分通过ERN回流；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	23a54d79-f401-4c1b-92f0-44f9a0e15221	39c0da74-eb5c-4690-886e-bed04158e64d	266.3329282215951	198.1527442208531	-29.729233841398262	顶部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0ad75d3f-f3ea-49f0-84f3-35811c130c0d	39c0da74-eb5c-4690-886e-bed04158e64d	264.72925014385646	221.3509384240868	0.6347000201151971	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f55865a1-be79-4077-bb60-751803642a21	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	320.9238753912513	103.60922109607105	27.785440859510743	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1ddcd47b-e5fe-40a2-8f5f-667395943b20	39c0da74-eb5c-4690-886e-bed04158e64d	253.88626937573903	225.20162025583465	29.8346563054968	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8e92cab8-4e65-436b-9d46-a5ff3092d892	39c0da74-eb5c-4690-886e-bed04158e64d	247.4164046640461	225.22182541644798	-4.010320037370651	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	88e249b3-78e3-40ab-94ae-d564f491aff9	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	557.431691708641	242.0584744421596	-5.826958214459339	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c0caa398-52cb-4c14-9b20-b83ab759417d	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	323.7779153635975	105.69826318575493	5.4252206801807645	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e9d1e779-29c4-4497-883b-39e85653dbca	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	350.125183765361	108.43968389431276	0.5061171026253284	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ff91f03b-bda7-4dce-a724-fc19347ab905	39c0da74-eb5c-4690-886e-bed04158e64d	284.3720092401641	219.30462739960117	8.690303164529539	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1dc3e37f-06ed-4ba8-8c3f-5986ce136723	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	611.516791691056	213.37195431324838	-20.645162571951865	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b205532a-53b5-4761-85b3-bffb7a1724da	39c0da74-eb5c-4690-886e-bed04158e64d	278.3512500296851	208.24886046008746	-0.18671440546725648	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	618f8032-89e4-4a43-96d4-0f02bcd774dd	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	296.30469181424263	114.7979177954843	22.43531648081322	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	965e5e0b-fd40-4928-b074-599dd52c1fce	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	273.615871436392	97.45582716558343	23.16494399969978	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	81d2c6c2-fdc1-4ac3-8664-9e4afc8b1404	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	332.30041236777635	114.20578065035252	8.72600196159528	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	更改为尺寸更小的天线	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4637911b-63b5-4304-b6e3-581fa0121a55	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	330.27221574596945	116.75157594287161	-9.209755825788214	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	cfffc6ac-9970-4760-b0bc-8b6ce4639865	dacf6d7d-1e58-46f8-ad30-da511844cfba	522.5458411500002	156.11934082694802	-26.290150912862728	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	607fca65-3eae-4e21-b291-0d1ed76e7baf	dacf6d7d-1e58-46f8-ad30-da511844cfba	541.7635905338072	149.09766290408916	29.995459593728945	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a9590033-dc81-4c14-8f71-db29f120d2e9	dacf6d7d-1e58-46f8-ad30-da511844cfba	590.2807423379097	150.05017423055654	5.3010269756938655	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4c6a0811-bd55-4843-92a8-ef92c75b7e00	dacf6d7d-1e58-46f8-ad30-da511844cfba	585.7619428797295	160.32427489703974	26.83004901858242	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	9a27f5c3-cd23-497d-b7d7-ae156ba27d6b	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	283.1711096345403	94.09644625236362	11.655753119061728	前设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3004d9f8-be5e-4d36-83f7-1f90885e95ac	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	598.8579413900105	142.36659180540568	27.880118289726973	机翼外段	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	建议减小体积，优化设备连接器	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	7f9fb225-71ea-4fa3-871f-5d05e6d96879	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	517.9893273433514	157.78151630521464	19.178044800758677	机翼外段	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	建议减小体积，优化设备连接器	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0871bc9a-b530-45e8-a543-9b31939bbec3	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	548.4502716853823	242.39815875413348	-25.512718699372517	后设备舱右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	dbb50dbf-0e35-4341-a245-992e89321ddd	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	519.8917576160275	127.85874291253056	-11.056402165117238	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0f112854-df48-426b-ac9e-57bbb96ffb80	27b4b0c3-2fbb-429f-9945-4184450b4a71	636.5874636921639	100.76725249072332	17.12389148777641	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	11ab49bc-fbd3-48fa-9fcf-b93d96511cc4	79db1b8c-7041-4424-a628-39739cd1db75	74.36067932123538	158.85065460045323	-9.75050387046625	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3067d501-5849-4c52-b327-036a499a6afa	27b4b0c3-2fbb-429f-9945-4184450b4a71	679.7399750916536	97.76559279722491	6.127361017440812	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	662fd3bf-513a-4129-890d-f2e60e85f322	79db1b8c-7041-4424-a628-39739cd1db75	90.5396285122415	157.37286031761562	-5.2569154827129765	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6bd67ecd-991e-43a2-ab4c-732246ca2651	27b4b0c3-2fbb-429f-9945-4184450b4a71	716.1529645497071	90.944981633161	-11.008456709870636	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	881876f4-ec7e-4ea7-8100-da658a560ea4	27b4b0c3-2fbb-429f-9945-4184450b4a71	700.8478065036995	107.95545217988743	-22.037355548721678	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a68dbe5d-1d98-4774-ad6e-896fd71eaf72	79db1b8c-7041-4424-a628-39739cd1db75	99.80884287028908	156.5295098524701	-23.940737840842637	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d019e488-269d-45f4-a7ce-1816dcaed895	79db1b8c-7041-4424-a628-39739cd1db75	58.30103382540586	189.5216112884402	-18.652626515098046	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e63e5a1b-cc96-4c72-8f38-81f7ef480697	27b4b0c3-2fbb-429f-9945-4184450b4a71	684.957135574205	112.03246716970779	21.94115837066615	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d73f7589-cf7c-4abc-97e8-93ddd0d1d848	27b4b0c3-2fbb-429f-9945-4184450b4a71	672.8123540016413	97.84682375557918	13.063842087322307	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	dcf0f33f-fd3e-4f9e-93b4-bc86e25271d4	79db1b8c-7041-4424-a628-39739cd1db75	71.48822202387348	165.34563774849678	-19.70062843181235	前起落架舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	dd3e0816-6c39-4c1c-a182-a29c1c27475c	79db1b8c-7041-4424-a628-39739cd1db75	86.2266116632785	155.47042212433476	20.360118828319877	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ee777963-6726-4c2a-9956-c1117142d1e2	27b4b0c3-2fbb-429f-9945-4184450b4a71	666.3011194335288	85.90638814870881	-22.100898697668946	主起落架舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	faa5ce74-b993-4d5b-8c26-9c72623651d1	27b4b0c3-2fbb-429f-9945-4184450b4a71	697.0029824297718	118.59400691411038	-24.660835600404464	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4689163d-a76c-4222-9381-00125cd79e8c	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	513.5483651802675	124.03856762127785	-11.290427374767596	机翼外部	\N	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8d2e1f3b-4f46-4f84-9f93-7465f739a2e2	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	500.1044432259122	126.51833038404281	-19.463315495632973	机翼外部	\N	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	fa4a3d52-8f03-4d36-a160-7eb066b2f00b	39c0da74-eb5c-4690-886e-bed04158e64d	259.4934672531898	217.28573514273887	-16.20692158284337	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	90fdb9ea-1c19-4d75-af62-ffcee44ae5c6	39c0da74-eb5c-4690-886e-bed04158e64d	206.64489098395808	222.82961571391778	-16.328259301546353	左设备架	\N	\N	标准托架安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	394f583b-a892-4241-a46e-f6defc48a3bd	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	602.1212467732308	240.85179847609635	-20.23228796115689	外部	\N	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	03e0d842-ce48-450d-a422-3bd8c57bc8bc	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	283.6449179426325	115.51040873610323	-20.392964418889648	外部	\N	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f70fce0c-92c8-4f93-8156-3fb9f80946ec	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	580.6746296852957	223.19292764223366	9.652770361856128	后设备舱右设备架	\N	\N	2MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	9cfc825b-5366-4da3-9eee-0372bd71f085	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.8691714087958	223.88709881231534	29.62958597713194	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0b0f3f44-ba70-4b00-b998-d363b92a0f54	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	544.3652439438324	222.90826784413318	7.852477686685582	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2242ba2b-8ae5-41d8-8583-d0ff6345274d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	549.8106885008718	219.1657478064353	-4.755299457442931	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	41a3a168-863c-4bb7-b638-d728801fdca7	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	269.0956686864634	97.85176808131838	-8.470393176882919	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	69b68972-e695-42f2-a584-e83cd7ec4984	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	535.530131696311	207.6587585299607	-21.923620546406976	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d8216ddc-40b1-4f75-84ae-b677def29015	27b4b0c3-2fbb-429f-9945-4184450b4a71	633.9396457730567	89.9362965323041	22.512205690641544	中设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	053abee4-0698-4072-b75f-46c3a2b67b4a	1ff1548b-395b-49be-a6c6-a9e8b7fec947	450.298613923545	130.33065377634904	5.233819677894431	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2ac1d2da-e51e-4b60-8386-4bde9ae88f1e	1ff1548b-395b-49be-a6c6-a9e8b7fec947	454.81399736089054	128.80660521888743	23.13003649660027	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	31f3eb99-b52f-442f-9c93-da9242674a31	1ff1548b-395b-49be-a6c6-a9e8b7fec947	478.5754214765601	128.05252424094027	-11.800500898559058	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4d0b4b83-716a-4c0d-b4d5-5e705048f8ca	1ff1548b-395b-49be-a6c6-a9e8b7fec947	490.7644418489467	111.86497217168994	-0.685633364943623	2号短舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	660b795a-7fe8-4963-83c7-c9ae3ef0e61d	1ff1548b-395b-49be-a6c6-a9e8b7fec947	534.7787331761908	126.39549672761453	-2.6173030511415334	2号短舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6946b7e3-b04b-41ff-8247-0ae3e3deba14	1ff1548b-395b-49be-a6c6-a9e8b7fec947	474.65781114374494	98.7139296224257	2.9512018352626654	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	87cd84b2-4f89-431b-9493-bf83aeaa07c0	1ff1548b-395b-49be-a6c6-a9e8b7fec947	466.6194686651321	130.5901516521928	2.3754386618877206	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	96824614-3718-4267-a9bd-88676ce028fa	1ff1548b-395b-49be-a6c6-a9e8b7fec947	464.4908272801581	107.00125130429946	5.849754258586209	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	9c627aff-81c5-49a7-b0e7-42138856f165	1ff1548b-395b-49be-a6c6-a9e8b7fec947	544.0987119345122	98.54824161902428	19.945869560415787	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a1b2f301-4d3e-451a-84be-7e1cf01e3421	1ff1548b-395b-49be-a6c6-a9e8b7fec947	542.957691242635	112.71363397415122	3.711048047970259	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ce4cf040-fd86-4700-a7c0-f7021fce2b5c	1ff1548b-395b-49be-a6c6-a9e8b7fec947	506.41098833928834	131.73674923498464	-15.704116570116556	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e8bbf27d-4b02-4cb5-87fb-21630f450c85	1ff1548b-395b-49be-a6c6-a9e8b7fec947	538.1288154506002	97.03598268341943	-29.782332807326668	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e87e7012-682d-42da-afa4-b09d3d29d4af	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	551.2732937375836	221.02068140286065	2.0180625676293715	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	551a5a6a-195e-4db4-916d-69635c8ece76	dacf6d7d-1e58-46f8-ad30-da511844cfba	575.9854584798665	141.01340463597649	19.725768241547698	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8f1e9383-56f2-499d-a896-5b1a22be5e98	79db1b8c-7041-4424-a628-39739cd1db75	83.93106036441998	164.5091389869372	-21.77814815481362	前起落架舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3e2409ca-018f-4eec-83b9-6cd8a6b4dc94	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	623.2422898379954	239.94495947434163	5.236925550507095	后设备舱右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d14f9046-a803-4928-9534-57de722593c8	dacf6d7d-1e58-46f8-ad30-da511844cfba	508.236661926822	153.17370734314088	27.835953363457833	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e2b7382d-4795-4175-9165-85926e956486	dacf6d7d-1e58-46f8-ad30-da511844cfba	520.5456916549525	147.72886426940218	-28.434996193188233	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ec281aff-e7a4-4bfc-a845-e9d33519e36d	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	508.38737816125814	123.98476589845933	-18.622479923093636	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	安装角度调整	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ec589b04-4108-4095-b955-48ba73162d3d	39c0da74-eb5c-4690-886e-bed04158e64d	209.5607430862599	198.64228732180692	-10.110173474411202	右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	非标托架，C类锁紧器	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	05fe5a5e-86e1-4782-8b50-85364c51320a	39c0da74-eb5c-4690-886e-bed04158e64d	249.29281236166366	230.36193996649325	-18.862822221900046	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	2MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4a6c4183-0e81-4c9b-bbd9-1be9e9ae7dea	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	581.9584838118068	241.20127425060497	-22.47785030832695	后设备舱右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	非标准托架安装	线搭接	C类	\N	\N	\N	建议改成推拉式托架形式	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a3a4610a-f956-4b7e-be18-6212d74eb05f	39c0da74-eb5c-4690-886e-bed04158e64d	244.1034346650971	203.02099942843748	25.716636844744592	左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	eadc600f-53ea-4b4c-b954-712bb5bfe17c	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	576.3184642739127	158.1447071136588	-6.457780181425992	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330搭接线	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c7277938-188a-48c9-ba0e-f08d2156a100	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	320.89453937025996	105.15356003077618	0.46760454319808886	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	799bbd94-6e70-4449-a4cd-4c106653c7b3	39c0da74-eb5c-4690-886e-bed04158e64d	245.1843370574814	214.65535551728263	-7.116942994977379	左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	非标准托架安装	线搭接	C类	\N	\N	\N	减小设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	66c2b44b-0e1b-438e-a99f-f53684c902e7	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.609645236749	230.75384321123778	-26.13356954269242	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-螺栓螺母安装	线搭接	S类	\N	\N	\N	增加红光防撞灯固定底座	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e375d76e-c09c-45f3-bb3b-6b43b6e6b7ce	79db1b8c-7041-4424-a628-39739cd1db75	84.58355725992695	166.40408232158543	-26.077924480478195	前起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	272e7215-7f69-4954-9e41-46f1eb35788d	79db1b8c-7041-4424-a628-39739cd1db75	12.988430931958632	187.85170890843872	15.340591876273173	前附件舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2d6d0f13-5ff5-4044-aa23-0af4b2c6c52c	39c0da74-eb5c-4690-886e-bed04158e64d	217.27305718965064	214.93068812533278	11.828618643488504	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	321ad9fd-0ebd-4b8e-8c49-c76529e22abb	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	591.8181060374905	222.43522944762512	21.12974806652408	后设备舱右设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	3MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	56c2dabd-ffa6-4c07-98a0-9fb73715e83b	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	315.8716217074119	97.86902373283723	16.52248433389726	前设备舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	标准托架安装	线搭接	\N	\N	\N	\N	改成标准ARINC600，建议缩小体积	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6035443e-99da-4c68-ac6d-694baa6c3daf	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	613.4933388199787	234.6102425831783	23.44227516575735	后设备舱左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	非标准托架安装	线搭接	C类	\N	\N	\N	建议改成推拉式托架形式	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c983012b-514c-4b48-af97-3f7344a1ac2d	39c0da74-eb5c-4690-886e-bed04158e64d	243.48614816460594	218.41733717544304	24.599604486518317	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d3a95ede-6378-40ad-9316-422a9750e214	79db1b8c-7041-4424-a628-39739cd1db75	107.75543004889067	184.60656189844966	9.70580085498819	前附件舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e600b367-8f84-4d95-ad42-96afa4cfb9dd	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	349.549985982904	82.63014877900994	-8.794764575662974	前设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	标准托架安装	线搭接	\N	\N	\N	\N	改成标准ARINC600，建议缩小体积	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8ed8b7ec-c487-40aa-aaab-3340cdb71621	39c0da74-eb5c-4690-886e-bed04158e64d	213.10019277115492	197.24576095849778	18.313743330874914	左设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	非标准托架安装	线搭接	C类	\N	\N	\N	减小设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	be1aad53-d2c4-4407-87dc-317a81bfed71	39c0da74-eb5c-4690-886e-bed04158e64d	209.1470124621938	232.49708681206613	-25.941894583004782	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e632fb91-bc56-454e-a5be-f2057f984669	39c0da74-eb5c-4690-886e-bed04158e64d	214.55632057790106	214.73225834112367	-25.74677296648815	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	eddb07a0-7e70-4185-a399-fd57b0360365	39c0da74-eb5c-4690-886e-bed04158e64d	239.5581439067377	199.11949659221838	-15.43248339378408	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	0bf86a96-c097-4533-99d4-58e51b33328b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	502.45719729257536	156.23142954454647	16.77043805231243	中央翼盒	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类	\N	\N	\N	减小设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2074a91a-9c58-4886-826a-cab4fa9c8921	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	548.8819398030851	129.9770003356163	-8.588173270888337	机翼外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	线搭接	S类	\N	\N	\N	增加白光防撞灯固定底座	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b3b321a1-ecca-4407-91b0-8240e914593b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	540.9622280232812	147.1152733303697	20.81682718151675	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	124f1c0e-c7d5-4529-b729-0e6f9c163e9d	668881a2-a105-4e0d-ba81-aae942960a8e	1022.6028345861074	198.66807942662666	12.411594830417535	垂直尾翼	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	609ff014-4e7a-4b52-820d-70d0643054ba	668881a2-a105-4e0d-ba81-aae942960a8e	996.0475197956687	203.68660372109463	17.832234399460788	水平尾翼	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	838017f2-5656-44bb-873a-ee3e8114141d	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	590.6105378071709	140.6865779613837	28.056980214067053	机翼外段	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	308dad5a-ce5e-45c0-a4d9-ccf869c4e874	39c0da74-eb5c-4690-886e-bed04158e64d	272.8065658009308	202.34692196677034	-26.546077219925273	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b8766393-40b7-406b-a18c-d2a13f1f2e57	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	541.2429307332338	225.27137342749268	-0.6109447218227189	后设备舱右设备架	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	面搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c6e08321-7690-4ca3-961f-025888f915b3	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	348.2723533346255	116.80960248239214	19.828871412513763	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f1efdd80-24ef-4363-83c7-85da0a3f8fe4	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	563.6556072989794	243.5848973399896	-22.405043180746716	后设备舱右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	面搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	ae39aa76-ecd7-4e51-a3d1-7c43090402f9	39c0da74-eb5c-4690-886e-bed04158e64d	221.1206011140108	206.07456472012427	6.635031392824054	右设备架	\N	\N	紧固件-螺栓螺母安装	面搭接	C类	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2c8c347f-2140-4e3e-819e-c21df7259402	39c0da74-eb5c-4690-886e-bed04158e64d	235.71676556515524	234.01665648142296	20.992325118018073	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6fdbb16f-35d9-485c-9216-6774f0684d8c	39c0da74-eb5c-4690-886e-bed04158e64d	239.91627564441112	233.57208037834945	-11.132604527987496	地板上	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	890c2523-4adc-47ed-8f21-961a0a815b33	27b4b0c3-2fbb-429f-9945-4184450b4a71	659.588402807582	117.19284275791398	9.436418681006607	主起落架舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a1dae93d-b8e6-4cfc-a25b-fedaf6b3cfc5	27b4b0c3-2fbb-429f-9945-4184450b4a71	693.0872422265032	115.77125386439678	0.9339634561218801	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	181449ec-a06d-46d5-b5ba-8ccf06bd425f	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	314.1289370761357	106.02596413283726	-22.754661237121883	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6e0ca76a-dbfb-4902-9f24-e43ec75e48de	27b4b0c3-2fbb-429f-9945-4184450b4a71	692.5837148572443	115.80667431530675	-15.482541042769407	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8374e76d-fca2-4bc9-94e7-61b8721ee94a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.689063067856	221.8018088664602	11.538643108715732	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b64537f4-8c11-4d97-a69b-2e1166979199	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	575.1417715048777	244.100586327616	24.806241663696163	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e2a8449d-718c-426d-ba6d-aa5879a54694	668881a2-a105-4e0d-ba81-aae942960a8e	936.0275706939824	191.67470435682452	25.079138256739185	垂直尾翼	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	e448eb31-370a-43de-a5f6-07a999e589af	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	359.89169405671345	85.89672480903077	17.90649026290876	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	78a01034-9fbf-443f-a193-7aed540cd97a	39c0da74-eb5c-4690-886e-bed04158e64d	235.37577281243944	219.02985768460815	-4.316603731290883	左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	三角螺栓安装	面搭接	CPS1330	\N	\N	\N	建议调整为压接连接器	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	82d26b07-ac4f-42e7-b560-f666e34c2c0a	39c0da74-eb5c-4690-886e-bed04158e64d	219.96952967750408	209.41187287684062	13.224302472935477	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	三角螺栓安装	面搭接	CPS1330	\N	\N	\N	建议调整为压接连接器	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	35f40f9f-c1c3-4dd4-a75b-c38530fdc808	79db1b8c-7041-4424-a628-39739cd1db75	82.56412982216197	156.74883963446422	1.9277001966686989	前起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	CPS1331，设备壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	95f8fcf9-dfa5-496e-95a4-1cc204b488a8	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	347.10081864044594	104.33780958625344	-22.080831093922136	前设备舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	db3eec35-d082-45f5-b88c-662e141ada3b	27b4b0c3-2fbb-429f-9945-4184450b4a71	644.0295155125511	109.53147099066989	-13.614045272783514	主起落架舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	60368506-db53-4a47-a95d-c3945a9411ee	79db1b8c-7041-4424-a628-39739cd1db75	83.23323934268704	187.5771711324238	1.1594030498678194	前起落架舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	CPS1330，设备壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f2ecd438-cfbc-4d47-8911-de904bdbe87c	79db1b8c-7041-4424-a628-39739cd1db75	45.20644503589787	174.08186591179245	-0.5550226868235981	前起落架舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3f246d7f-fb50-4738-9951-55f78b7d8124	27b4b0c3-2fbb-429f-9945-4184450b4a71	696.1337005306411	106.17614363814508	-20.4955864343504	主起落架舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	f4baca8f-fc97-42ee-8e7c-9e8384ffea2e	27b4b0c3-2fbb-429f-9945-4184450b4a71	670.8960055623988	84.576776462466	8.43114568361004	主起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4c493c59-f2c3-40d5-840f-3c775da83ab3	1ff1548b-395b-49be-a6c6-a9e8b7fec947	498.6797734100965	123.5130818019055	14.038347076280822	1号短舱（机翼内侧）	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类，28V负极在机身部分通过ERN回流；\nR类、H类、S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6d91e335-b44e-4928-b37d-6dc4aea90822	27b4b0c3-2fbb-429f-9945-4184450b4a71	626.6569014461659	81.47457164754063	-15.830874597931292	中设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	b8fbc68a-0401-4d91-a7e5-72137d7070d1	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	263.27514854052646	85.14267316143271	-2.6847033267906113	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	bb57baa7-e178-43d4-84e1-9dc7c73a95ea	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	306.5310855136836	102.25752975393219	-12.935762641762203	前设备舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d87dd885-204b-4088-ad97-449cff1d3596	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	356.32700276528385	90.18333119275844	-19.358355689897436	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	3e1d143c-30c7-482b-aa93-874cc83155c5	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	356.90204307727566	82.04779672003495	-29.635729024814236	前设备舱	\N	\N	\N	\N	无需求	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5e463e2f-7daa-422e-8eef-0df56eaa629c	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	284.19768902331487	101.88159608012194	18.30264149995231	前设备舱	\N	\N	\N	\N	无需求	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	2f9d8862-798e-4881-babf-034301d2d432	39c0da74-eb5c-4690-886e-bed04158e64d	269.64979249982514	202.6900206817645	-4.0464969776535185	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	32fa0895-6be5-47b2-a0db-ea1f1f45dc3e	39c0da74-eb5c-4690-886e-bed04158e64d	279.34194279245264	232.60123658380195	28.000860846665567	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	CPS1330壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	4086a3de-eb3f-4e90-a97e-f515eaf13d97	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	597.048731151173	205.10236756834598	-24.67417174621003	后设备舱左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	线搭接	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	962509cd-50bc-4781-a07e-67c9810d649b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	589.2571969671059	213.60773480001203	-14.206354225798062	后设备舱盘箱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	99b49e0b-9f8c-4df5-9909-7d2e336c8108	39c0da74-eb5c-4690-886e-bed04158e64d	270.3523085510875	222.8476643118049	-4.370042299256109	右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	四角螺栓安装	线搭接	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	a52471a6-739b-4943-8668-8f55e6632753	39c0da74-eb5c-4690-886e-bed04158e64d	236.9500745496863	204.55046595984427	8.302115782940817	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	12a47dbf-ea2a-4928-96fa-dc56b3c1ce35	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	602.093940623309	207.00100948189834	-7.840144085016622	后设备舱左设备架	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	15e50bff-bb76-457d-931a-ad7bd482d130	39c0da74-eb5c-4690-886e-bed04158e64d	217.71078440678258	211.26494855893776	16.07676821841421	左设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5950dcbc-5e13-4dbc-b7e3-09ab82a8750f	39c0da74-eb5c-4690-886e-bed04158e64d	257.15318253345987	208.0964322605206	-18.75619741800848	右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	83cf0b00-ec68-45a0-a724-8b565d162342	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	585.9371209444623	234.18650876808806	26.821169517481593	后设备舱右设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	5afc64af-2c92-4b60-9a98-2d148a79c6a6	39c0da74-eb5c-4690-886e-bed04158e64d	241.9516769838807	203.03997793015103	-22.9868470301003	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	1c50a573-ae1f-4782-bb90-81f8dd598ca2	39c0da74-eb5c-4690-886e-bed04158e64d	218.70391915747626	198.13873415735617	-8.514583947713831	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	48436bf1-4dab-4278-9850-cec39c073dd3	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	547.5474129392678	137.577886816231	1.6261501779002572	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	74da3049-7989-4fa0-952b-749234b9da02	39c0da74-eb5c-4690-886e-bed04158e64d	231.44379233542722	197.09515928657999	-3.3204485595106945	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	82d81c8a-fc3c-4362-8214-b962d9d00f94	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	567.1687848134533	124.24967233045902	3.204759735322696	中央翼盒	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	CPS1330	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	8c23589d-5f8f-4525-bdc0-920f1ab2c533	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	350.7475723556104	89.47514404628473	-10.003289867303685	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330搭接线	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	d26d0aa5-be7e-44d5-bafd-b3da2026be3c	39c0da74-eb5c-4690-886e-bed04158e64d	233.9456594699135	198.67246413201667	-22.041570738650883	\N	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	df446f5f-9e07-4aae-a38b-fb5e9aef3b29	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	585.3780925443197	242.06931983400875	2.364957560118647	后设备舱左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	四角螺栓安装	面搭接	S类	\N	\N	\N	需改为标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	fa2e4d12-8395-4eea-864f-a48e4c6dc1f5	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	300.9107203630587	94.39793290289404	-23.585384455841684	前设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	049f7c9a-5639-4284-b964-c47dd8f68f2a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	608.5951274827587	217.21156148476163	29.577402349476287	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	068f8a07-1907-46a1-b93d-4c7098bd90ab	39c0da74-eb5c-4690-886e-bed04158e64d	274.7956207671108	227.92950110401378	9.440313406597895	左设备架	\N	\N	四角螺栓安装	线搭接	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	438c3120-36ee-4580-9758-3597f62fd65d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	566.6747310544399	233.4900151378191	-23.57803621038891	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	536594a1-7a7a-4e64-b837-b0eeed3dec17	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	549.2077647744061	230.18019312668073	-9.905455585240848	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	6edfca52-fd98-4c53-94d8-14f81d0df193	39c0da74-eb5c-4690-886e-bed04158e64d	246.2191779139339	220.20514641951866	-0.19758358897644968	左设备架	\N	\N	四角螺栓安装	线搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为国军标441尺寸机箱	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	c44bca34-5667-427c-8bb4-d5440587679d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	529.911420179558	243.14830538914381	-23.653446033701446	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
67ffbbe0-1b90-4694-be64-0505c5dde861	fd7671f0-2299-43ec-9aa1-77e4c7bbca5b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	552.3707198669401	244.88920552208913	-2.914941230220901	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1c4ca146-747e-4ef9-80ef-50b5bc183314	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	560.656122660773	218.0117812336478	-4.710160998016505	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	28068af6-d5af-4304-bd9c-664a29bba94a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	572.9322834243926	239.71092602647695	7.9341599259333435	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	cf6fc01a-24fe-455c-8909-49888a3eacc1	39c0da74-eb5c-4690-886e-bed04158e64d	186.04357862295797	211.73528144283344	7.886615360520118	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	2MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b6b437ad-045d-45f7-9ac8-9956805aeed6	39c0da74-eb5c-4690-886e-bed04158e64d	253.40952844561951	230.46193041757496	26.6511534324721	控制面板	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a6fca9b2-7473-4c49-aa0f-4d0aa4a980a6	39c0da74-eb5c-4690-886e-bed04158e64d	264.4658376723165	229.80930101219573	22.380829614363243	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f1b7747d-cf58-4346-ba82-6851aaad0595	39c0da74-eb5c-4690-886e-bed04158e64d	267.2650042775972	229.35443934998062	14.513362730146525	顶部	\N	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6e476b86-56a0-40cb-a81a-86fb3912f774	39c0da74-eb5c-4690-886e-bed04158e64d	195.03369325649388	202.09302940655976	18.810897139200925	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	aabcfd9d-8180-4fa5-9dc2-7f4044007c06	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	554.0217962366264	155.04436499417722	20.858122922317023	机翼外段	\N	\N	\N	\N	静电放电器复材底座	\N	\N	\N	建议更改连接形式	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	43475883-4fb9-41a0-aa52-ab323bcade9a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	622.5416448888228	243.673714059106	-19.241773131652998	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，C类锁紧器，托架下方安装风扇	面搭接	R类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0164952a-4810-4806-8b13-ba8fc891d32a	39c0da74-eb5c-4690-886e-bed04158e64d	226.98556159137593	211.65033618062017	-8.767553190083714	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	26d4e068-b246-4f7e-b3db-a7df776ca944	39c0da74-eb5c-4690-886e-bed04158e64d	191.98582480026212	218.28847426793592	-12.463320199215623	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	03688f32-e6ba-400d-bb74-9627f4e3bafb	39c0da74-eb5c-4690-886e-bed04158e64d	260.5158854351301	223.43533831012485	-17.52712333893913	控制面板	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ca95fc08-9d85-4f02-85c7-f310add5f986	39c0da74-eb5c-4690-886e-bed04158e64d	197.87862421866805	232.01714965571577	-2.7207334413393234	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b89164e5-b504-4dd0-a9d9-8fedd94fd000	39c0da74-eb5c-4690-886e-bed04158e64d	193.1610017760841	225.51469555754858	23.690280126604662	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8b59584a-ad4c-4a2b-a379-13bd9b73e6f3	39c0da74-eb5c-4690-886e-bed04158e64d	220.56989898914452	196.06684896176324	29.317794193625303	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1719f0eb-1418-4b9d-8f19-722a35f84312	39c0da74-eb5c-4690-886e-bed04158e64d	209.49632531511995	213.61765341531594	20.30614481590183	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5e5cf45d-15ad-4331-b15f-f1048bc7db99	39c0da74-eb5c-4690-886e-bed04158e64d	261.10007213959216	209.87148849439353	29.15233110298479	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d7713356-afc5-433b-9613-e7495ee95f47	39c0da74-eb5c-4690-886e-bed04158e64d	262.1476205350402	210.42426877592075	-16.376832327058835	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	24f2c420-9982-4baa-a486-c63987d3322d	39c0da74-eb5c-4690-886e-bed04158e64d	235.60573620564722	217.11526247892837	-0.6199250312122082	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3754214b-1053-411a-bb0b-c9252dff46bc	39c0da74-eb5c-4690-886e-bed04158e64d	192.7991558503387	221.28807016905256	18.537273738426784	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	19e3e232-9e7f-4629-ac14-6e35918d7e69	39c0da74-eb5c-4690-886e-bed04158e64d	214.9205412150318	211.93692206793702	-26.414418695815673	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	807b2260-9b40-4c13-9266-34d9bce16509	39c0da74-eb5c-4690-886e-bed04158e64d	194.87741771699362	231.23428262425992	12.153176799226102	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3d7a2c27-0d7c-4664-9094-b971554e992a	39c0da74-eb5c-4690-886e-bed04158e64d	263.90145841376443	203.4917101703115	-10.001974708939418	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	aa71ab81-e66d-4aeb-baa7-dfbd0dcd54d0	39c0da74-eb5c-4690-886e-bed04158e64d	229.5340639471471	234.11715876802816	17.662754168898857	控制面板	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	501a4a34-f498-4a32-909f-29cb636170ec	39c0da74-eb5c-4690-886e-bed04158e64d	186.13678486217154	208.22184555294325	-27.758523950459846	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ec440b04-68ec-4323-b6ac-f924d6b3bb02	39c0da74-eb5c-4690-886e-bed04158e64d	253.89929695564314	224.47890719478164	5.416216492898876	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3b2ff700-142e-48ef-83da-ecf917dfd69c	39c0da74-eb5c-4690-886e-bed04158e64d	245.3468097876772	219.11456059316717	-19.48635120377896	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	901ab551-3d4f-4123-9003-173070b8e4c2	39c0da74-eb5c-4690-886e-bed04158e64d	239.065377279205	226.5894395153545	-21.22214768594977	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	669c55a8-bf33-4091-98dd-ceb93d933e2c	39c0da74-eb5c-4690-886e-bed04158e64d	275.1122025493041	213.78818930454972	21.439970054733898	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	75d609ea-6735-4e45-8425-7e1c5e283f26	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	587.0826646167355	234.67728401978468	14.473749150361677	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	六角螺栓安装	线搭接	R类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8c08abfc-0e8e-4b59-a56d-bcb371d8d3d0	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	273.78635296566705	89.5595778534496	22.001962375986054	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	957836b3-3f19-4a30-9223-5667f6b4afc1	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	561.0666125228242	218.49059382918085	7.1823326273568355	后设备舱盘箱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	069cb255-137d-4af4-942c-9a008d3e2e91	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	620.4732609044155	233.490588735386	14.947193690223628	后设备舱盘箱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	77ea8529-8214-4479-93d1-4077f1a0470a	39c0da74-eb5c-4690-886e-bed04158e64d	261.4115690844346	232.87319684917554	17.120330827397602	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	3MCU托架安装，A类锁紧器	线搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	695cb5ad-954d-4cf3-8363-92ffc74b12d7	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	548.2845816885828	154.8788597361906	-2.1192493351169546	机翼外段	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	7988f9ed-45aa-4a3c-bcad-4872f4a98a4f	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	571.3405856208681	120.36797916864502	-17.43359981996923	机翼外段	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	704f48ec-3ae7-409c-870b-83a63971dd3f	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	565.5283796742817	133.13016515878286	-25.538265591135204	机翼外段	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ffc2cb35-1056-4451-82aa-c7810ab08d14	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	560.5531260050095	130.69948577963385	-3.771937868305109	机翼外段	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	67b17f78-ab6a-45c5-acd5-da75df6c1f69	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	596.53929837585	153.032076314474	21.38992180307462	中央翼盒	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	63cfaf67-6676-4ece-ab8e-f68aca7f4fc9	79db1b8c-7041-4424-a628-39739cd1db75	13.57792665003086	188.90758024783096	-0.040387379535218315	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	97fc5cff-4840-494d-917d-fefa06476cb7	79db1b8c-7041-4424-a628-39739cd1db75	55.50646000777064	180.93229383808477	-28.52731872924203	外部	\N	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1809a66a-37dc-4304-8725-529157c5ab8b	79db1b8c-7041-4424-a628-39739cd1db75	106.82406357458592	162.98563143931733	-14.336667136595793	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	cfefd2dc-8482-4ddf-a86e-c2b2c639af81	79db1b8c-7041-4424-a628-39739cd1db75	70.16157931525834	188.72009963804317	-14.60411066348107	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	10fa1eff-0a3d-4720-a5c7-e97a9a02236b	39c0da74-eb5c-4690-886e-bed04158e64d	237.65042365792627	204.95679120648586	8.926031009949504	控制面板	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	650667a7-aea0-45c1-8ffa-7732a6651947	27b4b0c3-2fbb-429f-9945-4184450b4a71	646.5644533394959	92.59387721532488	24.368249029111922	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	385a8fcb-2273-4646-8c51-3b7bffb42ee5	27b4b0c3-2fbb-429f-9945-4184450b4a71	649.5411845109304	89.55079203907461	-14.562170193065295	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f1e718ab-8470-4cab-9121-7633169b9fec	27b4b0c3-2fbb-429f-9945-4184450b4a71	673.014794519919	102.44827558134813	-26.364600470949902	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6ddded46-b3f3-4ad4-b231-4dcc9cc51ec2	79db1b8c-7041-4424-a628-39739cd1db75	19.661902870295734	172.8376230772581	-5.302488613810009	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0a39cb2a-3bae-4b14-bba6-4fed248c663c	79db1b8c-7041-4424-a628-39739cd1db75	32.990305080282766	188.1138212107115	-15.000648698129313	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	粘接安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	001e2e63-99ad-4afd-9b11-880de31e3361	39c0da74-eb5c-4690-886e-bed04158e64d	281.3346440494844	207.495933408875	15.648887016715001	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c0f9627f-0926-4cec-9f50-7bdb7418b9a9	39c0da74-eb5c-4690-886e-bed04158e64d	254.2131278719006	221.3313864085093	-13.05132094065598	右设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1480efe5-bb89-4038-b472-bf3f88dea12d	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	286.2524228918706	119.42962827911056	26.804029225519734	前设备舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e86889d5-e732-497a-9660-1c4b980fd60a	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	354.37225397913744	89.84458112423462	16.97409265992868	前设备舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	9e5b1d6f-ede3-46a9-8c63-03729ff3380e	27b4b0c3-2fbb-429f-9945-4184450b4a71	626.8212975624585	111.54078563564241	12.969721156203278	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	94d46a33-3a78-4cf9-88db-ce3c0eecdbf1	27b4b0c3-2fbb-429f-9945-4184450b4a71	714.6110405029259	85.94224847591354	9.256339358669315	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d16fce2e-7296-4860-b5dd-4ec012afe784	27b4b0c3-2fbb-429f-9945-4184450b4a71	646.8709100581162	100.63835754113468	-28.38617973508626	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	538da4b7-8817-4b62-a98d-df1ff1d42505	27b4b0c3-2fbb-429f-9945-4184450b4a71	686.6088485095556	115.01587585026923	-28.886431234133177	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a64b3184-7172-46ed-bf3a-3f9ab3c30969	79db1b8c-7041-4424-a628-39739cd1db75	60.41511516920618	181.83658004822107	16.881561675103455	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	04f5f806-75e4-475a-b51d-cb322a5a6d9e	79db1b8c-7041-4424-a628-39739cd1db75	98.2180764414954	182.13662072834097	-16.71614273551226	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	bb7abee2-9523-4ae7-9c4f-a002660df08c	39c0da74-eb5c-4690-886e-bed04158e64d	195.5233301664063	228.85157055746436	16.603513181147477	地板上	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3c8924d4-03ef-47d3-83be-22891377ac32	39c0da74-eb5c-4690-886e-bed04158e64d	282.933219707742	232.47062515903144	4.584259228021523	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5ff466ee-4105-4fc3-b2c1-639c43a11b29	39c0da74-eb5c-4690-886e-bed04158e64d	227.9791347227573	214.75360129580534	28.94817997433139	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d7007226-4f21-429d-afbf-ed94ceefea66	39c0da74-eb5c-4690-886e-bed04158e64d	281.4854305430922	221.06454203733577	8.107087797472225	顶部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	bb3fc56c-76bd-494d-a7ca-b2d8ccf5f0f9	27b4b0c3-2fbb-429f-9945-4184450b4a71	697.7784167079856	100.92638325306706	-12.710255386707296	主起落架舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	9fdaf6f9-f4a5-4412-93b9-d60a5fa2bd8b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	507.1700822021798	140.6975054303488	-26.535781750976994	机翼外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	af8276d8-ac7a-4218-a03f-e3695508adab	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	583.4410457690938	154.48112005206022	-7.769005448813132	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	7596c827-3493-432b-a84b-f48315379a75	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	552.526622825417	136.92323591424048	-7.526796920715867	机翼外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5a525990-1de0-48cc-95dc-78c24253da53	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	589.3835812116957	146.84318717127286	20.786867799202547	机翼外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	635d85f4-4741-4d48-a482-58fb217f2208	668881a2-a105-4e0d-ba81-aae942960a8e	946.360042523344	191.58654970232703	10.124318050442753	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b0909d0d-8a59-4ddb-b1df-032ab378f36d	668881a2-a105-4e0d-ba81-aae942960a8e	949.5497008755044	200.278521881406	-10.562987837487999	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5c843dc6-e31c-4120-86fa-a8de99eccff5	9228048c-6de1-46ea-a674-6c987557c210	400.6316705480014	208.20073436825214	29.115974770423293	\N	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	81900d04-81e6-450f-8d39-895ad28b6438	9228048c-6de1-46ea-a674-6c987557c210	434.778521271407	174.60524346031755	0.1942851611255172	\N	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d9f04d9c-329c-432e-b306-a6744942b132	39c0da74-eb5c-4690-886e-bed04158e64d	266.09356230502385	204.5774501278537	6.068179108056285	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	925380ec-cd31-4ff1-9446-0875975e1e58	39c0da74-eb5c-4690-886e-bed04158e64d	206.232001671722	207.4433050156328	-20.87073807936467	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b7067f22-fe3f-416a-872c-ae7048c4826f	39c0da74-eb5c-4690-886e-bed04158e64d	261.6475108823214	233.35044583892227	-24.05210526985143	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1909fcff-23cf-4d59-8fbe-f8f35c54664b	79db1b8c-7041-4424-a628-39739cd1db75	34.564032638684296	192.59732390436318	-2.5311087985566516	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	24de86bf-a2a0-4bab-970c-06cceec4e6c9	79db1b8c-7041-4424-a628-39739cd1db75	77.69915210670487	176.532798755035	-4.610856905004159	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8aca1953-2c88-47bb-a776-03bdaa34c4be	79db1b8c-7041-4424-a628-39739cd1db75	68.25269481550313	175.6906995948808	-18.6416155224426	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f97b7ce5-2e0e-4919-846d-b2a08467c731	79db1b8c-7041-4424-a628-39739cd1db75	63.038853779058925	181.5149831223714	15.832375672627663	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	aa813874-eaa8-426c-b293-e8d6a2079624	79db1b8c-7041-4424-a628-39739cd1db75	36.95292641841329	193.8373057291131	14.39416102046637	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	24edad55-612b-49aa-9a14-8c9c8d167632	79db1b8c-7041-4424-a628-39739cd1db75	54.81311717721926	193.60506989055455	25.70478852212512	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2b58d018-ea3f-470c-b396-664a5301bbd8	79db1b8c-7041-4424-a628-39739cd1db75	59.401111699569434	193.65884357652016	-3.30542866945126	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	681850ca-ba18-4be6-b7d4-56a8cc8e5264	79db1b8c-7041-4424-a628-39739cd1db75	35.342657490043166	160.2187377977352	-14.62830315560334	前附件舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f61ab3f2-8b9f-4739-b3c8-67a798dcf728	39c0da74-eb5c-4690-886e-bed04158e64d	245.6451872362441	201.74575759099946	11.33591553920376	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	7961e6b5-d00b-42e0-b440-e3df0f3fbd12	39c0da74-eb5c-4690-886e-bed04158e64d	213.7946273550746	211.98082039487844	-6.3130413813575785	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	16d889c4-748b-42ef-a1bc-aa48a11542e7	668881a2-a105-4e0d-ba81-aae942960a8e	978.5931873216183	173.59332405598587	-10.333601913506119	垂直尾翼	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f8b9698b-13f0-4a0c-9ec4-befba4222db2	668881a2-a105-4e0d-ba81-aae942960a8e	951.723418592907	192.60136871792486	10.344867886637033	垂直尾翼	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	18aaf178-059c-4dd3-8607-60ec26d863f8	39c0da74-eb5c-4690-886e-bed04158e64d	201.78878894655472	208.28872703829202	-22.44127613511456	左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	标准托架安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	43a3828f-b9f8-4cc3-9c4e-c0f1ecd069ef	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	535.0057559971043	239.3766340053626	-20.969164695070837	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4a6330dc-54aa-4502-941a-5ecca30b43b6	79db1b8c-7041-4424-a628-39739cd1db75	30.544833682517694	155.532191277166	-19.270340535639235	雷达舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	aa65930f-304c-4e52-b6c4-062b85a25766	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	531.878008526315	239.98788609876414	27.042156434751575	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	fc6e049d-5609-4808-9f7d-27a9abbf7a2a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	526.5159354470388	221.76541410982594	4.297827310271558	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	A类	\N	\N	\N	选用高度更低的天线	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	29dfaf3c-8d81-4e14-8dec-b334430f74c7	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	543.7602285207162	240.07865457466363	5.395418148612691	后设备舱右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	两角螺栓安装	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	69854094-3a63-43ee-ae98-f6dad96055d3	668881a2-a105-4e0d-ba81-aae942960a8e	983.4860146247679	186.91412991496298	-20.295802096804533	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	832b98c0-92aa-41ba-a780-b53506f485bc	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	592.5937276553157	147.94130165610827	-21.11434605003717	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	安装角度调整	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c32e680f-4b7c-4b7b-949b-96cac4efa432	39c0da74-eb5c-4690-886e-bed04158e64d	206.87267770018062	219.97344075663838	1.5970219193122084	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a6994310-6bd2-4350-b22b-f31bc73f88ab	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	537.8112170697664	230.1670062989638	12.386699809241676	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b1aff6df-38ad-427a-8f5b-ccd53559a2ca	39c0da74-eb5c-4690-886e-bed04158e64d	232.678373350303	212.68977385936037	21.08430326743735	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1cea840f-bf72-437f-8e91-ac8633316a95	dacf6d7d-1e58-46f8-ad30-da511844cfba	565.2656133654028	157.30129212339008	-26.276477871229396	\N	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	75b44e92-48d1-42a2-8f07-48647fc088ce	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	328.4563002684689	108.36618318679587	-9.991161427365732	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	dc931f6f-4820-4ab2-8532-77aa5a48ee38	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	298.0319496541695	106.19174026098892	29.993861131381067	2号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e51bbed1-d8a7-4ca9-b186-909f3a365347	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	324.77564912499776	91.76161923135335	-1.1358102787751854	3号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	42222abb-a04d-4ed3-8aae-04498ef0016d	27b4b0c3-2fbb-429f-9945-4184450b4a71	679.0058904074657	92.6478468722968	7.805911745648231	中设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	cb14ede9-1ced-48e9-9669-4efc0cbd47f2	27b4b0c3-2fbb-429f-9945-4184450b4a71	669.173983401273	102.53841448723264	18.111411292069796	4号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3f336d5a-fe18-4cba-a563-2d8ec8b72a6b	27b4b0c3-2fbb-429f-9945-4184450b4a71	656.8885554721332	110.65283208802461	-7.031746675845191	5号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	9ea7a3c0-7524-4b4f-9ba4-669e015f7553	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	576.9016357287064	233.38362021535937	-15.862037596610916	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	fab18237-9df9-4f1f-87eb-d3e584456607	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	587.6622840402258	230.3519762435231	-3.6782168596391536	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ccd3c921-bea4-48e1-8d01-6c9f961e384e	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	558.3017258366776	206.80713994019936	-22.799075219757842	地板上	\N	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	11d9b0d4-f7cb-4b86-a6cd-5194dbe3c70b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	534.5542395688808	231.42151671931725	-16.684227748413456	地板上	\N	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	33e79ced-e1fa-448a-b788-0ec683c1e230	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	588.3188444470495	215.31271045598137	19.84763571774465	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	87f90282-b1b3-4d47-b624-d493e4b76acc	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	564.4846133060481	233.01548156737834	22.816964916777323	地板上	\N	\N	\N	\N	C类，28V负极在机身部分通过ERN回流；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	23a54d79-f401-4c1b-92f0-44f9a0e15221	39c0da74-eb5c-4690-886e-bed04158e64d	266.3329282215951	198.1527442208531	-29.729233841398262	顶部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0ad75d3f-f3ea-49f0-84f3-35811c130c0d	39c0da74-eb5c-4690-886e-bed04158e64d	264.72925014385646	221.3509384240868	0.6347000201151971	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f55865a1-be79-4077-bb60-751803642a21	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	320.9238753912513	103.60922109607105	27.785440859510743	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1ddcd47b-e5fe-40a2-8f5f-667395943b20	39c0da74-eb5c-4690-886e-bed04158e64d	253.88626937573903	225.20162025583465	29.8346563054968	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8e92cab8-4e65-436b-9d46-a5ff3092d892	39c0da74-eb5c-4690-886e-bed04158e64d	247.4164046640461	225.22182541644798	-4.010320037370651	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	88e249b3-78e3-40ab-94ae-d564f491aff9	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	557.431691708641	242.0584744421596	-5.826958214459339	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c0caa398-52cb-4c14-9b20-b83ab759417d	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	323.7779153635975	105.69826318575493	5.4252206801807645	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e9d1e779-29c4-4497-883b-39e85653dbca	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	350.125183765361	108.43968389431276	0.5061171026253284	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ff91f03b-bda7-4dce-a724-fc19347ab905	39c0da74-eb5c-4690-886e-bed04158e64d	284.3720092401641	219.30462739960117	8.690303164529539	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1dc3e37f-06ed-4ba8-8c3f-5986ce136723	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	611.516791691056	213.37195431324838	-20.645162571951865	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b205532a-53b5-4761-85b3-bffb7a1724da	39c0da74-eb5c-4690-886e-bed04158e64d	278.3512500296851	208.24886046008746	-0.18671440546725648	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	618f8032-89e4-4a43-96d4-0f02bcd774dd	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	296.30469181424263	114.7979177954843	22.43531648081322	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	965e5e0b-fd40-4928-b074-599dd52c1fce	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	273.615871436392	97.45582716558343	23.16494399969978	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	81d2c6c2-fdc1-4ac3-8664-9e4afc8b1404	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	332.30041236777635	114.20578065035252	8.72600196159528	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	更改为尺寸更小的天线	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4637911b-63b5-4304-b6e3-581fa0121a55	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	330.27221574596945	116.75157594287161	-9.209755825788214	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	cfffc6ac-9970-4760-b0bc-8b6ce4639865	dacf6d7d-1e58-46f8-ad30-da511844cfba	522.5458411500002	156.11934082694802	-26.290150912862728	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	607fca65-3eae-4e21-b291-0d1ed76e7baf	dacf6d7d-1e58-46f8-ad30-da511844cfba	541.7635905338072	149.09766290408916	29.995459593728945	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a9590033-dc81-4c14-8f71-db29f120d2e9	dacf6d7d-1e58-46f8-ad30-da511844cfba	590.2807423379097	150.05017423055654	5.3010269756938655	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4c6a0811-bd55-4843-92a8-ef92c75b7e00	dacf6d7d-1e58-46f8-ad30-da511844cfba	585.7619428797295	160.32427489703974	26.83004901858242	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	9a27f5c3-cd23-497d-b7d7-ae156ba27d6b	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	283.1711096345403	94.09644625236362	11.655753119061728	前设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3004d9f8-be5e-4d36-83f7-1f90885e95ac	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	598.8579413900105	142.36659180540568	27.880118289726973	机翼外段	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	建议减小体积，优化设备连接器	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	7f9fb225-71ea-4fa3-871f-5d05e6d96879	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	517.9893273433514	157.78151630521464	19.178044800758677	机翼外段	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	建议减小体积，优化设备连接器	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0871bc9a-b530-45e8-a543-9b31939bbec3	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	548.4502716853823	242.39815875413348	-25.512718699372517	后设备舱右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	dbb50dbf-0e35-4341-a245-992e89321ddd	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	519.8917576160275	127.85874291253056	-11.056402165117238	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0f112854-df48-426b-ac9e-57bbb96ffb80	27b4b0c3-2fbb-429f-9945-4184450b4a71	636.5874636921639	100.76725249072332	17.12389148777641	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	11ab49bc-fbd3-48fa-9fcf-b93d96511cc4	79db1b8c-7041-4424-a628-39739cd1db75	74.36067932123538	158.85065460045323	-9.75050387046625	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3067d501-5849-4c52-b327-036a499a6afa	27b4b0c3-2fbb-429f-9945-4184450b4a71	679.7399750916536	97.76559279722491	6.127361017440812	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	662fd3bf-513a-4129-890d-f2e60e85f322	79db1b8c-7041-4424-a628-39739cd1db75	90.5396285122415	157.37286031761562	-5.2569154827129765	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6bd67ecd-991e-43a2-ab4c-732246ca2651	27b4b0c3-2fbb-429f-9945-4184450b4a71	716.1529645497071	90.944981633161	-11.008456709870636	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	881876f4-ec7e-4ea7-8100-da658a560ea4	27b4b0c3-2fbb-429f-9945-4184450b4a71	700.8478065036995	107.95545217988743	-22.037355548721678	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a68dbe5d-1d98-4774-ad6e-896fd71eaf72	79db1b8c-7041-4424-a628-39739cd1db75	99.80884287028908	156.5295098524701	-23.940737840842637	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d019e488-269d-45f4-a7ce-1816dcaed895	79db1b8c-7041-4424-a628-39739cd1db75	58.30103382540586	189.5216112884402	-18.652626515098046	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e63e5a1b-cc96-4c72-8f38-81f7ef480697	27b4b0c3-2fbb-429f-9945-4184450b4a71	684.957135574205	112.03246716970779	21.94115837066615	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d73f7589-cf7c-4abc-97e8-93ddd0d1d848	27b4b0c3-2fbb-429f-9945-4184450b4a71	672.8123540016413	97.84682375557918	13.063842087322307	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	dcf0f33f-fd3e-4f9e-93b4-bc86e25271d4	79db1b8c-7041-4424-a628-39739cd1db75	71.48822202387348	165.34563774849678	-19.70062843181235	前起落架舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	dd3e0816-6c39-4c1c-a182-a29c1c27475c	79db1b8c-7041-4424-a628-39739cd1db75	86.2266116632785	155.47042212433476	20.360118828319877	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ee777963-6726-4c2a-9956-c1117142d1e2	27b4b0c3-2fbb-429f-9945-4184450b4a71	666.3011194335288	85.90638814870881	-22.100898697668946	主起落架舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	faa5ce74-b993-4d5b-8c26-9c72623651d1	27b4b0c3-2fbb-429f-9945-4184450b4a71	697.0029824297718	118.59400691411038	-24.660835600404464	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4689163d-a76c-4222-9381-00125cd79e8c	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	513.5483651802675	124.03856762127785	-11.290427374767596	机翼外部	\N	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8d2e1f3b-4f46-4f84-9f93-7465f739a2e2	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	500.1044432259122	126.51833038404281	-19.463315495632973	机翼外部	\N	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	fa4a3d52-8f03-4d36-a160-7eb066b2f00b	39c0da74-eb5c-4690-886e-bed04158e64d	259.4934672531898	217.28573514273887	-16.20692158284337	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	90fdb9ea-1c19-4d75-af62-ffcee44ae5c6	39c0da74-eb5c-4690-886e-bed04158e64d	206.64489098395808	222.82961571391778	-16.328259301546353	左设备架	\N	\N	标准托架安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	394f583b-a892-4241-a46e-f6defc48a3bd	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	602.1212467732308	240.85179847609635	-20.23228796115689	外部	\N	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	03e0d842-ce48-450d-a422-3bd8c57bc8bc	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	283.6449179426325	115.51040873610323	-20.392964418889648	外部	\N	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f70fce0c-92c8-4f93-8156-3fb9f80946ec	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	580.6746296852957	223.19292764223366	9.652770361856128	后设备舱右设备架	\N	\N	2MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	9cfc825b-5366-4da3-9eee-0372bd71f085	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.8691714087958	223.88709881231534	29.62958597713194	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0b0f3f44-ba70-4b00-b998-d363b92a0f54	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	544.3652439438324	222.90826784413318	7.852477686685582	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2242ba2b-8ae5-41d8-8583-d0ff6345274d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	549.8106885008718	219.1657478064353	-4.755299457442931	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	41a3a168-863c-4bb7-b638-d728801fdca7	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	269.0956686864634	97.85176808131838	-8.470393176882919	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	69b68972-e695-42f2-a584-e83cd7ec4984	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	535.530131696311	207.6587585299607	-21.923620546406976	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d8216ddc-40b1-4f75-84ae-b677def29015	27b4b0c3-2fbb-429f-9945-4184450b4a71	633.9396457730567	89.9362965323041	22.512205690641544	中设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	053abee4-0698-4072-b75f-46c3a2b67b4a	1ff1548b-395b-49be-a6c6-a9e8b7fec947	450.298613923545	130.33065377634904	5.233819677894431	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2ac1d2da-e51e-4b60-8386-4bde9ae88f1e	1ff1548b-395b-49be-a6c6-a9e8b7fec947	454.81399736089054	128.80660521888743	23.13003649660027	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	31f3eb99-b52f-442f-9c93-da9242674a31	1ff1548b-395b-49be-a6c6-a9e8b7fec947	478.5754214765601	128.05252424094027	-11.800500898559058	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4d0b4b83-716a-4c0d-b4d5-5e705048f8ca	1ff1548b-395b-49be-a6c6-a9e8b7fec947	490.7644418489467	111.86497217168994	-0.685633364943623	2号短舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	660b795a-7fe8-4963-83c7-c9ae3ef0e61d	1ff1548b-395b-49be-a6c6-a9e8b7fec947	534.7787331761908	126.39549672761453	-2.6173030511415334	2号短舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6946b7e3-b04b-41ff-8247-0ae3e3deba14	1ff1548b-395b-49be-a6c6-a9e8b7fec947	474.65781114374494	98.7139296224257	2.9512018352626654	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	87cd84b2-4f89-431b-9493-bf83aeaa07c0	1ff1548b-395b-49be-a6c6-a9e8b7fec947	466.6194686651321	130.5901516521928	2.3754386618877206	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	96824614-3718-4267-a9bd-88676ce028fa	1ff1548b-395b-49be-a6c6-a9e8b7fec947	464.4908272801581	107.00125130429946	5.849754258586209	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	9c627aff-81c5-49a7-b0e7-42138856f165	1ff1548b-395b-49be-a6c6-a9e8b7fec947	544.0987119345122	98.54824161902428	19.945869560415787	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a1b2f301-4d3e-451a-84be-7e1cf01e3421	1ff1548b-395b-49be-a6c6-a9e8b7fec947	542.957691242635	112.71363397415122	3.711048047970259	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ce4cf040-fd86-4700-a7c0-f7021fce2b5c	1ff1548b-395b-49be-a6c6-a9e8b7fec947	506.41098833928834	131.73674923498464	-15.704116570116556	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e8bbf27d-4b02-4cb5-87fb-21630f450c85	1ff1548b-395b-49be-a6c6-a9e8b7fec947	538.1288154506002	97.03598268341943	-29.782332807326668	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e87e7012-682d-42da-afa4-b09d3d29d4af	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	551.2732937375836	221.02068140286065	2.0180625676293715	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	551a5a6a-195e-4db4-916d-69635c8ece76	dacf6d7d-1e58-46f8-ad30-da511844cfba	575.9854584798665	141.01340463597649	19.725768241547698	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8f1e9383-56f2-499d-a896-5b1a22be5e98	79db1b8c-7041-4424-a628-39739cd1db75	83.93106036441998	164.5091389869372	-21.77814815481362	前起落架舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3e2409ca-018f-4eec-83b9-6cd8a6b4dc94	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	623.2422898379954	239.94495947434163	5.236925550507095	后设备舱右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d14f9046-a803-4928-9534-57de722593c8	dacf6d7d-1e58-46f8-ad30-da511844cfba	508.236661926822	153.17370734314088	27.835953363457833	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e2b7382d-4795-4175-9165-85926e956486	dacf6d7d-1e58-46f8-ad30-da511844cfba	520.5456916549525	147.72886426940218	-28.434996193188233	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ec281aff-e7a4-4bfc-a845-e9d33519e36d	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	508.38737816125814	123.98476589845933	-18.622479923093636	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	安装角度调整	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ec589b04-4108-4095-b955-48ba73162d3d	39c0da74-eb5c-4690-886e-bed04158e64d	209.5607430862599	198.64228732180692	-10.110173474411202	右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	非标托架，C类锁紧器	面搭接	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	05fe5a5e-86e1-4782-8b50-85364c51320a	39c0da74-eb5c-4690-886e-bed04158e64d	249.29281236166366	230.36193996649325	-18.862822221900046	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	2MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4a6c4183-0e81-4c9b-bbd9-1be9e9ae7dea	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	581.9584838118068	241.20127425060497	-22.47785030832695	后设备舱右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	非标准托架安装	线搭接	C类	\N	\N	\N	建议改成推拉式托架形式	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a3a4610a-f956-4b7e-be18-6212d74eb05f	39c0da74-eb5c-4690-886e-bed04158e64d	244.1034346650971	203.02099942843748	25.716636844744592	左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	eadc600f-53ea-4b4c-b954-712bb5bfe17c	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	576.3184642739127	158.1447071136588	-6.457780181425992	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330搭接线	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c7277938-188a-48c9-ba0e-f08d2156a100	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	320.89453937025996	105.15356003077618	0.46760454319808886	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	799bbd94-6e70-4449-a4cd-4c106653c7b3	39c0da74-eb5c-4690-886e-bed04158e64d	245.1843370574814	214.65535551728263	-7.116942994977379	左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	非标准托架安装	线搭接	C类	\N	\N	\N	减小设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	66c2b44b-0e1b-438e-a99f-f53684c902e7	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.609645236749	230.75384321123778	-26.13356954269242	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-螺栓螺母安装	线搭接	S类	\N	\N	\N	增加红光防撞灯固定底座	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e375d76e-c09c-45f3-bb3b-6b43b6e6b7ce	79db1b8c-7041-4424-a628-39739cd1db75	84.58355725992695	166.40408232158543	-26.077924480478195	前起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	272e7215-7f69-4954-9e41-46f1eb35788d	79db1b8c-7041-4424-a628-39739cd1db75	12.988430931958632	187.85170890843872	15.340591876273173	前附件舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2d6d0f13-5ff5-4044-aa23-0af4b2c6c52c	39c0da74-eb5c-4690-886e-bed04158e64d	217.27305718965064	214.93068812533278	11.828618643488504	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	321ad9fd-0ebd-4b8e-8c49-c76529e22abb	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	591.8181060374905	222.43522944762512	21.12974806652408	后设备舱右设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	3MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	56c2dabd-ffa6-4c07-98a0-9fb73715e83b	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	315.8716217074119	97.86902373283723	16.52248433389726	前设备舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	标准托架安装	线搭接	\N	\N	\N	\N	改成标准ARINC600，建议缩小体积	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6035443e-99da-4c68-ac6d-694baa6c3daf	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	613.4933388199787	234.6102425831783	23.44227516575735	后设备舱左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	非标准托架安装	线搭接	C类	\N	\N	\N	建议改成推拉式托架形式	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c983012b-514c-4b48-af97-3f7344a1ac2d	39c0da74-eb5c-4690-886e-bed04158e64d	243.48614816460594	218.41733717544304	24.599604486518317	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d3a95ede-6378-40ad-9316-422a9750e214	79db1b8c-7041-4424-a628-39739cd1db75	107.75543004889067	184.60656189844966	9.70580085498819	前附件舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e600b367-8f84-4d95-ad42-96afa4cfb9dd	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	349.549985982904	82.63014877900994	-8.794764575662974	前设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	标准托架安装	线搭接	\N	\N	\N	\N	改成标准ARINC600，建议缩小体积	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8ed8b7ec-c487-40aa-aaab-3340cdb71621	39c0da74-eb5c-4690-886e-bed04158e64d	213.10019277115492	197.24576095849778	18.313743330874914	左设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	非标准托架安装	线搭接	C类	\N	\N	\N	减小设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	be1aad53-d2c4-4407-87dc-317a81bfed71	39c0da74-eb5c-4690-886e-bed04158e64d	209.1470124621938	232.49708681206613	-25.941894583004782	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e632fb91-bc56-454e-a5be-f2057f984669	39c0da74-eb5c-4690-886e-bed04158e64d	214.55632057790106	214.73225834112367	-25.74677296648815	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	eddb07a0-7e70-4185-a399-fd57b0360365	39c0da74-eb5c-4690-886e-bed04158e64d	239.5581439067377	199.11949659221838	-15.43248339378408	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	0bf86a96-c097-4533-99d4-58e51b33328b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	502.45719729257536	156.23142954454647	16.77043805231243	中央翼盒	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类	\N	\N	\N	减小设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2074a91a-9c58-4886-826a-cab4fa9c8921	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	548.8819398030851	129.9770003356163	-8.588173270888337	机翼外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	线搭接	S类	\N	\N	\N	增加白光防撞灯固定底座	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b3b321a1-ecca-4407-91b0-8240e914593b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	540.9622280232812	147.1152733303697	20.81682718151675	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	124f1c0e-c7d5-4529-b729-0e6f9c163e9d	668881a2-a105-4e0d-ba81-aae942960a8e	1022.6028345861074	198.66807942662666	12.411594830417535	垂直尾翼	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	609ff014-4e7a-4b52-820d-70d0643054ba	668881a2-a105-4e0d-ba81-aae942960a8e	996.0475197956687	203.68660372109463	17.832234399460788	水平尾翼	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	838017f2-5656-44bb-873a-ee3e8114141d	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	590.6105378071709	140.6865779613837	28.056980214067053	机翼外段	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	308dad5a-ce5e-45c0-a4d9-ccf869c4e874	39c0da74-eb5c-4690-886e-bed04158e64d	272.8065658009308	202.34692196677034	-26.546077219925273	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b8766393-40b7-406b-a18c-d2a13f1f2e57	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	541.2429307332338	225.27137342749268	-0.6109447218227189	后设备舱右设备架	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	面搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c6e08321-7690-4ca3-961f-025888f915b3	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	348.2723533346255	116.80960248239214	19.828871412513763	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f1efdd80-24ef-4363-83c7-85da0a3f8fe4	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	563.6556072989794	243.5848973399896	-22.405043180746716	后设备舱右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	面搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	ae39aa76-ecd7-4e51-a3d1-7c43090402f9	39c0da74-eb5c-4690-886e-bed04158e64d	221.1206011140108	206.07456472012427	6.635031392824054	右设备架	\N	\N	紧固件-螺栓螺母安装	面搭接	C类	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2c8c347f-2140-4e3e-819e-c21df7259402	39c0da74-eb5c-4690-886e-bed04158e64d	235.71676556515524	234.01665648142296	20.992325118018073	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6fdbb16f-35d9-485c-9216-6774f0684d8c	39c0da74-eb5c-4690-886e-bed04158e64d	239.91627564441112	233.57208037834945	-11.132604527987496	地板上	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	890c2523-4adc-47ed-8f21-961a0a815b33	27b4b0c3-2fbb-429f-9945-4184450b4a71	659.588402807582	117.19284275791398	9.436418681006607	主起落架舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a1dae93d-b8e6-4cfc-a25b-fedaf6b3cfc5	27b4b0c3-2fbb-429f-9945-4184450b4a71	693.0872422265032	115.77125386439678	0.9339634561218801	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	181449ec-a06d-46d5-b5ba-8ccf06bd425f	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	314.1289370761357	106.02596413283726	-22.754661237121883	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6e0ca76a-dbfb-4902-9f24-e43ec75e48de	27b4b0c3-2fbb-429f-9945-4184450b4a71	692.5837148572443	115.80667431530675	-15.482541042769407	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8374e76d-fca2-4bc9-94e7-61b8721ee94a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.689063067856	221.8018088664602	11.538643108715732	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b64537f4-8c11-4d97-a69b-2e1166979199	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	575.1417715048777	244.100586327616	24.806241663696163	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e2a8449d-718c-426d-ba6d-aa5879a54694	668881a2-a105-4e0d-ba81-aae942960a8e	936.0275706939824	191.67470435682452	25.079138256739185	垂直尾翼	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	e448eb31-370a-43de-a5f6-07a999e589af	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	359.89169405671345	85.89672480903077	17.90649026290876	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	78a01034-9fbf-443f-a193-7aed540cd97a	39c0da74-eb5c-4690-886e-bed04158e64d	235.37577281243944	219.02985768460815	-4.316603731290883	左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	三角螺栓安装	面搭接	CPS1330	\N	\N	\N	建议调整为压接连接器	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	82d26b07-ac4f-42e7-b560-f666e34c2c0a	39c0da74-eb5c-4690-886e-bed04158e64d	219.96952967750408	209.41187287684062	13.224302472935477	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	三角螺栓安装	面搭接	CPS1330	\N	\N	\N	建议调整为压接连接器	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	35f40f9f-c1c3-4dd4-a75b-c38530fdc808	79db1b8c-7041-4424-a628-39739cd1db75	82.56412982216197	156.74883963446422	1.9277001966686989	前起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	CPS1331，设备壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	95f8fcf9-dfa5-496e-95a4-1cc204b488a8	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	347.10081864044594	104.33780958625344	-22.080831093922136	前设备舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	db3eec35-d082-45f5-b88c-662e141ada3b	27b4b0c3-2fbb-429f-9945-4184450b4a71	644.0295155125511	109.53147099066989	-13.614045272783514	主起落架舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	60368506-db53-4a47-a95d-c3945a9411ee	79db1b8c-7041-4424-a628-39739cd1db75	83.23323934268704	187.5771711324238	1.1594030498678194	前起落架舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	CPS1330，设备壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f2ecd438-cfbc-4d47-8911-de904bdbe87c	79db1b8c-7041-4424-a628-39739cd1db75	45.20644503589787	174.08186591179245	-0.5550226868235981	前起落架舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3f246d7f-fb50-4738-9951-55f78b7d8124	27b4b0c3-2fbb-429f-9945-4184450b4a71	696.1337005306411	106.17614363814508	-20.4955864343504	主起落架舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	f4baca8f-fc97-42ee-8e7c-9e8384ffea2e	27b4b0c3-2fbb-429f-9945-4184450b4a71	670.8960055623988	84.576776462466	8.43114568361004	主起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	CPS1330	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4c493c59-f2c3-40d5-840f-3c775da83ab3	1ff1548b-395b-49be-a6c6-a9e8b7fec947	498.6797734100965	123.5130818019055	14.038347076280822	1号短舱（机翼内侧）	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类，28V负极在机身部分通过ERN回流；\nR类、H类、S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6d91e335-b44e-4928-b37d-6dc4aea90822	27b4b0c3-2fbb-429f-9945-4184450b4a71	626.6569014461659	81.47457164754063	-15.830874597931292	中设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	b8fbc68a-0401-4d91-a7e5-72137d7070d1	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	263.27514854052646	85.14267316143271	-2.6847033267906113	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	bb57baa7-e178-43d4-84e1-9dc7c73a95ea	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	306.5310855136836	102.25752975393219	-12.935762641762203	前设备舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d87dd885-204b-4088-ad97-449cff1d3596	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	356.32700276528385	90.18333119275844	-19.358355689897436	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	3e1d143c-30c7-482b-aa93-874cc83155c5	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	356.90204307727566	82.04779672003495	-29.635729024814236	前设备舱	\N	\N	\N	\N	无需求	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5e463e2f-7daa-422e-8eef-0df56eaa629c	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	284.19768902331487	101.88159608012194	18.30264149995231	前设备舱	\N	\N	\N	\N	无需求	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	2f9d8862-798e-4881-babf-034301d2d432	39c0da74-eb5c-4690-886e-bed04158e64d	269.64979249982514	202.6900206817645	-4.0464969776535185	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	32fa0895-6be5-47b2-a0db-ea1f1f45dc3e	39c0da74-eb5c-4690-886e-bed04158e64d	279.34194279245264	232.60123658380195	28.000860846665567	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	CPS1330壳体面面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	4086a3de-eb3f-4e90-a97e-f515eaf13d97	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	597.048731151173	205.10236756834598	-24.67417174621003	后设备舱左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	线搭接	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	962509cd-50bc-4781-a07e-67c9810d649b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	589.2571969671059	213.60773480001203	-14.206354225798062	后设备舱盘箱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	99b49e0b-9f8c-4df5-9909-7d2e336c8108	39c0da74-eb5c-4690-886e-bed04158e64d	270.3523085510875	222.8476643118049	-4.370042299256109	右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	四角螺栓安装	线搭接	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	a52471a6-739b-4943-8668-8f55e6632753	39c0da74-eb5c-4690-886e-bed04158e64d	236.9500745496863	204.55046595984427	8.302115782940817	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	12a47dbf-ea2a-4928-96fa-dc56b3c1ce35	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	602.093940623309	207.00100948189834	-7.840144085016622	后设备舱左设备架	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	15e50bff-bb76-457d-931a-ad7bd482d130	39c0da74-eb5c-4690-886e-bed04158e64d	217.71078440678258	211.26494855893776	16.07676821841421	左设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5950dcbc-5e13-4dbc-b7e3-09ab82a8750f	39c0da74-eb5c-4690-886e-bed04158e64d	257.15318253345987	208.0964322605206	-18.75619741800848	右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	83cf0b00-ec68-45a0-a724-8b565d162342	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	585.9371209444623	234.18650876808806	26.821169517481593	后设备舱右设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	5afc64af-2c92-4b60-9a98-2d148a79c6a6	39c0da74-eb5c-4690-886e-bed04158e64d	241.9516769838807	203.03997793015103	-22.9868470301003	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	1c50a573-ae1f-4782-bb90-81f8dd598ca2	39c0da74-eb5c-4690-886e-bed04158e64d	218.70391915747626	198.13873415735617	-8.514583947713831	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	48436bf1-4dab-4278-9850-cec39c073dd3	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	547.5474129392678	137.577886816231	1.6261501779002572	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	74da3049-7989-4fa0-952b-749234b9da02	39c0da74-eb5c-4690-886e-bed04158e64d	231.44379233542722	197.09515928657999	-3.3204485595106945	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	82d81c8a-fc3c-4362-8214-b962d9d00f94	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	567.1687848134533	124.24967233045902	3.204759735322696	中央翼盒	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	CPS1330	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	8c23589d-5f8f-4525-bdc0-920f1ab2c533	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	350.7475723556104	89.47514404628473	-10.003289867303685	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330搭接线	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	d26d0aa5-be7e-44d5-bafd-b3da2026be3c	39c0da74-eb5c-4690-886e-bed04158e64d	233.9456594699135	198.67246413201667	-22.041570738650883	\N	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	df446f5f-9e07-4aae-a38b-fb5e9aef3b29	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	585.3780925443197	242.06931983400875	2.364957560118647	后设备舱左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	四角螺栓安装	面搭接	S类	\N	\N	\N	需改为标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	fa2e4d12-8395-4eea-864f-a48e4c6dc1f5	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	300.9107203630587	94.39793290289404	-23.585384455841684	前设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	\N	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	049f7c9a-5639-4284-b964-c47dd8f68f2a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	608.5951274827587	217.21156148476163	29.577402349476287	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	068f8a07-1907-46a1-b93d-4c7098bd90ab	39c0da74-eb5c-4690-886e-bed04158e64d	274.7956207671108	227.92950110401378	9.440313406597895	左设备架	\N	\N	四角螺栓安装	线搭接	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	438c3120-36ee-4580-9758-3597f62fd65d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	566.6747310544399	233.4900151378191	-23.57803621038891	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	536594a1-7a7a-4e64-b837-b0eeed3dec17	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	549.2077647744061	230.18019312668073	-9.905455585240848	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	6edfca52-fd98-4c53-94d8-14f81d0df193	39c0da74-eb5c-4690-886e-bed04158e64d	246.2191779139339	220.20514641951866	-0.19758358897644968	左设备架	\N	\N	四角螺栓安装	线搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为国军标441尺寸机箱	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	c44bca34-5667-427c-8bb4-d5440587679d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	529.911420179558	243.14830538914381	-23.653446033701446	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
99579ad8-1b28-4e67-83b6-936455d59421	fd7671f0-2299-43ec-9aa1-77e4c7bbca5b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	552.3707198669401	244.88920552208913	-2.914941230220901	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1c4ca146-747e-4ef9-80ef-50b5bc183314	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	560.656122660773	218.0117812336478	-4.710160998016505	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	紧固件-螺栓螺母安装	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	28068af6-d5af-4304-bd9c-664a29bba94a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	572.9322834243926	239.71092602647695	7.9341599259333435	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-托板螺母安装	\N	A类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	cf6fc01a-24fe-455c-8909-49888a3eacc1	39c0da74-eb5c-4690-886e-bed04158e64d	186.04357862295797	211.73528144283344	7.886615360520118	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	标准托架安装	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b6b437ad-045d-45f7-9ac8-9956805aeed6	39c0da74-eb5c-4690-886e-bed04158e64d	253.40952844561951	230.46193041757496	26.6511534324721	控制面板	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a6fca9b2-7473-4c49-aa0f-4d0aa4a980a6	39c0da74-eb5c-4690-886e-bed04158e64d	264.4658376723165	229.80930101219573	22.380829614363243	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f1b7747d-cf58-4346-ba82-6851aaad0595	39c0da74-eb5c-4690-886e-bed04158e64d	267.2650042775972	229.35443934998062	14.513362730146525	顶部	\N	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6e476b86-56a0-40cb-a81a-86fb3912f774	39c0da74-eb5c-4690-886e-bed04158e64d	195.03369325649388	202.09302940655976	18.810897139200925	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	aabcfd9d-8180-4fa5-9dc2-7f4044007c06	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	554.0217962366264	155.04436499417722	20.858122922317023	机翼外段	\N	\N	\N	\N	静电放电器复材底座	\N	\N	\N	建议更改连接形式	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	43475883-4fb9-41a0-aa52-ab323bcade9a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	622.5416448888228	243.673714059106	-19.241773131652998	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	标准托架安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0164952a-4810-4806-8b13-ba8fc891d32a	39c0da74-eb5c-4690-886e-bed04158e64d	226.98556159137593	211.65033618062017	-8.767553190083714	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	26d4e068-b246-4f7e-b3db-a7df776ca944	39c0da74-eb5c-4690-886e-bed04158e64d	191.98582480026212	218.28847426793592	-12.463320199215623	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	03688f32-e6ba-400d-bb74-9627f4e3bafb	39c0da74-eb5c-4690-886e-bed04158e64d	260.5158854351301	223.43533831012485	-17.52712333893913	控制面板	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	S类，面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ca95fc08-9d85-4f02-85c7-f310add5f986	39c0da74-eb5c-4690-886e-bed04158e64d	197.87862421866805	232.01714965571577	-2.7207334413393234	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b89164e5-b504-4dd0-a9d9-8fedd94fd000	39c0da74-eb5c-4690-886e-bed04158e64d	193.1610017760841	225.51469555754858	23.690280126604662	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8b59584a-ad4c-4a2b-a379-13bd9b73e6f3	39c0da74-eb5c-4690-886e-bed04158e64d	220.56989898914452	196.06684896176324	29.317794193625303	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1719f0eb-1418-4b9d-8f19-722a35f84312	39c0da74-eb5c-4690-886e-bed04158e64d	209.49632531511995	213.61765341531594	20.30614481590183	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5e5cf45d-15ad-4331-b15f-f1048bc7db99	39c0da74-eb5c-4690-886e-bed04158e64d	261.10007213959216	209.87148849439353	29.15233110298479	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d7713356-afc5-433b-9613-e7495ee95f47	39c0da74-eb5c-4690-886e-bed04158e64d	262.1476205350402	210.42426877592075	-16.376832327058835	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	24f2c420-9982-4baa-a486-c63987d3322d	39c0da74-eb5c-4690-886e-bed04158e64d	235.60573620564722	217.11526247892837	-0.6199250312122082	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3754214b-1053-411a-bb0b-c9252dff46bc	39c0da74-eb5c-4690-886e-bed04158e64d	192.7991558503387	221.28807016905256	18.537273738426784	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	19e3e232-9e7f-4629-ac14-6e35918d7e69	39c0da74-eb5c-4690-886e-bed04158e64d	214.9205412150318	211.93692206793702	-26.414418695815673	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	807b2260-9b40-4c13-9266-34d9bce16509	39c0da74-eb5c-4690-886e-bed04158e64d	194.87741771699362	231.23428262425992	12.153176799226102	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3d7a2c27-0d7c-4664-9094-b971554e992a	39c0da74-eb5c-4690-886e-bed04158e64d	263.90145841376443	203.4917101703115	-10.001974708939418	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	aa71ab81-e66d-4aeb-baa7-dfbd0dcd54d0	39c0da74-eb5c-4690-886e-bed04158e64d	229.5340639471471	234.11715876802816	17.662754168898857	控制面板	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	501a4a34-f498-4a32-909f-29cb636170ec	39c0da74-eb5c-4690-886e-bed04158e64d	186.13678486217154	208.22184555294325	-27.758523950459846	顶部	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ec440b04-68ec-4323-b6ac-f924d6b3bb02	39c0da74-eb5c-4690-886e-bed04158e64d	253.89929695564314	224.47890719478164	5.416216492898876	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3b2ff700-142e-48ef-83da-ecf917dfd69c	39c0da74-eb5c-4690-886e-bed04158e64d	245.3468097876772	219.11456059316717	-19.48635120377896	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	901ab551-3d4f-4123-9003-173070b8e4c2	39c0da74-eb5c-4690-886e-bed04158e64d	239.065377279205	226.5894395153545	-21.22214768594977	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	669c55a8-bf33-4091-98dd-ceb93d933e2c	39c0da74-eb5c-4690-886e-bed04158e64d	275.1122025493041	213.78818930454972	21.439970054733898	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	75d609ea-6735-4e45-8425-7e1c5e283f26	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	587.0826646167355	234.67728401978468	14.473749150361677	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	六角螺栓安装	线搭接	R类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8c08abfc-0e8e-4b59-a56d-bcb371d8d3d0	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	273.78635296566705	89.5595778534496	22.001962375986054	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	A类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	957836b3-3f19-4a30-9223-5667f6b4afc1	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	561.0666125228242	218.49059382918085	7.1823326273568355	后设备舱盘箱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	069cb255-137d-4af4-942c-9a008d3e2e91	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	620.4732609044155	233.490588735386	14.947193690223628	后设备舱盘箱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	77ea8529-8214-4479-93d1-4077f1a0470a	39c0da74-eb5c-4690-886e-bed04158e64d	261.4115690844346	232.87319684917554	17.120330827397602	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	3MCU托架安装，A类锁紧器	线搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	695cb5ad-954d-4cf3-8363-92ffc74b12d7	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	548.2845816885828	154.8788597361906	-2.1192493351169546	机翼外段	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	7988f9ed-45aa-4a3c-bcad-4872f4a98a4f	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	571.3405856208681	120.36797916864502	-17.43359981996923	机翼外段	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	704f48ec-3ae7-409c-870b-83a63971dd3f	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	565.5283796742817	133.13016515878286	-25.538265591135204	机翼外段	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ffc2cb35-1056-4451-82aa-c7810ab08d14	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	560.5531260050095	130.69948577963385	-3.771937868305109	机翼外段	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	67b17f78-ab6a-45c5-acd5-da75df6c1f69	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	596.53929837585	153.032076314474	21.38992180307462	中央翼盒	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	63cfaf67-6676-4ece-ab8e-f68aca7f4fc9	79db1b8c-7041-4424-a628-39739cd1db75	13.57792665003086	188.90758024783096	-0.040387379535218315	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	97fc5cff-4840-494d-917d-fefa06476cb7	79db1b8c-7041-4424-a628-39739cd1db75	55.50646000777064	180.93229383808477	-28.52731872924203	外部	\N	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1809a66a-37dc-4304-8725-529157c5ab8b	79db1b8c-7041-4424-a628-39739cd1db75	106.82406357458592	162.98563143931733	-14.336667136595793	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	cfefd2dc-8482-4ddf-a86e-c2b2c639af81	79db1b8c-7041-4424-a628-39739cd1db75	70.16157931525834	188.72009963804317	-14.60411066348107	外部	\N	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	10fa1eff-0a3d-4720-a5c7-e97a9a02236b	39c0da74-eb5c-4690-886e-bed04158e64d	237.65042365792627	204.95679120648586	8.926031009949504	控制面板	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	650667a7-aea0-45c1-8ffa-7732a6651947	27b4b0c3-2fbb-429f-9945-4184450b4a71	646.5644533394959	92.59387721532488	24.368249029111922	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	385a8fcb-2273-4646-8c51-3b7bffb42ee5	27b4b0c3-2fbb-429f-9945-4184450b4a71	649.5411845109304	89.55079203907461	-14.562170193065295	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f1e718ab-8470-4cab-9121-7633169b9fec	27b4b0c3-2fbb-429f-9945-4184450b4a71	673.014794519919	102.44827558134813	-26.364600470949902	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6ddded46-b3f3-4ad4-b231-4dcc9cc51ec2	79db1b8c-7041-4424-a628-39739cd1db75	19.661902870295734	172.8376230772581	-5.302488613810009	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0a39cb2a-3bae-4b14-bba6-4fed248c663c	79db1b8c-7041-4424-a628-39739cd1db75	32.990305080282766	188.1138212107115	-15.000648698129313	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	粘接安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	001e2e63-99ad-4afd-9b11-880de31e3361	39c0da74-eb5c-4690-886e-bed04158e64d	281.3346440494844	207.495933408875	15.648887016715001	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c0f9627f-0926-4cec-9f50-7bdb7418b9a9	39c0da74-eb5c-4690-886e-bed04158e64d	254.2131278719006	221.3313864085093	-13.05132094065598	右设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1480efe5-bb89-4038-b472-bf3f88dea12d	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	286.2524228918706	119.42962827911056	26.804029225519734	前设备舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e86889d5-e732-497a-9660-1c4b980fd60a	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	354.37225397913744	89.84458112423462	16.97409265992868	前设备舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-螺栓螺母安装	线搭接	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	9e5b1d6f-ede3-46a9-8c63-03729ff3380e	27b4b0c3-2fbb-429f-9945-4184450b4a71	626.8212975624585	111.54078563564241	12.969721156203278	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	94d46a33-3a78-4cf9-88db-ce3c0eecdbf1	27b4b0c3-2fbb-429f-9945-4184450b4a71	714.6110405029259	85.94224847591354	9.256339358669315	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d16fce2e-7296-4860-b5dd-4ec012afe784	27b4b0c3-2fbb-429f-9945-4184450b4a71	646.8709100581162	100.63835754113468	-28.38617973508626	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	538da4b7-8817-4b62-a98d-df1ff1d42505	27b4b0c3-2fbb-429f-9945-4184450b4a71	686.6088485095556	115.01587585026923	-28.886431234133177	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a64b3184-7172-46ed-bf3a-3f9ab3c30969	79db1b8c-7041-4424-a628-39739cd1db75	60.41511516920618	181.83658004822107	16.881561675103455	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	04f5f806-75e4-475a-b51d-cb322a5a6d9e	79db1b8c-7041-4424-a628-39739cd1db75	98.2180764414954	182.13662072834097	-16.71614273551226	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	bb7abee2-9523-4ae7-9c4f-a002660df08c	39c0da74-eb5c-4690-886e-bed04158e64d	195.5233301664063	228.85157055746436	16.603513181147477	地板上	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3c8924d4-03ef-47d3-83be-22891377ac32	39c0da74-eb5c-4690-886e-bed04158e64d	282.933219707742	232.47062515903144	4.584259228021523	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5ff466ee-4105-4fc3-b2c1-639c43a11b29	39c0da74-eb5c-4690-886e-bed04158e64d	227.9791347227573	214.75360129580534	28.94817997433139	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d7007226-4f21-429d-afbf-ed94ceefea66	39c0da74-eb5c-4690-886e-bed04158e64d	281.4854305430922	221.06454203733577	8.107087797472225	顶部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	bb3fc56c-76bd-494d-a7ca-b2d8ccf5f0f9	27b4b0c3-2fbb-429f-9945-4184450b4a71	697.7784167079856	100.92638325306706	-12.710255386707296	主起落架舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	9fdaf6f9-f4a5-4412-93b9-d60a5fa2bd8b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	507.1700822021798	140.6975054303488	-26.535781750976994	机翼外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	af8276d8-ac7a-4218-a03f-e3695508adab	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	583.4410457690938	154.48112005206022	-7.769005448813132	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	7596c827-3493-432b-a84b-f48315379a75	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	552.526622825417	136.92323591424048	-7.526796920715867	机翼外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5a525990-1de0-48cc-95dc-78c24253da53	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	589.3835812116957	146.84318717127286	20.786867799202547	机翼外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	635d85f4-4741-4d48-a482-58fb217f2208	668881a2-a105-4e0d-ba81-aae942960a8e	946.360042523344	191.58654970232703	10.124318050442753	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b0909d0d-8a59-4ddb-b1df-032ab378f36d	668881a2-a105-4e0d-ba81-aae942960a8e	949.5497008755044	200.278521881406	-10.562987837487999	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5c843dc6-e31c-4120-86fa-a8de99eccff5	9228048c-6de1-46ea-a674-6c987557c210	400.6316705480014	208.20073436825214	29.115974770423293	\N	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	81900d04-81e6-450f-8d39-895ad28b6438	9228048c-6de1-46ea-a674-6c987557c210	434.778521271407	174.60524346031755	0.1942851611255172	\N	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d9f04d9c-329c-432e-b306-a6744942b132	39c0da74-eb5c-4690-886e-bed04158e64d	266.09356230502385	204.5774501278537	6.068179108056285	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	925380ec-cd31-4ff1-9446-0875975e1e58	39c0da74-eb5c-4690-886e-bed04158e64d	206.232001671722	207.4433050156328	-20.87073807936467	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b7067f22-fe3f-416a-872c-ae7048c4826f	39c0da74-eb5c-4690-886e-bed04158e64d	261.6475108823214	233.35044583892227	-24.05210526985143	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1909fcff-23cf-4d59-8fbe-f8f35c54664b	79db1b8c-7041-4424-a628-39739cd1db75	34.564032638684296	192.59732390436318	-2.5311087985566516	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	24de86bf-a2a0-4bab-970c-06cceec4e6c9	79db1b8c-7041-4424-a628-39739cd1db75	77.69915210670487	176.532798755035	-4.610856905004159	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8aca1953-2c88-47bb-a776-03bdaa34c4be	79db1b8c-7041-4424-a628-39739cd1db75	68.25269481550313	175.6906995948808	-18.6416155224426	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f97b7ce5-2e0e-4919-846d-b2a08467c731	79db1b8c-7041-4424-a628-39739cd1db75	63.038853779058925	181.5149831223714	15.832375672627663	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	aa813874-eaa8-426c-b293-e8d6a2079624	79db1b8c-7041-4424-a628-39739cd1db75	36.95292641841329	193.8373057291131	14.39416102046637	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	24edad55-612b-49aa-9a14-8c9c8d167632	79db1b8c-7041-4424-a628-39739cd1db75	54.81311717721926	193.60506989055455	25.70478852212512	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2b58d018-ea3f-470c-b396-664a5301bbd8	79db1b8c-7041-4424-a628-39739cd1db75	59.401111699569434	193.65884357652016	-3.30542866945126	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	681850ca-ba18-4be6-b7d4-56a8cc8e5264	79db1b8c-7041-4424-a628-39739cd1db75	35.342657490043166	160.2187377977352	-14.62830315560334	前附件舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f61ab3f2-8b9f-4739-b3c8-67a798dcf728	39c0da74-eb5c-4690-886e-bed04158e64d	245.6451872362441	201.74575759099946	11.33591553920376	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	7961e6b5-d00b-42e0-b440-e3df0f3fbd12	39c0da74-eb5c-4690-886e-bed04158e64d	213.7946273550746	211.98082039487844	-6.3130413813575785	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	16d889c4-748b-42ef-a1bc-aa48a11542e7	668881a2-a105-4e0d-ba81-aae942960a8e	978.5931873216183	173.59332405598587	-10.333601913506119	垂直尾翼	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	A类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f8b9698b-13f0-4a0c-9ec4-befba4222db2	668881a2-a105-4e0d-ba81-aae942960a8e	951.723418592907	192.60136871792486	10.344867886637033	垂直尾翼	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	18aaf178-059c-4dd3-8607-60ec26d863f8	39c0da74-eb5c-4690-886e-bed04158e64d	201.78878894655472	208.28872703829202	-22.44127613511456	左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	标准托架安装	面搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	43a3828f-b9f8-4cc3-9c4e-c0f1ecd069ef	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	535.0057559971043	239.3766340053626	-20.969164695070837	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4a6330dc-54aa-4502-941a-5ecca30b43b6	79db1b8c-7041-4424-a628-39739cd1db75	30.544833682517694	155.532191277166	-19.270340535639235	雷达舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	aa65930f-304c-4e52-b6c4-062b85a25766	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	531.878008526315	239.98788609876414	27.042156434751575	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	fc6e049d-5609-4808-9f7d-27a9abbf7a2a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	526.5159354470388	221.76541410982594	4.297827310271558	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	A类	\N	\N	\N	选用高度更低的天线	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	29dfaf3c-8d81-4e14-8dec-b334430f74c7	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	543.7602285207162	240.07865457466363	5.395418148612691	后设备舱右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	两角螺栓安装	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	69854094-3a63-43ee-ae98-f6dad96055d3	668881a2-a105-4e0d-ba81-aae942960a8e	983.4860146247679	186.91412991496298	-20.295802096804533	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	832b98c0-92aa-41ba-a780-b53506f485bc	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	592.5937276553157	147.94130165610827	-21.11434605003717	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	安装角度调整	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c32e680f-4b7c-4b7b-949b-96cac4efa432	39c0da74-eb5c-4690-886e-bed04158e64d	206.87267770018062	219.97344075663838	1.5970219193122084	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a6994310-6bd2-4350-b22b-f31bc73f88ab	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	537.8112170697664	230.1670062989638	12.386699809241676	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b1aff6df-38ad-427a-8f5b-ccd53559a2ca	39c0da74-eb5c-4690-886e-bed04158e64d	232.678373350303	212.68977385936037	21.08430326743735	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1cea840f-bf72-437f-8e91-ac8633316a95	dacf6d7d-1e58-46f8-ad30-da511844cfba	565.2656133654028	157.30129212339008	-26.276477871229396	\N	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	75b44e92-48d1-42a2-8f07-48647fc088ce	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	328.4563002684689	108.36618318679587	-9.991161427365732	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	dc931f6f-4820-4ab2-8532-77aa5a48ee38	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	298.0319496541695	106.19174026098892	29.993861131381067	2号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e51bbed1-d8a7-4ca9-b186-909f3a365347	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	324.77564912499776	91.76161923135335	-1.1358102787751854	3号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	42222abb-a04d-4ed3-8aae-04498ef0016d	27b4b0c3-2fbb-429f-9945-4184450b4a71	679.0058904074657	92.6478468722968	7.805911745648231	中设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	cb14ede9-1ced-48e9-9669-4efc0cbd47f2	27b4b0c3-2fbb-429f-9945-4184450b4a71	669.173983401273	102.53841448723264	18.111411292069796	4号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3f336d5a-fe18-4cba-a563-2d8ec8b72a6b	27b4b0c3-2fbb-429f-9945-4184450b4a71	656.8885554721332	110.65283208802461	-7.031746675845191	5号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	9ea7a3c0-7524-4b4f-9ba4-669e015f7553	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	576.9016357287064	233.38362021535937	-15.862037596610916	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	fab18237-9df9-4f1f-87eb-d3e584456607	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	587.6622840402258	230.3519762435231	-3.6782168596391536	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ccd3c921-bea4-48e1-8d01-6c9f961e384e	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	558.3017258366776	206.80713994019936	-22.799075219757842	地板上	\N	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	11d9b0d4-f7cb-4b86-a6cd-5194dbe3c70b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	534.5542395688808	231.42151671931725	-16.684227748413456	地板上	\N	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	33e79ced-e1fa-448a-b788-0ec683c1e230	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	588.3188444470495	215.31271045598137	19.84763571774465	地板上	\N	\N	\N	\N	NA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	87f90282-b1b3-4d47-b624-d493e4b76acc	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	564.4846133060481	233.01548156737834	22.816964916777323	地板上	\N	\N	\N	\N	C类，28V负极在机身部分通过ERN回流；	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	23a54d79-f401-4c1b-92f0-44f9a0e15221	39c0da74-eb5c-4690-886e-bed04158e64d	266.3329282215951	198.1527442208531	-29.729233841398262	顶部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0ad75d3f-f3ea-49f0-84f3-35811c130c0d	39c0da74-eb5c-4690-886e-bed04158e64d	264.72925014385646	221.3509384240868	0.6347000201151971	顶部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f55865a1-be79-4077-bb60-751803642a21	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	320.9238753912513	103.60922109607105	27.785440859510743	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1ddcd47b-e5fe-40a2-8f5f-667395943b20	39c0da74-eb5c-4690-886e-bed04158e64d	253.88626937573903	225.20162025583465	29.8346563054968	左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8e92cab8-4e65-436b-9d46-a5ff3092d892	39c0da74-eb5c-4690-886e-bed04158e64d	247.4164046640461	225.22182541644798	-4.010320037370651	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	88e249b3-78e3-40ab-94ae-d564f491aff9	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	557.431691708641	242.0584744421596	-5.826958214459339	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c0caa398-52cb-4c14-9b20-b83ab759417d	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	323.7779153635975	105.69826318575493	5.4252206801807645	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e9d1e779-29c4-4497-883b-39e85653dbca	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	350.125183765361	108.43968389431276	0.5061171026253284	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ff91f03b-bda7-4dce-a724-fc19347ab905	39c0da74-eb5c-4690-886e-bed04158e64d	284.3720092401641	219.30462739960117	8.690303164529539	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1dc3e37f-06ed-4ba8-8c3f-5986ce136723	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	611.516791691056	213.37195431324838	-20.645162571951865	后设备舱左设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	4MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b205532a-53b5-4761-85b3-bffb7a1724da	39c0da74-eb5c-4690-886e-bed04158e64d	278.3512500296851	208.24886046008746	-0.18671440546725648	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	需改为标准ARINC600机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	618f8032-89e4-4a43-96d4-0f02bcd774dd	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	296.30469181424263	114.7979177954843	22.43531648081322	外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	A类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	965e5e0b-fd40-4928-b074-599dd52c1fce	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	273.615871436392	97.45582716558343	23.16494399969978	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	81d2c6c2-fdc1-4ac3-8664-9e4afc8b1404	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	332.30041236777635	114.20578065035252	8.72600196159528	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	C类	\N	\N	\N	更改为尺寸更小的天线	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4637911b-63b5-4304-b6e3-581fa0121a55	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	330.27221574596945	116.75157594287161	-9.209755825788214	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	C类	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	cfffc6ac-9970-4760-b0bc-8b6ce4639865	dacf6d7d-1e58-46f8-ad30-da511844cfba	522.5458411500002	156.11934082694802	-26.290150912862728	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	607fca65-3eae-4e21-b291-0d1ed76e7baf	dacf6d7d-1e58-46f8-ad30-da511844cfba	541.7635905338072	149.09766290408916	29.995459593728945	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a9590033-dc81-4c14-8f71-db29f120d2e9	dacf6d7d-1e58-46f8-ad30-da511844cfba	590.2807423379097	150.05017423055654	5.3010269756938655	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4c6a0811-bd55-4843-92a8-ef92c75b7e00	dacf6d7d-1e58-46f8-ad30-da511844cfba	585.7619428797295	160.32427489703974	26.83004901858242	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	9a27f5c3-cd23-497d-b7d7-ae156ba27d6b	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	283.1711096345403	94.09644625236362	11.655753119061728	前设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3004d9f8-be5e-4d36-83f7-1f90885e95ac	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	598.8579413900105	142.36659180540568	27.880118289726973	机翼外段	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	建议减小体积，优化设备连接器	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	7f9fb225-71ea-4fa3-871f-5d05e6d96879	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	517.9893273433514	157.78151630521464	19.178044800758677	机翼外段	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	建议减小体积，优化设备连接器	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0871bc9a-b530-45e8-a543-9b31939bbec3	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	548.4502716853823	242.39815875413348	-25.512718699372517	后设备舱右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	dbb50dbf-0e35-4341-a245-992e89321ddd	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	519.8917576160275	127.85874291253056	-11.056402165117238	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0f112854-df48-426b-ac9e-57bbb96ffb80	27b4b0c3-2fbb-429f-9945-4184450b4a71	636.5874636921639	100.76725249072332	17.12389148777641	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	11ab49bc-fbd3-48fa-9fcf-b93d96511cc4	79db1b8c-7041-4424-a628-39739cd1db75	74.36067932123538	158.85065460045323	-9.75050387046625	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3067d501-5849-4c52-b327-036a499a6afa	27b4b0c3-2fbb-429f-9945-4184450b4a71	679.7399750916536	97.76559279722491	6.127361017440812	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	662fd3bf-513a-4129-890d-f2e60e85f322	79db1b8c-7041-4424-a628-39739cd1db75	90.5396285122415	157.37286031761562	-5.2569154827129765	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6bd67ecd-991e-43a2-ab4c-732246ca2651	27b4b0c3-2fbb-429f-9945-4184450b4a71	716.1529645497071	90.944981633161	-11.008456709870636	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	881876f4-ec7e-4ea7-8100-da658a560ea4	27b4b0c3-2fbb-429f-9945-4184450b4a71	700.8478065036995	107.95545217988743	-22.037355548721678	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a68dbe5d-1d98-4774-ad6e-896fd71eaf72	79db1b8c-7041-4424-a628-39739cd1db75	99.80884287028908	156.5295098524701	-23.940737840842637	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d019e488-269d-45f4-a7ce-1816dcaed895	79db1b8c-7041-4424-a628-39739cd1db75	58.30103382540586	189.5216112884402	-18.652626515098046	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e63e5a1b-cc96-4c72-8f38-81f7ef480697	27b4b0c3-2fbb-429f-9945-4184450b4a71	684.957135574205	112.03246716970779	21.94115837066615	主起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d73f7589-cf7c-4abc-97e8-93ddd0d1d848	27b4b0c3-2fbb-429f-9945-4184450b4a71	672.8123540016413	97.84682375557918	13.063842087322307	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	dcf0f33f-fd3e-4f9e-93b4-bc86e25271d4	79db1b8c-7041-4424-a628-39739cd1db75	71.48822202387348	165.34563774849678	-19.70062843181235	前起落架舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	dd3e0816-6c39-4c1c-a182-a29c1c27475c	79db1b8c-7041-4424-a628-39739cd1db75	86.2266116632785	155.47042212433476	20.360118828319877	前起落架舱	\N	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ee777963-6726-4c2a-9956-c1117142d1e2	27b4b0c3-2fbb-429f-9945-4184450b4a71	666.3011194335288	85.90638814870881	-22.100898697668946	主起落架舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	faa5ce74-b993-4d5b-8c26-9c72623651d1	27b4b0c3-2fbb-429f-9945-4184450b4a71	697.0029824297718	118.59400691411038	-24.660835600404464	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4689163d-a76c-4222-9381-00125cd79e8c	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	513.5483651802675	124.03856762127785	-11.290427374767596	机翼外部	\N	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8d2e1f3b-4f46-4f84-9f93-7465f739a2e2	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	500.1044432259122	126.51833038404281	-19.463315495632973	机翼外部	\N	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	fa4a3d52-8f03-4d36-a160-7eb066b2f00b	39c0da74-eb5c-4690-886e-bed04158e64d	259.4934672531898	217.28573514273887	-16.20692158284337	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	四角螺栓安装	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	90fdb9ea-1c19-4d75-af62-ffcee44ae5c6	39c0da74-eb5c-4690-886e-bed04158e64d	206.64489098395808	222.82961571391778	-16.328259301546353	左设备架	\N	\N	标准托架安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	394f583b-a892-4241-a46e-f6defc48a3bd	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	602.1212467732308	240.85179847609635	-20.23228796115689	外部	\N	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	03e0d842-ce48-450d-a422-3bd8c57bc8bc	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	283.6449179426325	115.51040873610323	-20.392964418889648	外部	\N	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f70fce0c-92c8-4f93-8156-3fb9f80946ec	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	580.6746296852957	223.19292764223366	9.652770361856128	后设备舱右设备架	\N	\N	2MCU托架安装，A类锁紧器	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	9cfc825b-5366-4da3-9eee-0372bd71f085	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.8691714087958	223.88709881231534	29.62958597713194	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0b0f3f44-ba70-4b00-b998-d363b92a0f54	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	544.3652439438324	222.90826784413318	7.852477686685582	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2242ba2b-8ae5-41d8-8583-d0ff6345274d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	549.8106885008718	219.1657478064353	-4.755299457442931	后设备舱右设备架	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	41a3a168-863c-4bb7-b638-d728801fdca7	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	269.0956686864634	97.85176808131838	-8.470393176882919	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	69b68972-e695-42f2-a584-e83cd7ec4984	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	535.530131696311	207.6587585299607	-21.923620546406976	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d8216ddc-40b1-4f75-84ae-b677def29015	27b4b0c3-2fbb-429f-9945-4184450b4a71	633.9396457730567	89.9362965323041	22.512205690641544	中设备舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	053abee4-0698-4072-b75f-46c3a2b67b4a	1ff1548b-395b-49be-a6c6-a9e8b7fec947	450.298613923545	130.33065377634904	5.233819677894431	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2ac1d2da-e51e-4b60-8386-4bde9ae88f1e	1ff1548b-395b-49be-a6c6-a9e8b7fec947	454.81399736089054	128.80660521888743	23.13003649660027	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	31f3eb99-b52f-442f-9c93-da9242674a31	1ff1548b-395b-49be-a6c6-a9e8b7fec947	478.5754214765601	128.05252424094027	-11.800500898559058	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4d0b4b83-716a-4c0d-b4d5-5e705048f8ca	1ff1548b-395b-49be-a6c6-a9e8b7fec947	490.7644418489467	111.86497217168994	-0.685633364943623	2号短舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	660b795a-7fe8-4963-83c7-c9ae3ef0e61d	1ff1548b-395b-49be-a6c6-a9e8b7fec947	534.7787331761908	126.39549672761453	-2.6173030511415334	2号短舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6946b7e3-b04b-41ff-8247-0ae3e3deba14	1ff1548b-395b-49be-a6c6-a9e8b7fec947	474.65781114374494	98.7139296224257	2.9512018352626654	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	87cd84b2-4f89-431b-9493-bf83aeaa07c0	1ff1548b-395b-49be-a6c6-a9e8b7fec947	466.6194686651321	130.5901516521928	2.3754386618877206	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	96824614-3718-4267-a9bd-88676ce028fa	1ff1548b-395b-49be-a6c6-a9e8b7fec947	464.4908272801581	107.00125130429946	5.849754258586209	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	9c627aff-81c5-49a7-b0e7-42138856f165	1ff1548b-395b-49be-a6c6-a9e8b7fec947	544.0987119345122	98.54824161902428	19.945869560415787	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a1b2f301-4d3e-451a-84be-7e1cf01e3421	1ff1548b-395b-49be-a6c6-a9e8b7fec947	542.957691242635	112.71363397415122	3.711048047970259	1号短舱（机翼内侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ce4cf040-fd86-4700-a7c0-f7021fce2b5c	1ff1548b-395b-49be-a6c6-a9e8b7fec947	506.41098833928834	131.73674923498464	-15.704116570116556	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e8bbf27d-4b02-4cb5-87fb-21630f450c85	1ff1548b-395b-49be-a6c6-a9e8b7fec947	538.1288154506002	97.03598268341943	-29.782332807326668	5号短舱（机翼外侧）	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e87e7012-682d-42da-afa4-b09d3d29d4af	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	551.2732937375836	221.02068140286065	2.0180625676293715	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	A类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	551a5a6a-195e-4db4-916d-69635c8ece76	dacf6d7d-1e58-46f8-ad30-da511844cfba	575.9854584798665	141.01340463597649	19.725768241547698	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8f1e9383-56f2-499d-a896-5b1a22be5e98	79db1b8c-7041-4424-a628-39739cd1db75	83.93106036441998	164.5091389869372	-21.77814815481362	前起落架舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3e2409ca-018f-4eec-83b9-6cd8a6b4dc94	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	623.2422898379954	239.94495947434163	5.236925550507095	后设备舱右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d14f9046-a803-4928-9534-57de722593c8	dacf6d7d-1e58-46f8-ad30-da511844cfba	508.236661926822	153.17370734314088	27.835953363457833	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e2b7382d-4795-4175-9165-85926e956486	dacf6d7d-1e58-46f8-ad30-da511844cfba	520.5456916549525	147.72886426940218	-28.434996193188233	TBD	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ec281aff-e7a4-4bfc-a845-e9d33519e36d	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	508.38737816125814	123.98476589845933	-18.622479923093636	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-螺栓螺母安装	\N	\N	\N	\N	\N	安装角度调整	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ec589b04-4108-4095-b955-48ba73162d3d	39c0da74-eb5c-4690-886e-bed04158e64d	209.5607430862599	198.64228732180692	-10.110173474411202	右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	非标托架，C类锁紧器	面搭接	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	05fe5a5e-86e1-4782-8b50-85364c51320a	39c0da74-eb5c-4690-886e-bed04158e64d	249.29281236166366	230.36193996649325	-18.862822221900046	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	2MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4a6c4183-0e81-4c9b-bbd9-1be9e9ae7dea	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	581.9584838118068	241.20127425060497	-22.47785030832695	后设备舱右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	非标准托架安装	线搭接	C类	\N	\N	\N	建议改成推拉式托架形式	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a3a4610a-f956-4b7e-be18-6212d74eb05f	39c0da74-eb5c-4690-886e-bed04158e64d	244.1034346650971	203.02099942843748	25.716636844744592	左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	3MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	eadc600f-53ea-4b4c-b954-712bb5bfe17c	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	576.3184642739127	158.1447071136588	-6.457780181425992	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330搭接线	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c7277938-188a-48c9-ba0e-f08d2156a100	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	320.89453937025996	105.15356003077618	0.46760454319808886	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	799bbd94-6e70-4449-a4cd-4c106653c7b3	39c0da74-eb5c-4690-886e-bed04158e64d	245.1843370574814	214.65535551728263	-7.116942994977379	左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	非标准托架安装	线搭接	C类	\N	\N	\N	减小设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	66c2b44b-0e1b-438e-a99f-f53684c902e7	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.609645236749	230.75384321123778	-26.13356954269242	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	紧固件-螺栓螺母安装	线搭接	S类	\N	\N	\N	增加红光防撞灯固定底座	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e375d76e-c09c-45f3-bb3b-6b43b6e6b7ce	79db1b8c-7041-4424-a628-39739cd1db75	84.58355725992695	166.40408232158543	-26.077924480478195	前起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	紧固件-托板螺母安装	面搭接	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	272e7215-7f69-4954-9e41-46f1eb35788d	79db1b8c-7041-4424-a628-39739cd1db75	12.988430931958632	187.85170890843872	15.340591876273173	前附件舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2d6d0f13-5ff5-4044-aa23-0af4b2c6c52c	39c0da74-eb5c-4690-886e-bed04158e64d	217.27305718965064	214.93068812533278	11.828618643488504	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	321ad9fd-0ebd-4b8e-8c49-c76529e22abb	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	591.8181060374905	222.43522944762512	21.12974806652408	后设备舱右设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	3MCU托架安装，A类锁紧器	面搭接	CPS1330设备壳体-托架-机体支架面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	56c2dabd-ffa6-4c07-98a0-9fb73715e83b	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	315.8716217074119	97.86902373283723	16.52248433389726	前设备舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	标准托架安装	线搭接	\N	\N	\N	\N	改成标准ARINC600，建议缩小体积	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6035443e-99da-4c68-ac6d-694baa6c3daf	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	613.4933388199787	234.6102425831783	23.44227516575735	后设备舱左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	非标准托架安装	线搭接	C类	\N	\N	\N	建议改成推拉式托架形式	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c983012b-514c-4b48-af97-3f7344a1ac2d	39c0da74-eb5c-4690-886e-bed04158e64d	243.48614816460594	218.41733717544304	24.599604486518317	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	S类，壳体搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d3a95ede-6378-40ad-9316-422a9750e214	79db1b8c-7041-4424-a628-39739cd1db75	107.75543004889067	184.60656189844966	9.70580085498819	前附件舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-托板螺母安装	线搭接	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e600b367-8f84-4d95-ad42-96afa4cfb9dd	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	349.549985982904	82.63014877900994	-8.794764575662974	前设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	标准托架安装	线搭接	\N	\N	\N	\N	改成标准ARINC600，建议缩小体积	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8ed8b7ec-c487-40aa-aaab-3340cdb71621	39c0da74-eb5c-4690-886e-bed04158e64d	213.10019277115492	197.24576095849778	18.313743330874914	左设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	非标准托架安装	线搭接	C类	\N	\N	\N	减小设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	be1aad53-d2c4-4407-87dc-317a81bfed71	39c0da74-eb5c-4690-886e-bed04158e64d	209.1470124621938	232.49708681206613	-25.941894583004782	地板上	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e632fb91-bc56-454e-a5be-f2057f984669	39c0da74-eb5c-4690-886e-bed04158e64d	214.55632057790106	214.73225834112367	-25.74677296648815	地板上	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	eddb07a0-7e70-4185-a399-fd57b0360365	39c0da74-eb5c-4690-886e-bed04158e64d	239.5581439067377	199.11949659221838	-15.43248339378408	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	0bf86a96-c097-4533-99d4-58e51b33328b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	502.45719729257536	156.23142954454647	16.77043805231243	中央翼盒	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类	\N	\N	\N	减小设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2074a91a-9c58-4886-826a-cab4fa9c8921	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	548.8819398030851	129.9770003356163	-8.588173270888337	机翼外部	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	紧固件-螺栓螺母安装	线搭接	S类	\N	\N	\N	增加白光防撞灯固定底座	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b3b321a1-ecca-4407-91b0-8240e914593b	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	540.9622280232812	147.1152733303697	20.81682718151675	机翼外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	紧固件-托板螺母安装	线搭接	S类	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	124f1c0e-c7d5-4529-b729-0e6f9c163e9d	668881a2-a105-4e0d-ba81-aae942960a8e	1022.6028345861074	198.66807942662666	12.411594830417535	垂直尾翼	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	609ff014-4e7a-4b52-820d-70d0643054ba	668881a2-a105-4e0d-ba81-aae942960a8e	996.0475197956687	203.68660372109463	17.832234399460788	水平尾翼	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	838017f2-5656-44bb-873a-ee3e8114141d	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	590.6105378071709	140.6865779613837	28.056980214067053	机翼外段	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	308dad5a-ce5e-45c0-a4d9-ccf869c4e874	39c0da74-eb5c-4690-886e-bed04158e64d	272.8065658009308	202.34692196677034	-26.546077219925273	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b8766393-40b7-406b-a18c-d2a13f1f2e57	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	541.2429307332338	225.27137342749268	-0.6109447218227189	后设备舱右设备架	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	面搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c6e08321-7690-4ca3-961f-025888f915b3	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	348.2723533346255	116.80960248239214	19.828871412513763	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	A类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f1efdd80-24ef-4363-83c7-85da0a3f8fe4	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	563.6556072989794	243.5848973399896	-22.405043180746716	后设备舱右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	面搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	ae39aa76-ecd7-4e51-a3d1-7c43090402f9	39c0da74-eb5c-4690-886e-bed04158e64d	221.1206011140108	206.07456472012427	6.635031392824054	右设备架	\N	\N	紧固件-螺栓螺母安装	面搭接	C类	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2c8c347f-2140-4e3e-819e-c21df7259402	39c0da74-eb5c-4690-886e-bed04158e64d	235.71676556515524	234.01665648142296	20.992325118018073	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6fdbb16f-35d9-485c-9216-6774f0684d8c	39c0da74-eb5c-4690-886e-bed04158e64d	239.91627564441112	233.57208037834945	-11.132604527987496	地板上	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	890c2523-4adc-47ed-8f21-961a0a815b33	27b4b0c3-2fbb-429f-9945-4184450b4a71	659.588402807582	117.19284275791398	9.436418681006607	主起落架舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a1dae93d-b8e6-4cfc-a25b-fedaf6b3cfc5	27b4b0c3-2fbb-429f-9945-4184450b4a71	693.0872422265032	115.77125386439678	0.9339634561218801	主起落架舱	\N	\N	\N	\N	CDS2001	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	181449ec-a06d-46d5-b5ba-8ccf06bd425f	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	314.1289370761357	106.02596413283726	-22.754661237121883	外部	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6e0ca76a-dbfb-4902-9f24-e43ec75e48de	27b4b0c3-2fbb-429f-9945-4184450b4a71	692.5837148572443	115.80667431530675	-15.482541042769407	外部	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8374e76d-fca2-4bc9-94e7-61b8721ee94a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	532.689063067856	221.8018088664602	11.538643108715732	外部	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b64537f4-8c11-4d97-a69b-2e1166979199	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	575.1417715048777	244.100586327616	24.806241663696163	外部	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e2a8449d-718c-426d-ba6d-aa5879a54694	668881a2-a105-4e0d-ba81-aae942960a8e	936.0275706939824	191.67470435682452	25.079138256739185	垂直尾翼	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	e448eb31-370a-43de-a5f6-07a999e589af	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	359.89169405671345	85.89672480903077	17.90649026290876	外部	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	78a01034-9fbf-443f-a193-7aed540cd97a	39c0da74-eb5c-4690-886e-bed04158e64d	235.37577281243944	219.02985768460815	-4.316603731290883	左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	三角螺栓安装	面搭接	CPS1330	\N	\N	\N	建议调整为压接连接器	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	82d26b07-ac4f-42e7-b560-f666e34c2c0a	39c0da74-eb5c-4690-886e-bed04158e64d	219.96952967750408	209.41187287684062	13.224302472935477	左设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	三角螺栓安装	面搭接	CPS1330	\N	\N	\N	建议调整为压接连接器	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	35f40f9f-c1c3-4dd4-a75b-c38530fdc808	79db1b8c-7041-4424-a628-39739cd1db75	82.56412982216197	156.74883963446422	1.9277001966686989	前起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	CPS1331，设备壳体面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	95f8fcf9-dfa5-496e-95a4-1cc204b488a8	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	347.10081864044594	104.33780958625344	-22.080831093922136	前设备舱	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	db3eec35-d082-45f5-b88c-662e141ada3b	27b4b0c3-2fbb-429f-9945-4184450b4a71	644.0295155125511	109.53147099066989	-13.614045272783514	主起落架舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	60368506-db53-4a47-a95d-c3945a9411ee	79db1b8c-7041-4424-a628-39739cd1db75	83.23323934268704	187.5771711324238	1.1594030498678194	前起落架舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	CPS1330，设备壳体面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f2ecd438-cfbc-4d47-8911-de904bdbe87c	79db1b8c-7041-4424-a628-39739cd1db75	45.20644503589787	174.08186591179245	-0.5550226868235981	前起落架舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3f246d7f-fb50-4738-9951-55f78b7d8124	27b4b0c3-2fbb-429f-9945-4184450b4a71	696.1337005306411	106.17614363814508	-20.4955864343504	主起落架舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	f4baca8f-fc97-42ee-8e7c-9e8384ffea2e	27b4b0c3-2fbb-429f-9945-4184450b4a71	670.8960055623988	84.576776462466	8.43114568361004	主起落架舱	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	CPS1330	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4c493c59-f2c3-40d5-840f-3c775da83ab3	1ff1548b-395b-49be-a6c6-a9e8b7fec947	498.6797734100965	123.5130818019055	14.038347076280822	1号短舱（机翼内侧）	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	\N	\N	C类，28V负极在机身部分通过ERN回流；\nR类、H类、S类，壳体搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6d91e335-b44e-4928-b37d-6dc4aea90822	27b4b0c3-2fbb-429f-9945-4184450b4a71	626.6569014461659	81.47457164754063	-15.830874597931292	中设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	b8fbc68a-0401-4d91-a7e5-72137d7070d1	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	263.27514854052646	85.14267316143271	-2.6847033267906113	前设备舱	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	bb57baa7-e178-43d4-84e1-9dc7c73a95ea	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	306.5310855136836	102.25752975393219	-12.935762641762203	前设备舱	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d87dd885-204b-4088-ad97-449cff1d3596	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	356.32700276528385	90.18333119275844	-19.358355689897436	1号动力电池舱	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	3e1d143c-30c7-482b-aa93-874cc83155c5	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	356.90204307727566	82.04779672003495	-29.635729024814236	前设备舱	\N	\N	\N	\N	无需求	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5e463e2f-7daa-422e-8eef-0df56eaa629c	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	284.19768902331487	101.88159608012194	18.30264149995231	前设备舱	\N	\N	\N	\N	无需求	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	2f9d8862-798e-4881-babf-034301d2d432	39c0da74-eb5c-4690-886e-bed04158e64d	269.64979249982514	202.6900206817645	-4.0464969776535185	控制面板	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330壳体面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	32fa0895-6be5-47b2-a0db-ea1f1f45dc3e	39c0da74-eb5c-4690-886e-bed04158e64d	279.34194279245264	232.60123658380195	28.000860846665567	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	CPS1330壳体面面搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	4086a3de-eb3f-4e90-a97e-f515eaf13d97	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	597.048731151173	205.10236756834598	-24.67417174621003	后设备舱左设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	线搭接	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	962509cd-50bc-4781-a07e-67c9810d649b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	589.2571969671059	213.60773480001203	-14.206354225798062	后设备舱盘箱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	99b49e0b-9f8c-4df5-9909-7d2e336c8108	39c0da74-eb5c-4690-886e-bed04158e64d	270.3523085510875	222.8476643118049	-4.370042299256109	右设备架	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	四角螺栓安装	线搭接	双线制\nR H S类，壳体搭接；	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	a52471a6-739b-4943-8668-8f55e6632753	39c0da74-eb5c-4690-886e-bed04158e64d	236.9500745496863	204.55046595984427	8.302115782940817	右设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	两侧出线，六个安装孔，方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	改成单面出线、缩小体积重量	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	12a47dbf-ea2a-4928-96fa-dc56b3c1ce35	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	602.093940623309	207.00100948189834	-7.840144085016622	后设备舱左设备架	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	15e50bff-bb76-457d-931a-ad7bd482d130	39c0da74-eb5c-4690-886e-bed04158e64d	217.71078440678258	211.26494855893776	16.07676821841421	左设备架	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5950dcbc-5e13-4dbc-b7e3-09ab82a8750f	39c0da74-eb5c-4690-886e-bed04158e64d	257.15318253345987	208.0964322605206	-18.75619741800848	右设备架	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	四角螺栓安装	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	83cf0b00-ec68-45a0-a724-8b565d162342	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	585.9371209444623	234.18650876808806	26.821169517481593	后设备舱右设备架	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	方案未冻结	线搭接	C 类\nR H S类，壳体搭接；	\N	\N	\N	缩小设备尺寸，降低设备宽度	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	5afc64af-2c92-4b60-9a98-2d148a79c6a6	39c0da74-eb5c-4690-886e-bed04158e64d	241.9516769838807	203.03997793015103	-22.9868470301003	控制面板	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	1c50a573-ae1f-4782-bb90-81f8dd598ca2	39c0da74-eb5c-4690-886e-bed04158e64d	218.70391915747626	198.13873415735617	-8.514583947713831	地板上	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	48436bf1-4dab-4278-9850-cec39c073dd3	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	547.5474129392678	137.577886816231	1.6261501779002572	中央翼盒	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	NA	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	74da3049-7989-4fa0-952b-749234b9da02	39c0da74-eb5c-4690-886e-bed04158e64d	231.44379233542722	197.09515928657999	-3.3204485595106945	控制面板	e4276060-dc3f-4260-8ff3-3deaaea6bfcc	\N	\N	\N	C类	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	82d81c8a-fc3c-4362-8214-b962d9d00f94	44667fc0-fb14-4ba2-9e5a-f9870438fdb6	567.1687848134533	124.24967233045902	3.204759735322696	中央翼盒	7c32540a-6dea-40ee-be9e-3c9f74f315ee	\N	\N	\N	CPS1330	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	8c23589d-5f8f-4525-bdc0-920f1ab2c533	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	350.7475723556104	89.47514404628473	-10.003289867303685	前设备舱	f306bed4-d0ff-4da8-b013-e8215ba1c213	\N	\N	\N	CPS1330搭接线	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	d26d0aa5-be7e-44d5-bafd-b3da2026be3c	39c0da74-eb5c-4690-886e-bed04158e64d	233.9456594699135	198.67246413201667	-22.041570738650883	\N	5edef345-8ee6-44eb-a458-3bdbb0612a9d	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	df446f5f-9e07-4aae-a38b-fb5e9aef3b29	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	585.3780925443197	242.06931983400875	2.364957560118647	后设备舱左设备架	0bfc8015-1221-4853-8ea8-1f84e1a0ef66	\N	紧固件-螺栓螺母安装	面搭接	S类	\N	\N	\N	\N	f	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	fa2e4d12-8395-4eea-864f-a48e4c6dc1f5	49a3ef4c-177f-49bb-b39f-fc33eac3eb66	300.9107203630587	94.39793290289404	-23.585384455841684	前设备舱	1dd8298e-edf2-43a0-ad17-cb82a478fcfa	\N	\N	\N	CPS1330	\N	\N	\N	需改为带托架的标准ARINC600机箱/国军标441标准尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	049f7c9a-5639-4284-b964-c47dd8f68f2a	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	608.5951274827587	217.21156148476163	29.577402349476287	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	068f8a07-1907-46a1-b93d-4c7098bd90ab	39c0da74-eb5c-4690-886e-bed04158e64d	274.7956207671108	227.92950110401378	9.440313406597895	左设备架	\N	\N	四角螺栓安装	线搭接	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	438c3120-36ee-4580-9758-3597f62fd65d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	566.6747310544399	233.4900151378191	-23.57803621038891	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	536594a1-7a7a-4e64-b837-b0eeed3dec17	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	549.2077647744061	230.18019312668073	-9.905455585240848	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	6edfca52-fd98-4c53-94d8-14f81d0df193	39c0da74-eb5c-4690-886e-bed04158e64d	246.2191779139339	220.20514641951866	-0.19758358897644968	左设备架	\N	\N	四角螺栓安装	线搭接	C类，28V负极通过ERN回流；\nR类，壳体线搭接	\N	\N	\N	需改为国军标441尺寸机箱	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	c44bca34-5667-427c-8bb4-d5440587679d	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	529.911420179558	243.14830538914381	-23.653446033701446	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
5e3005c2-ea68-4206-8b2c-60320af52e86	fd7671f0-2299-43ec-9aa1-77e4c7bbca5b	5e0e94ad-877f-42c4-947a-8a1f4ca52cda	552.3707198669401	244.88920552208913	-2.914941230220901	登机门	\N	\N	\N	\N	R类，壳体线搭接	\N	\N	\N	\N	t	\N	\N	\N	\N	\N
\.


--
-- Data for Name: configurations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configurations (id, series_id, version, status, description, created_by, locked_at, created_at) FROM stdin;
67ffbbe0-1b90-4694-be64-0505c5dde861	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	V1.0-基线	baseline	1/2号机基线构型	f5856ffe-f35d-43f0-96fe-7c0f8f352db3	\N	2026-04-22 03:35:09.472961+00
99579ad8-1b28-4e67-83b6-936455d59421	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	V1.1-0号机	draft	0号机构型（首飞）	f5856ffe-f35d-43f0-96fe-7c0f8f352db3	\N	2026-04-22 03:35:09.472961+00
5e3005c2-ea68-4206-8b2c-60320af52e86	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	V2.0-X号机	draft	X号机构型	f5856ffe-f35d-43f0-96fe-7c0f8f352db3	\N	2026-04-22 03:35:09.472961+00
\.


--
-- Data for Name: electrical_loads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.electrical_loads (id, equipment_id, power_kva_normal, power_kva_emergency, power_kva_max) FROM stdin;
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipment (id, part_number, name, ata_chapter, equipment_type, supplier_id, status, description, created_at, updated_at, name_en, abbreviation_en, internal_number, lin_number, supplier_part_number, dal, equipment_level, is_optional, is_electrical, is_primary_electrical, has_eicd, has_special_wiring, dimensions_mm, is_metal_shell, metal_shell_non_conductive, internal_grounding, physical_characteristics, connector_count, voltage_range, power_redundancy, power_voltage, power_watts, shell_grounding_method, shell_grounding_fault_path, grounding_special_requirements, responsible_person, aircraft_batch, config_category, do160_temp_design_level, do160_temp_qual_level, do160_temp_qual_range, do160_temp_compliance, normal_operating_temp, short_term_temp, ground_storage_temp, operating_altitude, qual_report_number, first_flight_onboard, phase2_onboard, notes) FROM stdin;
1c4ca146-747e-4ef9-80ef-50b5bc183314	2321E01001G900	ELT发射器	23	LRU	\N	approved	区域: 客舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2301U3101	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28068af6-d5af-4304-bd9c-664a29bba94a	2321E01003G900	ELT天线	23	LRU	\N	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2301A3901	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cf6fc01a-24fe-455c-8909-49888a3eacc1	2350E01001G900	音频管理单元1	23	LRU	\N	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2302U2501	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b6b437ad-045d-45f7-9ac8-9956805aeed6	2350E02001G900	音频插孔面板1	23	LRU	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2302D2401	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a6fca9b2-7473-4c49-aa0f-4d0aa4a980a6	2350E02003G900	悬臂式耳机1	23	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2302R2101	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f1b7747d-cf58-4346-ba82-6851aaad0595	2350E02005G900	手持话筒1	23	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2302D2101	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6e476b86-56a0-40cb-a81a-86fb3912f774	2350E02007G900	扬声器1	23	LRU	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2302E2101	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aabcfd9d-8180-4fa5-9dc2-7f4044007c06	2362E01001G900	后缘型静电放电器1	23	structural	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2315G6201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
43475883-4fb9-41a0-aa52-ab323bcade9a	2393E01001G900	5G ATG机载CPE	23	LRU	\N	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2301U3601	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0164952a-4810-4806-8b13-ba8fc891d32a	2519E01001G900	中央操纵台控制板	25	LRU	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2401	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
26d4e068-b246-4f7e-b3db-a7df776ca944	2519E02001G900	应急控制板	25	LRU	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2403	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
03688f32-e6ba-400d-bb74-9627f4e3bafb	2519E03001G900	电源控制板	25	LRU	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2405	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ca95fc08-9d85-4f02-85c7-f310add5f986	2511E01000G200	驾驶舱天花板支架	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2101	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b89164e5-b504-4dd0-a9d9-8fedd94fd000	2511E02000G200	驾驶舱天花板	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2103	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8b59584a-ad4c-4a2b-a379-13bd9b73e6f3	2511E03000G200	驾驶舱窗框装饰罩	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2105	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1719f0eb-1418-4b9d-8f19-722a35f84312	2511E04000G200	驾驶舱窗框装饰罩支架	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2107	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e5cf45d-15ad-4331-b15f-f1048bc7db99	2511E05000G200	驾驶舱后装饰板	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2109	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d7713356-afc5-433b-9613-e7495ee95f47	2511E06000G200	遮光罩装饰	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2111	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24f2c420-9982-4baa-a486-c63987d3322d	2511E07000G200	中央操纵台装饰	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2217	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3754214b-1053-411a-bb0b-c9252dff46bc	2511E08000G200	左侧操纵台	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2219	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
19e3e232-9e7f-4629-ac14-6e35918d7e69	2511E09000G200	右侧操纵台	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2221	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
807b2260-9b40-4c13-9266-34d9bce16509	2511E10000G200	左侧操纵台支架	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2223	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3d7a2c27-0d7c-4664-9094-b971554e992a	2511E11000G200	右侧操纵台支架	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2225	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aa71ab81-e66d-4aeb-baa7-dfbd0dcd54d0	2511E12001G900	遮阳板	25	structural	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2409	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
501a4a34-f498-4a32-909f-29cb636170ec	2511E13001G900	目视定位仪	25	structural	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2113	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ec440b04-68ec-4323-b6ac-f924d6b3bb02	2511E14001G900	驾驶员辅助手柄	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2227	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3b2ff700-142e-48ef-83da-ecf917dfd69c	2511E15000G200	驾驶舱门	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2229	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
901ab551-3d4f-4123-9003-173070b8e4c2	2511E16001G900	驾驶舱地板覆盖物	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2231	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
669c55a8-bf33-4091-98dd-ceb93d933e2c	2511E18001G900	驾驶舱标记标牌	25	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2501U2235	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
75d609ea-6735-4e45-8425-7e1c5e283f26	2393E01001U900	功率放大器	23	LRU	57467571-3567-4c55-b12a-c6e8b0256148	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	User Equipment Power Amplifier unit for Airborne	UPA	1T-2391	2301U3201	129591231000	D	\N	f	t	f	\N	\N	\N	t	否	单点接地	设备安装在面板或设备架上	6	\N	\N	\N	\N	线搭接	是	\N	\N	试飞版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c08abfc-0e8e-4b59-a56d-bcb371d8d3d0	2393E01003U900	5G ATG全向天线	23	LRU	7ef007c4-6f7f-49de-b1b1-5fddff84fe65	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	5G ATG Omnidirectional Antenna	5G ATG OA	2A-2391	2301A4901	AS-OA4890AKG7-2SMAK	D	\N	f	t	f	\N	\N	\N	t	否	NA	无源设备	2	\N	\N	\N	\N	无	否	\N	\N	试飞版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
957836b3-3f19-4a30-9223-5667f6b4afc1	2393E01005U900	电源转换模块	23	LRU	bdfee5ef-7a79-4f62-b82c-fc6e6e9e4644	approved	区域: 客舱-后设备舱盘箱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Power Convertion Unit	PCM	2T-2391	2301T3201	SI28R3-23040115	D	\N	f	t	t	\N	\N	\N	t	是	电源地为独立地，机壳地为独立地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	4	18-32V	\N	\N	\N	面搭接	否	\N	\N	试飞版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
069cb255-137d-4af4-942c-9a008d3e2e91	2461E01003G900	右配电盘箱	24	LRU	09fe854f-dbe0-4ee8-8170-02c7c1b33439	approved	区域: 客舱-后设备舱盘箱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Right Distribution Panel	RDP	U-2402	2401U3403	TBD	B	\N	f	t	t	\N	\N	390*460*200	t	是	互相隔离	a) 设备安装在面板或设备架上	21	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
77ea8529-8214-4479-93d1-4077f1a0470a	2791E01003G900	备份飞控计算机	27	LRU	\N	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2701U2505	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
695cb5ad-954d-4cf3-8363-92ffc74b12d7	2793E01001G900	位置传感器6	27	LRU	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2702U6211	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7988f9ed-45aa-4a3c-bcad-4872f4a98a4f	2793E01003G900	位置传感器3	27	LRU	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2702U6205	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
704f48ec-3ae7-409c-870b-83a63971dd3f	2793E01005G900	位置传感器5	27	LRU	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2702U6209	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ffc2cb35-1056-4451-82aa-c7810ab08d14	2793E01007G900	位置传感器7	27	LRU	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2702U6213	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
67b17f78-ab6a-45c5-acd5-da75df6c1f69	2793E01009G900	直接模式速率传感器（DMRS）	27	LRU	\N	approved	区域: 机翼-中央翼盒	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	2701D6101	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
63cfaf67-6676-4ece-ab8e-f68aca7f4fc9	3040E02001G900	风挡雨刷臂1	30	structural	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3002X1903	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
97fc5cff-4840-494d-917d-fefa06476cb7	3040E02002G900	风挡雨刷臂2	30	structural	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3002X1905	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1809a66a-37dc-4304-8725-529157c5ab8b	3040E02005G900	风挡雨刷片1	30	structural	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3002X1907	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cfefd2dc-8482-4ddf-a86e-c2b2c639af81	3040E02006G900	风挡雨刷片2	30	structural	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3002X1909	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10fa1eff-0a3d-4720-a5c7-e97a9a02236b	3160E01003G900	机载多功能显示器	31	LRU	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3101P2403	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
650667a7-aea0-45c1-8ffa-7732a6651947	3210E11102G900	右主起落架支柱组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3201X5102	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
385a8fcb-2273-4646-8c51-3b7bffb42ee5	3210E11200G900	左主起落架摇臂组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3202X5101	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f1e718ab-8470-4cab-9121-7633169b9fec	3210E11300G900	左主起落架缓冲器组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3202X5105	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6ddded46-b3f3-4ad4-b231-4dcc9cc51ec2	3080E01005G900	结冰探测棒	30	LRU	f7019282-f81d-4963-9d48-573ad22a9fd7	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Ice Indicator	IIND	1D-3003	3001U1901	Y/GJB-38	B	\N	f	t	t	\N	\N	\N	t	是	电源地、壳体地	设备安装在金属结构上， 1 A ≤设备故障电流<5A	1	18~32.2	\N	\N	\N	面搭接	是	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0a39cb2a-3bae-4b14-bba6-4fed248c663c	3040E02007G900	雨量传感器	30	LRU	6dd4c69a-24fd-42cc-957e-168d00a426a5	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Rain Sensor	RS	1D-3029	3001X1901	TBD	D	\N	f	t	t	\N	\N	\N	f	是	信号地	设备直接安装在碳纤维复材（CFC）结构上	1	12V	\N	\N	\N	TBD	否	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
001e2e63-99ad-4afd-9b11-880de31e3361	2721E01001G900	脚蹬单元	27	LRU	4e51aac9-1fa8-427e-92a8-c1f6429c6cf7	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	PEDAL	TBD	1U-2721	2702U2201	TBD	B	\N	f	t	t	\N	\N	\N	t	否	机壳地	1-b	4	7	\N	\N	\N	面搭接	TBD	无	\N	TBD	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c0f9627f-0926-4cec-9f50-7bdb7418b9a9	2791E02001U900	飞控数据记录器1	27	LRU	5021d8dc-cd7d-4b20-b0e0-7033d7da92ac	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Flight Control Data Recorder 1	FCDR1	1U-279	2702U3201	ADT003-2532100(1)	其他	\N	f	t	t	\N	\N	\N	t	是	信号地	a	5	5-28V	\N	\N	\N	线搭接	否	\N	\N	试验试飞	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1480efe5-bb89-4038-b472-bf3f88dea12d	3080E01001G900	结冰探测器1	30	LRU	f7019282-f81d-4963-9d48-573ad22a9fd7	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Ice Detector1	IDET1	2D-3001	3002U4101	GJB-17	B	\N	f	t	t	\N	\N	\N	t	是	电源地、信号地、壳体地	设备安装在金属结构上， 5 A ≤设备故障电流	1	18~32.2	\N	\N	\N	线搭接	是	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e86889d5-e732-497a-9660-1c4b980fd60a	3080E01003G900	结冰探测器2	30	LRU	f7019282-f81d-4963-9d48-573ad22a9fd7	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Ice Detector2	IDET2	2D-3002	3002U4103	GJB-17	B	\N	f	t	t	\N	\N	\N	t	是	电源地、信号地、壳体地	设备安装在金属结构上， 5 A ≤设备故障电流	1	18~32.2	\N	\N	\N	线搭接	是	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9e5b1d6f-ede3-46a9-8c63-03729ff3380e	3210E12001G400	左主起落架舱门机构组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3201X5103	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
94d46a33-3a78-4cf9-88db-ce3c0eecdbf1	3210E12002G400	右主起落架舱门机构组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3201X5104	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d16fce2e-7296-4860-b5dd-4ec012afe784	3210E13100G900;3210E13200G900	左主起落架侧撑杆组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3202X5109	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
538da4b7-8817-4b62-a98d-df1ff1d42505	3210E15000G900	左主起落架锁前弹簧组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3204X5101	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a64b3184-7172-46ed-bf3a-3f9ab3c30969	3222E00000G400	前起阻力杆组件	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3201X1203	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
04f5f806-75e4-475a-b51d-cb322a5a6d9e	3224E00000G400	前起舱门机构组件	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3201X1207	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bb7abee2-9523-4ae7-9c4f-a002660df08c	3317E01003G900	地板灯1	33	LRU	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	floor light 1	TBD	1L-3301	3302L2201	TBD	E	\N	f	t	t	\N	\N	\N	f	\N	电源地与机壳地在设备内隔离	1) b)	\N	22V~30.3V	\N	\N	\N	线搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3c8924d4-03ef-47d3-83be-22891377ac32	3317E01005G900	脚蹬灯1	33	LRU	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	pedal light 1	TBD	1L-3305	3302L2203	TBD	E	\N	f	t	t	\N	\N	\N	f	\N	电源地与机壳地在设备内隔离	1) b)	\N	22V~30.3V	\N	\N	\N	线搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5ff466ee-4105-4fc3-b2c1-639c43a11b29	3314E01007G900	左右操纵台泛光灯1	33	LRU	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	console flood light 1	TBD	1L-3306	3305L2201	TBD	E	\N	f	t	t	\N	\N	\N	f	\N	电源地与机壳地在设备内隔离	1) b)	\N	22V~30.3V	\N	\N	\N	线搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d7007226-4f21-429d-afbf-ed94ceefea66	3314E01001G900	驾驶舱顶灯	33	LRU	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Overhead Panel Light	TBD	L-3303	3303L2101	TBD	E	\N	f	t	t	\N	\N	\N	f	\N	电源地与机壳地在设备内隔离	1) b)	\N	22V~30.3V	\N	\N	\N	线搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bb3fc56c-76bd-494d-a7ca-b2d8ccf5f0f9	3245E01000G900	左外机轮刹车装置	32	LRU	4ced0b23-4e99-4177-8ff5-ca422e0589e5	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Outboard Brake Assembly	LO BA	M-3205	3204M5101	XHJ/LF-033	其他	\N	f	t	t	\N	\N	\N	t	是	电源地、信号地	1)(b) 2)（c）	6	18V-32V,192V-327V	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9fdaf6f9-f4a5-4412-93b9-d60a5fa2bd8b	3341E03001G900	左翼尖灯罩	33	LRU	\N	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3301X6905	\N	\N	\N	\N	t	t	\N	\N	379*494*183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
af8276d8-ac7a-4218-a03f-e3695508adab	3341E03002G900	右翼尖灯罩	33	LRU	\N	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3301X6907	\N	\N	\N	\N	t	t	\N	\N	379*494*183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7596c827-3493-432b-a84b-f48315379a75	3342E03001G900	左翼根灯罩	33	LRU	\N	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3301X6901	\N	\N	\N	\N	t	t	\N	\N	316*362*189	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5a525990-1de0-48cc-95dc-78c24253da53	3342E03002G900	右翼根灯罩	33	LRU	\N	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3301X6903	\N	\N	\N	\N	t	t	\N	\N	316*362*189	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
635d85f4-4741-4d48-a482-58fb217f2208	3300L8901	左标志灯	33	LRU	\N	approved	区域: 尾段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3300L8901	\N	\N	\N	\N	t	t	\N	\N	175.6*175.6*128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b0909d0d-8a59-4ddb-b1df-032ab378f36d	3300L8902	右标志灯	33	LRU	\N	approved	区域: 尾段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3300L8902	\N	\N	\N	\N	t	t	\N	\N	175.6*175.6*128	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5c843dc6-e31c-4120-86fa-a8de99eccff5	3300L8903	左探冰灯	33	LRU	\N	approved	区域: 左侧前机身	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3300L8903	\N	\N	\N	\N	t	t	\N	\N	192*110*75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
81900d04-81e6-450f-8d39-895ad28b6438	3300L8904	右探冰灯	33	LRU	\N	approved	区域: 右侧前机身	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3300L8904	\N	\N	\N	\N	t	t	\N	\N	192*110*75	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d9f04d9c-329c-432e-b306-a6744942b132	3411E01001G900	总压传感器1	34	LRU	\N	approved	区域: 驾驶舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3403U2901	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
925380ec-cd31-4ff1-9446-0875975e1e58	3411E01005G900	总温传感器1	34	LRU	\N	approved	区域: 驾驶舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3402U2901	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b7067f22-fe3f-416a-872c-ae7048c4826f	3411E01007G900	攻角传感器1	34	LRU	\N	approved	区域: 驾驶舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3403U2907	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1909fcff-23cf-4d59-8fbe-f8f35c54664b	3411E01009G900	侧滑角传感器	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1901	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24de86bf-a2a0-4bab-970c-06cceec4e6c9	3411E01011G900	静压传感器1	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1903	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8aca1953-2c88-47bb-a776-03bdaa34c4be	3411E01013G900	静压传感器2	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1905	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f97b7ce5-2e0e-4919-846d-b2a08467c731	3411E01015G900	静压传感器3	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1907	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aa813874-eaa8-426c-b293-e8d6a2079624	3411E01017G900	静压传感器4	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1909	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
24edad55-612b-49aa-9a14-8c9c8d167632	3411E01019G900	静压传感器5	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1911	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2b58d018-ea3f-470c-b396-664a5301bbd8	3411E01021G900	静压传感器6	34	LRU	\N	approved	区域: 机头-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U1913	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
681850ca-ba18-4be6-b7d4-56a8cc8e5264	3411E02001G900	大气数据模块1	34	LRU	\N	approved	区域: 机头-前附件舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3409U1301	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f61ab3f2-8b9f-4739-b3c8-67a798dcf728	3421E01001G900	综合备份仪表	34	LRU	\N	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U2203	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7961e6b5-d00b-42e0-b440-e3df0f3fbd12	3422E01001G900	磁罗盘	34	LRU	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U2205	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
16d889c4-748b-42ef-a1bc-aa48a11542e7	3431E01001G900	仪表着陆(LOC/GS)天线1	34	LRU	\N	approved	区域: 尾段-垂直尾翼	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3402A8201	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f8b9698b-13f0-4a0c-9ec4-befba4222db2	3431E01003G900	LOC/GS天线合路器	34	LRU	\N	approved	区域: 尾段-垂直尾翼	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U8201	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18aaf178-059c-4dd3-8607-60ec26d863f8	3446E01001G900	交通监视处理机	34	LRU	\N	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401U2509	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
43a3828f-b9f8-4cc3-9c4e-c0f1ecd069ef	3446E01003G900	交通监视上天线	34	LRU	\N	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401A3901	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4a6330dc-54aa-4502-941a-5ecca30b43b6	3441E01001G900	气象雷达	34	LRU	\N	approved	区域: 机头-雷达舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3401A1103	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aa65930f-304c-4e52-b6c4-062b85a25766	3458E03001U900	RTK机载接收机1	34	LRU	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	3402U3205	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fc6e049d-5609-4808-9f7d-27a9abbf7a2a	3451E02001G900	VHF天线1	34	LRU	\N	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	VHF Antenna1	VHF1	1A-34103	3403A3901	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
29dfaf3c-8d81-4e14-8dec-b334430f74c7	3431E02001G900	LOC/GS功分器1	34	LRU	7f584876-1db4-42bc-8d45-dd195dcab928	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	LOC/GS Signal Splitter1	LOC/GS SSPL1	1D-34102	3402U3601	\N	C	\N	f	t	f	\N	\N	\N	t	否	机壳地	NA	3	NA	\N	\N	\N	面搭接	否	NA	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
69854094-3a63-43ee-ae98-f6dad96055d3	3341E03000G900	白光航行灯（垂尾）	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 尾段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	White navigation light	WNL	1L-33011	3301L8901	AVE-POSW-74G-401	D	\N	t	t	t	\N	\N	47*57*75.3	f	\N	\N	\N	\N	28V	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
832b98c0-92aa-41ba-a780-b53506f485bc	3341E01001G900	红光航行灯（左翼尖）	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Red navigation light	RNL	1L-3302	3301L6901	AVE-WPSTR-54G Mod(4)	D	\N	t	t	t	\N	\N	100*46.2*34.1	f	\N	\N	\N	1	28V	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c32e680f-4b7c-4b7b-949b-96cac4efa432	3317E01009G900	驾驶员阅读灯1	33	LRU	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	cockpit reading light 1	TBD	1L-3304	3302L2101	TBD	E	\N	f	t	t	\N	\N	\N	f	\N	电源地与机壳地在设备内隔离	1) b)	\N	22V~30.3V	\N	\N	\N	线搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a6994310-6bd2-4350-b22b-f31bc73f88ab	4230E02001U900	TSN数据记录器1	42	LRU	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	4202U3201	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b1aff6df-38ad-427a-8f5b-ccd53559a2ca	4621E01001G900	便携式电子飞行包1	46	structural	\N	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	4602U2203	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1cea840f-bf72-437f-8e91-ac8633316a95	8600Q5601	构型A动力电池冷却系统	86	LRU	\N	approved	\N	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8600Q5601	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
75b44e92-48d1-42a2-8f07-48647fc088ce	8621E04100G200	800V电池包缓冲层1	86	structural	\N	approved	区域: 下机身前段-1号动力电池舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8601X4201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dc931f6f-4820-4ab2-8532-77aa5a48ee38	8621E04200G200	800V电池包缓冲层2	86	structural	\N	approved	区域: 下机身前段-2号动力电池舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8601X4301	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e51bbed1-d8a7-4ca9-b186-909f3a365347	8621E04300G200	800V电池包缓冲层3	86	structural	\N	approved	区域: 下机身前段-3号动力电池舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8601X4401	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
42222abb-a04d-4ed3-8aae-04498ef0016d	2431E03400G200	270V电池包缓冲层	86	structural	\N	approved	区域: 下机身后段-中设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8601X5201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cb14ede9-1ced-48e9-9669-4efc0cbd47f2	8621E04500G200	800V电池包缓冲层4	86	structural	\N	approved	区域: 下机身后段-4号动力电池舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8601X5301	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3f336d5a-fe18-4cba-a563-2d8ec8b72a6b	8621E04600G200	800V电池包缓冲层5	86	structural	\N	approved	区域: 下机身后段-5号动力电池舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8601X5401	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9ea7a3c0-7524-4b4f-9ba4-669e015f7553	8711E00121T900	机载GNSS天线	87	structural	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8700A3201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fab18237-9df9-4f1f-87eb-d3e584456607	8711E00511T900	机载数据交换机	87	structural	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8701T3201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ccd3c921-bea4-48e1-8d01-6c9f961e384e	8712E01111T900	采集机箱1	87	structural	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8702U3201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11d9b0d4-f7cb-4b86-a6cd-5194dbe3c70b	8713E00411T900	通用记录器	87	structural	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8701U3201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
33e79ced-e1fa-448a-b788-0ec683c1e230	8781E00113T900	直流稳压器	87	structural	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8701K3201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
87f90282-b1b3-4d47-b624-d493e4b76acc	8781E00312T900	蓄电池组	87	structural	\N	approved	区域: 客舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	8701Q3201	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
23a54d79-f401-4c1b-92f0-44f9a0e15221	9013E01101G900	视觉传感器/相机1	90	LRU	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9002D2101	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0ad75d3f-f3ea-49f0-84f3-35811c130c0d	9013E01103G900	视觉传感器/相机2	90	LRU	\N	approved	区域: 驾驶舱-顶部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9002D2103	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f55865a1-be79-4077-bb60-751803642a21	9260E01001U900	U波段数据链收发组合	92	LRU	\N	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9201U4101	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1ddcd47b-e5fe-40a2-8f5f-667395943b20	4230E01001G900	飞机数据网络交换机1	42	LRU	5021d8dc-cd7d-4b20-b0e0-7033d7da92ac	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Aircraft Network Switch1	ANS1	1U-422	4202U3503	TSNSW-20250001	B	\N	f	t	t	\N	\N	4MCU	t	否	电源输出地与信号地、机壳地共地	5 A ≤ 设备故障电流	30	18-32	\N	\N	\N	面搭接	是	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8e92cab8-4e65-436b-9d46-a5ff3092d892	9011E01001G900	视觉辅助计算机	90	LRU	d4493a44-39dd-4dbc-8855-d5c234d77edc	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	vision computing unit	VCU	1U-901	9001U2601	202503001	B	\N	f	t	t	\N	\N	\N	t	安装面导电，其他面不导电	不共地	5 A ≤ 设备故障电流	\N	12~36V	\N	\N	\N	面搭接	否	无	\N	基线版本	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a68dbe5d-1d98-4774-ad6e-896fd71eaf72	3226E10000G900	前起收放作动筒	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3201X1213	\N	\N	\N	\N	f	f	\N	\N	483*77*125.6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
88e249b3-78e3-40ab-94ae-d564f491aff9	4651E02015U900	垂尾平尾摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Tail Camera	TAILCAM	D-4611	4601D3905	VAA-500-1A-11	E	\N	f	t	t	\N	\N	\N	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	试验试飞	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c0caa398-52cb-4c14-9b20-b83ab759417d	4651E02017U900	前起落架摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Front Landing Gear Camera	LANDCAM1	D-4603	4601D4901	VAA-500-1A-03	E	\N	f	t	t	\N	\N	\N	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e9d1e779-29c4-4497-883b-39e85653dbca	4651E02019U900	后右起落架摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Main Landing Gear Camera Right	LANDCAM3	D-4605	4601D4903	VAA-500-1A-05	E	\N	f	t	t	\N	\N	\N	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ff91f03b-bda7-4dce-a724-fc19347ab905	4651E02013U900	正前方视野摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 驾驶舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Front Camera	FRONTCAM	D-4609	4601D2901	VAA-500-1A-09	E	\N	f	t	t	\N	\N	\N	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	试验试飞	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1dc3e37f-06ed-4ba8-8c3f-5986ce136723	4610E01001G900	通用信息处理计算机	46	LRU	2d9557ea-079e-4026-b3bb-6a14a34ec7bc	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	General Information Process Computer	GIPC	U-4601	4601U3503	CWCU-001	D	\N	f	t	t	\N	\N	3MCU	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	16	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b205532a-53b5-4761-85b3-bffb7a1724da	4240E01001G900	数据接口单元1	42	LRU	56bed113-5a40-4282-9b7f-89bb21c5ad37	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Data Interface Unit1	DIU1	U-423	4206U2601	DIU-20250007	B	\N	f	t	t	\N	\N	3MCU	t	否	电源输出地与信号地、机壳地共地	5 A ≤ 设备故障电流	9	18-32	\N	\N	\N	面搭接	是	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
618f8032-89e4-4a43-96d4-0f02bcd774dd	9260E01003U900	数据链机腹全向天线	92	LRU	\N	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9202A4901	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
965e5e0b-fd40-4928-b074-599dd52c1fce	9260E01005U900	C波段数据链收发组合	92	LRU	\N	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9201U4103	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
81d2c6c2-fdc1-4ac3-8664-9e4afc8b1404	9260E01007U900	C波段数据链定向天线	92	LRU	\N	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9201A4903	\N	\N	\N	\N	t	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4637911b-63b5-4304-b6e3-581fa0121a55	9260E01009U900	空地数据管理计算机	92	LRU	\N	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.267422+00	\N	\N	\N	9201U4105	\N	\N	\N	\N	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cfffc6ac-9970-4760-b0bc-8b6ce4639865	TBD	起落架收放管路	32	structural	\N	approved	区域: TBD	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3200X6101	\N	\N	\N	\N	f	f	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
607fca65-3eae-4e21-b291-0d1ed76e7baf	2123E01001G900	客舱主供气管路	21	structural	\N	approved	区域: TBD	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2101X3203	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a9590033-dc81-4c14-8f71-db29f120d2e9	2122E01001G900	驾驶舱供气管路	21	structural	\N	approved	区域: TBD	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2101X2203	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4c6a0811-bd55-4843-92a8-ef92c75b7e00	2123E01003G900	前设备架供气管路	21	structural	\N	approved	区域: TBD	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2101X2205	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9a27f5c3-cd23-497d-b7d7-ae156ba27d6b	2600U4101	防火控制器	26	structural	\N	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2600U4101	\N	\N	\N	\N	\N	\N	\N	\N	381*90*280	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3004d9f8-be5e-4d36-83f7-1f90885e95ac	2750E01003G900	左外襟翼作动器	27	LRU	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2702M6211	\N	\N	\N	\N	t	t	\N	\N	500*150*76	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7f9fb225-71ea-4fa3-871f-5d05e6d96879	2750E01001G900	左内襟翼作动器	27	LRU	\N	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2702M6209	\N	\N	\N	\N	t	t	\N	\N	370*150*76	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0871bc9a-b530-45e8-a543-9b31939bbec3	2791E01001G900	主飞控计算机1	27	LRU	\N	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2703U3601	\N	\N	\N	\N	t	t	\N	\N	360.1±1*190±1*90±1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dbb50dbf-0e35-4341-a245-992e89321ddd	2792E01005G900	马达控制电子7	27	LRU	\N	approved	区域: 机翼-中央翼盒	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	2702U3501	\N	\N	\N	\N	t	t	\N	\N	250*220*115	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f112854-df48-426b-ac9e-57bbb96ffb80	3210E16000G900	左主起落架收放作动筒	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3202X5117	\N	\N	\N	\N	f	f	\N	\N	368*88*99.1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
11ab49bc-fbd3-48fa-9fcf-b93d96511cc4	3226E20000G900	前起开锁作动筒	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3201X1215	\N	\N	\N	\N	f	f	\N	\N	189*50*68	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3067d501-5849-4c52-b327-036a499a6afa	3210E11101G900	左主起落架支柱组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3201X5101	\N	\N	\N	\N	f	f	\N	\N	≤63*25*25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
662fd3bf-513a-4129-890d-f2e60e85f322	3221E00000G400	前起缓冲支柱组件	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3201X1201	\N	\N	\N	\N	f	f	\N	\N	≤63*25*25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6bd67ecd-991e-43a2-ab4c-732246ca2651	3210E14001G900	左主起落架锁连杆组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3202X5113	\N	\N	\N	\N	f	f	\N	\N	≤63*25*25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
881876f4-ec7e-4ea7-8100-da658a560ea4	3210E14002G900	右主起落架锁连杆组件	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3202X5115	\N	\N	\N	\N	f	f	\N	\N	≤63*25*25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d019e488-269d-45f4-a7ce-1816dcaed895	3223E00000G400	前起锁连杆组件	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3201X1205	\N	\N	\N	\N	f	f	\N	\N	≤63*25*25	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e63e5a1b-cc96-4c72-8f38-81f7ef480697	3210E17000G900	左主起落架下位锁开锁作动筒	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3202X5125	\N	\N	\N	\N	f	f	\N	\N	310*39*64.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d73f7589-cf7c-4abc-97e8-93ddd0d1d848	3247E01000G900	左外胎压传感器	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3206D5101	\N	\N	\N	\N	f	f	\N	\N	最大外径Φ24mm，长66.568±0254mm	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dcf0f33f-fd3e-4f9e-93b4-bc86e25271d4	3246E02000G900	前左轮胎	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3202X1205	\N	\N	\N	\N	f	f	\N	\N	15×6.0-6/6PR/257 km/h	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dd3e0816-6c39-4c1c-a182-a29c1c27475c	3246E01000G900	前左机轮	32	structural	\N	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3202X1201	\N	\N	\N	\N	f	f	\N	\N	机轮结合径Φ152.4mm，最大宽度156mm，轮轴直径Φ50mm	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ee777963-6726-4c2a-9956-c1117142d1e2	3245E02000G900	左外轮胎	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3204X5109	\N	\N	\N	\N	f	f	\N	\N	22×5.75-12/10PR/306 km/h	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
faa5ce74-b993-4d5b-8c26-9c72623651d1	3247E01400G900	左外主轮轮毂盖	32	structural	\N	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3204X5117	\N	\N	\N	\N	f	f	\N	\N	175.4*115.8*45	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4689163d-a76c-4222-9381-00125cd79e8c	3343E01001G900	左跑道转弯灯	33	structural	\N	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3300L0001	\N	\N	\N	\N	\N	\N	\N	\N	111.5*111.5*65.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8d2e1f3b-4f46-4f84-9f93-7465f739a2e2	3343E02001G900	右跑道转弯灯	33	structural	\N	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3300L0002	\N	\N	\N	\N	\N	\N	\N	\N	111.5*111.5*65.3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fa4a3d52-8f03-4d36-a160-7eb066b2f00b	3411E03001G900	大气数据计算机1	34	LRU	\N	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3403U2501	\N	\N	\N	\N	t	t	\N	\N	170*110*65	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
90fdb9ea-1c19-4d75-af62-ffcee44ae5c6	3401U2509	T3CAS处理机	34	structural	\N	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3401U2509	\N	\N	\N	\N	\N	\N	\N	\N	4MCU	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
394f583b-a892-4241-a46e-f6defc48a3bd	3401A3901	交通监视上天线	34	structural	\N	approved	区域: 客舱-外部	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3401A3901	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
03e0d842-ce48-450d-a422-3bd8c57bc8bc	3401A4901	交通监视下天线	34	structural	\N	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3401A4901	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f70fce0c-92c8-4f93-8156-3fb9f80946ec	3459E01001G900	北斗卫星导航接收机	34	structural	\N	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	3401U3503	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9cfc825b-5366-4da3-9eee-0372bd71f085	4400U3601	广播内话-音频控制单元	44	structural	\N	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	4400U3601	\N	\N	\N	\N	\N	\N	\N	\N	318*194*57.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0b0f3f44-ba70-4b00-b998-d363b92a0f54	4400U3602	客舱管理-客舱接口单元	44	structural	\N	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	4400U3602	\N	\N	\N	\N	\N	\N	\N	\N	318*194*127.5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2242ba2b-8ae5-41d8-8583-d0ff6345274d	4400U3603	空地互联-空地互联（通信服务器）	44	structural	\N	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	4400U3603	\N	\N	\N	\N	\N	\N	\N	\N	318*194*57.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
41a3a168-863c-4bb7-b638-d728801fdca7	4651E02011U900	电池舱摄像头1	46	structural	\N	approved	区域: 下机身前段-1号动力电池舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	4605D4201	\N	\N	\N	\N	f	f	\N	\N	37*37*56.2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
69b68972-e695-42f2-a584-e83cd7ec4984	5231E10001G900	登机门上锁传感器	52	structural	\N	approved	区域: 客舱-登机门	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	5201D3709	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d8216ddc-40b1-4f75-84ae-b677def29015	2431E04400G200	270V电池包缓冲层	86	structural	\N	approved	区域: 下机身后段-中设备舱	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601X5201	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
053abee4-0698-4072-b75f-46c3a2b67b4a	8662E01001G200	短舱单元1	86	structural	\N	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601X7103	\N	\N	\N	\N	f	f	\N	\N	1728*812*764	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2ac1d2da-e51e-4b60-8386-4bde9ae88f1e	8630E02004G400	涵道风扇10（金属）	86	structural	\N	approved	区域: 短舱-5号短舱（机翼外侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601M7502	\N	\N	\N	\N	f	f	\N	\N	425*760*750	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31f3eb99-b52f-442f-9c93-da9242674a31	8662E01002G200	短舱单元6	86	structural	\N	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601X7104	\N	\N	\N	\N	f	f	\N	\N	1728*812*764	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4d0b4b83-716a-4c0d-b4d5-5e705048f8ca	8661E01001G200	短舱单元2	86	structural	\N	approved	区域: 短舱-2号短舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8603X7203	\N	\N	\N	\N	f	f	\N	\N	1728*812*764	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
660b795a-7fe8-4963-83c7-c9ae3ef0e61d	8661E01002G200	短舱单元7	86	structural	\N	approved	区域: 短舱-2号短舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8603X7204	\N	\N	\N	\N	f	f	\N	\N	1728*812*764	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6946b7e3-b04b-41ff-8247-0ae3e3deba14	8663E01002G200	短舱单元10	86	structural	\N	approved	区域: 短舱-5号短舱（机翼外侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601X7504	\N	\N	\N	\N	f	f	\N	\N	1728*812*764	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
87cd84b2-4f89-431b-9493-bf83aeaa07c0	8665E01002G400	线缆盒6	86	structural	\N	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8605J7102	\N	\N	\N	\N	f	f	\N	\N	365*226*226	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
96824614-3718-4267-a9bd-88676ce028fa	8630E02001G400	涵道风扇1（金属）	86	structural	\N	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8608M7101	\N	\N	\N	\N	f	f	\N	\N	425*760*750	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9c627aff-81c5-49a7-b0e7-42138856f165	8665E01001G400	线缆盒1	86	structural	\N	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8605J7101	\N	\N	\N	\N	f	f	\N	\N	365*226*226	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a1b2f301-4d3e-451a-84be-7e1cf01e3421	8664E01001G700	尾锥1	86	structural	\N	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8610X7101	\N	\N	\N	\N	f	f	\N	\N	488*247*247	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ce4cf040-fd86-4700-a7c0-f7021fce2b5c	8663E01001G200	短舱单元5	86	structural	\N	approved	区域: 短舱-5号短舱（机翼外侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601X7503	\N	\N	\N	\N	f	f	\N	\N	1728*812*764	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e8bbf27d-4b02-4cb5-87fb-21630f450c85	8630E02003G400	涵道风扇5（金属）	86	structural	\N	approved	区域: 短舱-5号短舱（机翼外侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.351497+00	\N	\N	\N	8601M7501	\N	\N	\N	\N	f	f	\N	\N	425*760*750	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e87e7012-682d-42da-afa4-b09d3d29d4af	3458E01001G900	GPS天线1	34	LRU	9ca4df86-a3ab-456e-b0c4-3f6f86a68e89	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	GNSS Antenna1	GPS ANT1	1A-34104	3402A3901	\N	C	\N	f	t	f	\N	\N	77*20*130	t	否	机壳地	NA	1	NA	\N	\N	\N	面搭接	否	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
551a5a6a-195e-4db4-916d-69635c8ece76	2100E02000G900	冷却效果探测器CED1	21	structural	1e42d3da-ba8f-456b-bc82-0a9b0c740d76	approved	区域: TBD	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Cooling Effect Detector1	CED1	1D-2112	2102U3501	TBD	C	\N	f	\N	\N	t	\N	\N	t	否	信号地和电源地通过磁珠或0\n欧姆电阻相接，机壳地和两者不通	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上	1	28V	\N	\N	\N	线搭接	否	\N	\N	0号机	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8f1e9383-56f2-499d-a896-5b1a22be5e98	3261E10000G900	前起位置指示传感器1	32	LRU	2d0fabf7-fe20-43c8-8aca-51a7db2990a1	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	LH MLG Prox WOFFW 1	LH MLG Prox WOFFW 1	1D-3201	3202D1209	5808F	A	\N	f	t	f	\N	\N	≤63*25*25	t	否	信号地与机壳地不共地 电源地与机壳地不共地 信号地与电源地共地	1 A ≤ 设备故障电流< 5 A	1	1-5VDC	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3e2409ca-018f-4eec-83b9-6cd8a6b4dc94	3458E02001G900	GNSS射频功分器1	34	LRU	9ca4df86-a3ab-456e-b0c4-3f6f86a68e89	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	GNSS Signal Splitter1	GNSS SSPL1	1D-34104	3401U3605	\N	C	\N	f	t	f	\N	\N	71*46*19	t	否	机壳地	NA	3	NA	\N	\N	\N	面搭接	否	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d14f9046-a803-4928-9534-57de722593c8	2153E01003G900	应急冲压风扇（带单向活门）	21	structural	1e42d3da-ba8f-456b-bc82-0a9b0c740d76	approved	区域: TBD	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Emergency Ram Air Fan	ERAF	1M-2104	2101M8103	TBD	C	\N	f	\N	\N	t	\N	\N	t	否	信号地和电源地通过磁珠或0\n欧姆电阻相接，机壳地和两者不通	设备安装在金属结构上	2	270V	\N	\N	\N	线搭接	否	\N	\N	0号机	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e2b7382d-4795-4175-9165-85926e956486	2153E01001G900	应急冲压进气道及作动器（含风门）	21	structural	1e42d3da-ba8f-456b-bc82-0a9b0c740d76	approved	区域: TBD	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Emergency Ram Air Inle Acuator	ERAIA	1M-2103	2101M8101	TBD	C	\N	f	\N	\N	t	\N	\N	t	否	信号地和电源地通过磁珠或0\n欧姆电阻相接，机壳地和两者不通	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上	1	28V	\N	\N	\N	线搭接	否	\N	\N	0号机	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ec281aff-e7a4-4bfc-a845-e9d33519e36d	3341E02001G900	绿光航行灯（右翼尖）	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Green navigation light	GNL	1L-3303	3301L6903	AVE-WPSTG-54G Mod(4)	D	\N	t	t	t	\N	\N	100*46.2*34.1	f	\N	\N	\N	1	28V	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ec589b04-4108-4095-b955-48ba73162d3d	3160E02001G900	显控计算机1	31	LRU	3b18ec23-1095-4f61-858b-1bab93941fa5	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Display Control Unit1	DCU1	1U-313	3102U2201	AD2.303001DC	B	\N	f	t	t	\N	\N	317.2*115.12*204.12	t	是	电源输入地浮空，电源输出地与信号地、机壳地共地	c）	1	18-32	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
05fe5a5e-86e1-4782-8b50-85364c51320a	3261E11100G900	收放控制单元1	32	LRU	0dddf518-0c0c-42d1-9f35-8439390d731d	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Landing Gear Control Unit 1	LGCU1	1U-3204	3201U2501	TBD	A	\N	f	t	t	\N	\N	（318±1）*（57.2±0.5）*（194）	t	否	信号地与机壳地不共地 电源地与机壳地不共地 信号地与电源地共地	1 A ≤ 设备故障电流< 5 A	1	18VDC-32VDC	\N	\N	\N	面搭接	是	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4a6c4183-0e81-4c9b-bbd9-1be9e9ae7dea	3451E01001G900	甚高频通信及无线电导航集成设备1	34	LRU	7f584876-1db4-42bc-8d45-dd195dcab928	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Communication Navigation Integrated Unit1	CNIU1	1U-341	3401U3601	700-00260-001	C	\N	f	t	t	\N	\N	\N	t	是	电源地	c) 5 A ≤ 设备故障电流。	10	28V	\N	\N	\N	线搭接	否	NA	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a3a4610a-f956-4b7e-be18-6212d74eb05f	3241E04000G900	刹车控制监视单元	32	LRU	4ced0b23-4e99-4177-8ff5-ca422e0589e5	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Brake Control and Monitoring Unit	BCMU	1U-3208	3201U2505	XHJ/LF-031	A	\N	f	t	t	\N	\N	3MCU	t	是	电源地、机壳地、信号地	1(a)	1	18V-32V	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eadc600f-53ea-4b4c-b954-712bb5bfe17c	3241E06000G900	外侧EMA控制器1	32	LRU	4ced0b23-4e99-4177-8ff5-ca422e0589e5	approved	区域: 机翼-中央翼盒	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Electric Motor Actuator Controller 1	EMAC1	1U-3206	3204U6101	XHJ/LF-034	A	\N	f	t	t	\N	\N	278*124*194	t	是	电源地、机壳地、信号地	1)(b) 2)（c）	6	18V-32V,192V-327V	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c7277938-188a-48c9-ba0e-f08d2156a100	3442E01003G900	无线电高度表（RA）收发机1	34	LRU	57aaa1a3-7344-45be-a3f1-35660f0a3cbc	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Radio Altimeter1	RA1	1U-343	3402U4101	JG2000324	C	\N	f	t	t	\N	\N	323*100*100	t	否	电源地、机壳地	a）设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；\nb）设备故障电流1.07。	3	28V	\N	\N	\N	面搭接	是	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
799bbd94-6e70-4449-a4cd-4c106653c7b3	3443E01001G900	惯性基准系统1	34	LRU	07f36105-9639-4398-bcbd-d6dba21f0563	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Inertial Reference Unit1	IRS1	1U-344	3401U2505	8911FASM	B	\N	f	t	t	\N	\N	275*156*188	t	是	信号地与电源地、机壳地隔离，电源地与机壳地非隔离	1）工作电压＜30V时， 1 A ≤ 设备故障电流< 5 A。\n2) 工作电压≥30V时，设备安装在金属结构上。	2	18V-32V	\N	\N	\N	线搭接	是	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
66c2b44b-0e1b-438e-a99f-f53684c902e7	3346E01001G900	上红光防撞灯	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Upper red anti-collision light	URACL	2L-33041	3302L3901	AVE-RBXPR-001 Mod(1)	D	\N	t	t	t	\N	\N	64*64*39.8	f	\N	机壳地	\N	1	28V	\N	\N	\N	线搭接	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e375d76e-c09c-45f3-bb3b-6b43b6e6b7ce	3342E01001G900	左滑行灯	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left taxi light	LTL	2L-3314	3302L1201	AVE-THD36TW-TD1	D	\N	t	t	t	\N	\N	111.5*111.5*65.3	f	\N	\N	\N	\N	28V	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
272e7215-7f69-4954-9e41-46f1eb35788d	3040E02004G900	风挡雨刷马达2（含控制器）	30	LRU	6dd4c69a-24fd-42cc-957e-168d00a426a5	approved	区域: 机头-前附件舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Windshield Wiper Controller2	WWC2	2U-3027	3002M1303	16E5.130.316Y	D	\N	f	t	t	\N	\N	\N	t	是	电源地	a) 设备安装在CFC表面的金属结构上；\nc) 5 A ≤ 设备故障电流。	1	22V-30.3V	\N	\N	\N	线搭接	是	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2d6d0f13-5ff5-4044-aa23-0af4b2c6c52c	2711E02002G900	右侧杆	27	LRU	10e23027-2418-4ff5-8392-538a6ea71071	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Right Side Stick Unit	RSSU	2U-2702	2702U2402	TBD	B	\N	f	t	t	\N	\N	\N	t	否	机壳地	1 A ≤ 设备故障电流< 5 A	5	0-28V、0-7V	\N	\N	\N	面搭接	否	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
321ad9fd-0ebd-4b8e-8c49-c76529e22abb	3241E05000G900	备份刹车控制单元	32	LRU	4ced0b23-4e99-4177-8ff5-ca422e0589e5	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Alternate Brake Control Unit	ABCU	2U-3208	3201U3605	XHJ/LF-033	A	\N	f	t	t	\N	\N	3MCU	t	是	电源地、机壳地、信号地	1(a)	1	18V-32V	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
56c2dabd-ffa6-4c07-98a0-9fb73715e83b	3040E01001G900	风挡加热控制器1	30	LRU	\N	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Windshield Heating Controller	WHC	2U-3030	3002U2501	TBD	C	\N	f	t	t	\N	\N	318*194*90	t	是	电源地	a) 设备安装在CFC表面的金属结构上；\nc) 5 A ≤ 设备故障电流。	2	22V-30.3V	\N	\N	\N	线搭接	是	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6035443e-99da-4c68-ac6d-694baa6c3daf	3451E01003G900	甚高频通信及无线电导航集成设备2	34	LRU	7f584876-1db4-42bc-8d45-dd195dcab928	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Communication Navigation Integrated Unit2	CNIU2	2U-341	3401U3501	700-00260-002	C	\N	f	t	t	\N	\N	\N	t	是	电源地	c) 5 A ≤ 设备故障电流。	8	28V	\N	\N	\N	线搭接	否	NA	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c983012b-514c-4b48-af97-3f7344a1ac2d	2711E02001G900	左侧杆	27	LRU	10e23027-2418-4ff5-8392-538a6ea71071	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Side Stick Unit	LSSU	2U-2701	2702U2401	TBD	B	\N	f	t	t	\N	\N	\N	t	否	机壳地	1 A ≤ 设备故障电流< 5 A	5	0-28V、0-7V	\N	\N	\N	面搭接	否	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d3a95ede-6378-40ad-9316-422a9750e214	3040E02003G900	风挡雨刷马达1（含控制器）	30	LRU	6dd4c69a-24fd-42cc-957e-168d00a426a5	approved	区域: 机头-前附件舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Windshield Wiper Controller1	WWC1	2U-3026	3002M1301	16E5.130.316Z	D	\N	f	t	t	\N	\N	\N	t	是	电源地	a) 设备安装在CFC表面的金属结构上；\nc) 5 A ≤ 设备故障电流。	1	22V-30.3V	\N	\N	\N	线搭接	是	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e600b367-8f84-4d95-ad42-96afa4cfb9dd	3040E01002G900	风挡加热控制器2	30	LRU	\N	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Windshield Heating Controller	WHC	2U-3031	3002U2601	TBD	C	\N	f	t	t	\N	\N	318*194*90	t	是	电源地	a) 设备安装在CFC表面的金属结构上；\nc) 5 A ≤ 设备故障电流。	2	22V-30.3V	\N	\N	\N	线搭接	是	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8ed8b7ec-c487-40aa-aaab-3340cdb71621	3443E01003G900	惯性基准系统2	34	LRU	e6c1d314-798f-4d09-bf31-bfa2eaf026ea	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Inertial Reference Unit2	IRS2	2U-344	3401U2507	643251001/6432510002	A	\N	f	t	t	\N	\N	277*201*148	t	是	全部隔离	a) 设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；b)1A ≤ 设备故障电流< 5 A；	2	18~36v	\N	\N	\N	面搭接	是	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
be1aad53-d2c4-4407-87dc-317a81bfed71	5610E02001G200	左侧风挡玻璃及其加热模块组件	30	LRU	f3338666-75d3-47fa-bbe7-3c9473638ed7	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Windshield Heating Component	LWHC	3H-3033	5602H2201	TBD	已沟通，此	\N	f	t	t	\N	\N	\N	f	\N	无	\N	1	0~270V	\N	\N	\N	无	否	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e632fb91-bc56-454e-a5be-f2057f984669	5610E02002G200	右侧风挡玻璃及其加热模块组件	30	LRU	f3338666-75d3-47fa-bbe7-3c9473638ed7	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Right Windshield Heating Component	RWHC	3H-3034	5602H2202	TBD	已沟通，此	\N	f	t	t	\N	\N	\N	f	\N	无	\N	1	0~270V	\N	\N	\N	无	否	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eddb07a0-7e70-4185-a399-fd57b0360365	5610E01000G200	主风挡玻璃及其加热模块组件	30	structural	f3338666-75d3-47fa-bbe7-3c9473638ed7	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Front Windshield Heating Component	FWHC	3H-3032	5601H2201	TBD	已沟通，此	\N	f	\N	\N	\N	\N	\N	f	\N	无	\N	2	0~270V	\N	\N	\N	无	否	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0bf86a96-c097-4533-99d4-58e51b33328b	3443E01005G900	惯性基准系统3	34	LRU	25e335bb-5a8d-41e1-af72-e0cf82b4c209	approved	区域: 机翼-中央翼盒	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Inertial Reference Unit3	IRS3	3U-344	3401U6101	Kxg.562.1268	A	\N	f	t	t	\N	\N	284*161*165	t	是	不共地	a）设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；b）设备故障电流TBD。	1	28V	\N	\N	\N	面搭接	否	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2074a91a-9c58-4886-826a-cab4fa9c8921	3345E01001G900	左白光防撞灯	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left white anti-collision light	LWACL	4L-3306	3304L6901	AVE-RBXPW-001 Mod(1)	D	\N	t	t	t	\N	\N	64*64*39.8	f	\N	机壳地	\N	1	28V	\N	\N	\N	线搭接	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b3b321a1-ecca-4407-91b0-8240e914593b	3342E02001G900	左翼根着陆灯1	33	LRU	b71503ab-6769-479c-b4d4-8df509633ba7	approved	区域: 机翼-机翼外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left wing root landing light1	LWRLL1	4L-3310	3304L6903	AVE-THD36LW-TD1	C	\N	t	t	t	\N	\N	111.5*111.5*65.3	f	\N	\N	\N	\N	28V	\N	\N	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
124f1c0e-c7d5-4529-b729-0e6f9c163e9d	2720E01001G900	方向舵上侧作动器	27	LRU	5588fe74-1e8e-46bd-a1f3-f2f57c80cf25	approved	区域: 尾段-垂直尾翼	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Upper Rudder Actuator	Upper Rudder Actuator	5U-2713	2702M8201	TBD	A	\N	f	t	t	\N	\N	610（中立位长度）*190*75	t	是	不涉及	c) 设备安装在金属结构上。	3	交流电（0-270AC，线电压）	\N	\N	\N	线搭接	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
609ff014-4e7a-4b52-820d-70d0643054ba	2730E01001G900	左升降舵内侧作动器	27	LRU	5588fe74-1e8e-46bd-a1f3-f2f57c80cf25	approved	区域: 尾段-水平尾翼	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	LH Inboard Elevator Actuator	LH Inboard Elevator Actuator	5U-2709	2704M8301	TBD	A	\N	f	t	t	\N	\N	490（中立位长度）*190*75	t	是	不涉及	c) 设备安装在金属结构上。	3	交流电（0-270AC，线电压）	\N	\N	\N	线搭接	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
838017f2-5656-44bb-873a-ee3e8114141d	2710E01001G900	左内侧副翼作动器	27	LRU	5588fe74-1e8e-46bd-a1f3-f2f57c80cf25	approved	区域: 机翼-机翼外段	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	LH Inboard Aileron Actuator	LH Inboard Aileron Actuator	5U-2715	2704M6201	TBD	B	\N	f	t	t	\N	\N	485（中立位长度）*190*75	t	是	不涉及	c) 设备安装在金属结构上。	3	交流电（0-270AC，线电压）	\N	\N	\N	线搭接	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
308dad5a-ce5e-45c0-a4d9-ccf869c4e874	2514E02001G900	驾驶员座椅右	25	structural	60bb61b0-cf7e-4aec-9a8a-bd3b1ed92141	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Copilot Seat	\N	U-2506	2501U2203	KJY400-1911-204	D	\N	f	f	f	\N	\N	\N	f	否	设备内均不共地	1 A ≤ 设备故障电流< 5 A	1	26-32VDC	\N	\N	\N	线搭接	是	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b8766393-40b7-406b-a18c-d2a13f1f2e57	2792E01001G900	马达控制电子1	27	LRU	5588fe74-1e8e-46bd-a1f3-f2f57c80cf25	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Motor Control Electronics1	MCE1	5U-2701	2704U3501	TBD	A	\N	f	t	t	\N	\N	332*250*70	t	是	都不共地	c） \nc）	4	控制电28VDC\n驱动电270VDC	\N	\N	\N	通过安装螺钉与支架搭接	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c6e08321-7690-4ca3-961f-025888f915b3	3442E01001G900	无线电高度表天线1	34	LRU	57aaa1a3-7344-45be-a3f1-35660f0a3cbc	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Radio Altimeter Transmite Antenna1	RAA1	A-34311	3404A4901	JG2940153	C	\N	f	t	f	\N	\N	92*89*26	t	否	机壳地	a)设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上	1	NA	\N	\N	\N	面搭接	是	NA	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f1efdd80-24ef-4363-83c7-85da0a3f8fe4	2792E01003G900	马达控制电子5	27	LRU	5588fe74-1e8e-46bd-a1f3-f2f57c80cf25	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Motor Control Electronics5	MCE5	5U-2705	2702U3609	TBD	A	\N	f	t	t	\N	\N	297*215*70	t	是	都不共地	c） \nc）	4	控制电28VDC\n驱动电270VDC	\N	\N	\N	通过安装螺钉与支架搭接	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ae39aa76-ecd7-4e51-a3d1-7c43090402f9	4610E01003G900	驾驶舱机组无线通信单元	46	structural	2d9557ea-079e-4026-b3bb-6a14a34ec7bc	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Cockpit Wireless Communication Unit	CWCU	A-4601	4601U2507	GIPC-001	E	\N	f	\N	\N	\N	\N	\N	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	3	18-32	\N	\N	\N	无	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2c8c347f-2140-4e3e-819e-c21df7259402	3130E01001G900	区域麦克风（AMP）	31	LRU	831b0930-c008-407d-bbbe-19ce895ba2f1	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Area Microphone/Preamplifier	AMP	D-3101	3101D2403	TBD	E	\N	f	t	t	\N	\N	\N	t	否	信号地\n电源地\n机壳地	a) 设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上（小于1A）	1	18-32V	\N	\N	\N	面搭接	是	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6fdbb16f-35d9-485c-9216-6774f0684d8c	3241E03000G900	左座脚蹬传感器1	32	LRU	4ced0b23-4e99-4177-8ff5-ca422e0589e5	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	PIOT Linear Variable Displacement Transducer 1	PILOT LVDT 1	D-3210	3204D2201	XHJ/LF-030	其他	\N	f	t	f	\N	\N	外廓尺寸（221.5±1）*（46±0.5）*（65.4±1）	t	是	信号地	1(a)	1	7±0.1V	\N	\N	\N	面搭接	否	\N	\N	0号机	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
890c2523-4adc-47ed-8f21-961a0a815b33	3244E01000G900	左外刹车温度传感器	32	LRU	4ced0b23-4e99-4177-8ff5-ca422e0589e5	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Outboard Brake Temperature Sensor	LO BTS	D-3218	3204D5109	PPM-WCK0FA	其他	\N	f	t	f	\N	\N	K型热电偶，D38999/25YA35PN型号	t	是	电源地	1(a)	1	12±1v	\N	\N	\N	面搭接	否	外壳地通过连接器针接屏蔽线	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a1dae93d-b8e6-4cfc-a25b-fedaf6b3cfc5	3247E01200G900	左外轮轴内适配器	32	structural	965e4586-6de4-43f0-9f0d-b0817782ba80	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Outboard In Axle Adapter	LO IAA	D-3228	3204D5117	J01010394	B	\N	f	f	f	\N	\N	轮速传感器：不大于Φ38mm×（62±2）mm\n主轮轴内适配器：与主轮轴装配尺寸Φ50 H7g6，长152.7mm	t	否	电源地	b) 1 A ≤ 设备故障电流< 5 A	1	15~28v	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
181449ec-a06d-46d5-b5ba-8ccf06bd425f	4651E02003U900	后左起落架摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Main Landing Gear Camera Left	LANDCAM2	D-4604	4601D4905	VAA-500-1A-04	E	\N	f	t	t	\N	\N	37*37*56.2	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6e0ca76a-dbfb-4902-9f24-e43ec75e48de	4651E02005U900	正下方视野摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 下机身后段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Below Camera	BELOWCAM	D-4610	4601D5903	VAA-500-1A-10	E	\N	f	t	t	\N	\N	37*37*56.2	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	试验试飞	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8374e76d-fca2-4bc9-94e7-61b8721ee94a	4651E02007U900	右电涵道摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Right Engine Camera	ENGCAM2	D-4607	4601D3901	VAA-500-1A-07	E	\N	f	t	t	\N	\N	37*37*56.2	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b64537f4-8c11-4d97-a69b-2e1166979199	4651E02009U900	左电涵道摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 客舱-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Engine Camera	ENGCAM1	D-4606	4601D3903	VAA-500-1A-06	E	\N	f	t	t	\N	\N	37*37*56.2	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e2a8449d-718c-426d-ba6d-aa5879a54694	4651E02001U900	机身上表面摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 尾段-垂直尾翼	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Upper Surface Camera	UPCAM	D-4608	4601D8201	VAA-500-1A-08	E	\N	f	t	t	\N	\N	37*37*56.2	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e448eb31-370a-43de-a5f6-07a999e589af	4651E02003G900	跑道监视摄像头	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 下机身前段-外部	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Runway Camera	RCAM	D-4601	4601D4907	VAA-500-1A-01	E	\N	f	t	t	\N	\N	37*37*56.2	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	1	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
78a01034-9fbf-443f-a193-7aed540cd97a	3232E31300G900	备份放继电器2	32	LRU	5f65f17f-54ab-458c-8369-037d1e2fbab5	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Backup Release Relay2	BRR2	K-3202	3202K2501	JQX-4Z15BM-028L/24	A	\N	f	t	f	\N	\N	44*24*26	t	否	TBD	TBD	1	28V DC	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
82d26b07-ac4f-42e7-b560-f666e34c2c0a	3232E31100G900	备份放继电器1	32	LRU	5f65f17f-54ab-458c-8369-037d1e2fbab5	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Backup Release Relay1	BRR1	K-3201	3201K2501	J1513/JSB-85M-3-5s-Y-24	A	\N	f	t	f	\N	\N	44*24*32	t	否	TBD	TBD	1	28V DC	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
35f40f9f-c1c3-4dd4-a75b-c38530fdc808	3250E14000G900	牵引指示盒	32	LRU	797b66d6-7113-467b-a015-cf3ebe01042d	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Towing Indication Box	TIB	L-3201	3201L1225	协议未定，型号暂未申请	其他	\N	f	t	t	\N	\N	77*49*71	t	否	信号地与机壳地不共地，电源地与机壳地不共地，信号地与电源地不共地	1A≤设备故障电流＜5A	\N	16-31.5V	\N	\N	\N	线搭接	否	无	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
95f8fcf9-dfa5-496e-95a4-1cc204b488a8	3231E12300G900	前起EHM	32	LRU	f72c944e-4f95-4ebc-a228-4609140100a4	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Nose landing gear Electro-hydraulic Module	NLGEHM	M-3201	3201M4119	型号申请暂未审批完	A	\N	f	t	t	\N	\N	306*292*165	t	是	信号地与机壳地共地,电源地与机壳地不共地,信号地与电源地不共地	设备安装在面板或设备架上	6	270VDC	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
db3eec35-d082-45f5-b88c-662e141ada3b	3231E12100G900	左主起EHM	32	LRU	f72c944e-4f95-4ebc-a228-4609140100a4	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left main landing gear Electro-hydraulic Module	LMLGEHM	M-3202	3201M5101	型号申请暂未审批完	A	\N	f	t	t	\N	\N	306*292*165	t	是	信号地与机壳地共地,电源地与机壳地不共地,信号地与电源地不共地	设备安装在面板或设备架上	6	270VDC	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
60368506-db53-4a47-a95d-c3945a9411ee	3250E13000G900	转弯舵机	32	LRU	3ae1613d-7473-463e-bad2-5cb46dfebbac	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Steering Motor	Motor	M-3204	3201M1223	J3250-2058	其他	\N	f	t	t	\N	\N	不超过263*161*255	t	否	信号地与机壳地不共地，电源地与机壳地不共地，信号地与电源地不共地	设备安装在金属结构上	\N	16-31.5V/200V-330V	\N	\N	\N	线搭接	否	无	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f2ecd438-cfbc-4d47-8911-de904bdbe87c	3226E30000G900	前起备份放开锁作动装置	32	LRU	f72c944e-4f95-4ebc-a228-4609140100a4	approved	区域: 机头-前起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Nose Landing Gear Backup Release Electromechanical Actuator	NLGBREMA	M-3209	3201X1217	型号申请暂未审批完	A	\N	f	t	f	\N	\N	销轴面到螺钉：246*110*139\n销轴面到连接器：249*110*130	t	否	信号地CAN_GND、电源地（28V地和离散量地，同一个地）隔离；机壳地与电源地单点共地	5 A ≤ 设备故障电流	1	28VDC	\N	\N	\N	线搭接	是	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3f246d7f-fb50-4738-9951-55f78b7d8124	3210E18002G900	右主起落架上位锁	32	LRU	8c040031-b368-4614-9df4-75b4bc711406	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	RH_MLG_UPLOCK	RH_MLG_UPLOCK	M-3211	3202X5123	C062	A	\N	f	t	f	\N	\N	171.05*146.5*56	t	是	机壳地	设备安装在金属结构上	1	18V-30.3V	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f4baca8f-fc97-42ee-8e7c-9e8384ffea2e	3210E18001G900	左主起落架上位锁	32	LRU	8c040031-b368-4614-9df4-75b4bc711406	approved	区域: 下机身后段-主起落架舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	LH_MLG_UPLOCK	LH_MLG_UPLOCK	M-3210	3202X5121	C061	A	\N	f	t	f	\N	\N	171.05*146.5*56	t	是	机壳地	设备安装在金属结构上	1	18V-30.3V	\N	\N	\N	面搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4c493c59-f2c3-40d5-840f-3c775da83ab3	8611E01001G900	电驱系统1	86	LRU	fc9cdc04-732f-4ec0-bd28-f89319b4e323	approved	区域: 短舱-1号短舱（机翼内侧）	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Electric motor and drive system 1	EMDS1	M-8601	8610M7105	揭榜挂帅未定	A	\N	f	t	t	\N	\N	603.8*295.2*247	t	\N	信号地、电源地、机壳地之间隔离，控制地与机壳地通过电容跨接	1 A ≤ 设备故障电流< 5 A	3	500-850V；\n28V	\N	\N	\N	线搭接	无	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6d91e335-b44e-4928-b37d-6dc4aea90822	2431E01003G900	LR 270V电池（含BMS）	24	LRU	3157a390-1cea-4ca3-bb24-f529e67a9a3a	approved	区域: 下机身后段-中设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left&Right 270V Battery	LR270VBatt	Q-2401	2401G5201	TBD	B	\N	f	t	t	\N	\N	1560*726*154	t	是	互相隔离	a) 设备安装在面板或设备架上	1	200~330	\N	\N	\N	面搭接/紧固件搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b8fbc68a-0401-4d91-a7e5-72137d7070d1	2432E01001G900	应急28V电池（含BMS）	24	LRU	3157a390-1cea-4ca3-bb24-f529e67a9a3a	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	E_28V_Battery	E28VBatt	Q-2404	2401G4103	TBD	C	\N	f	t	t	\N	\N	381*370*216	t	是	互相隔离	a) 设备安装在面板或设备架上	3	20~29.2	\N	\N	\N	面搭接/紧固件搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bb57baa7-e178-43d4-84e1-9dc7c73a95ea	2431E01001G900	E 270V电池（含BMS）	24	LRU	3157a390-1cea-4ca3-bb24-f529e67a9a3a	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	E_270V_Battery	E270VBatt	Q-2403	2401G4101	TBD	B	\N	f	t	t	\N	\N	800*726*154	t	是	互相隔离	a) 设备安装在面板或设备架上	1	200~330	\N	\N	\N	面搭接/紧固件搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d87dd885-204b-4088-ad97-449cff1d3596	8621E01001G900	构型B动力电池1	86	structural	e5a35efa-e170-4952-ab3c-56026e61081d	approved	区域: 下机身前段-1号动力电池舱	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	800V_Battery_1	800Batt_1	Q-8601	8605Q4201	010000A-P004	B	\N	f	\N	\N	\N	\N	1150*1562*370	\N	否	信号地共地	b) 设备安装在复材结构上	1	550~816	\N	\N	\N	无	否	动力电缆接头在xyz方向存在TBD自由度	\N	\N	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3e1d143c-30c7-482b-aa93-874cc83155c5	2442E01003G900	充电面板	24	structural	3157a390-1cea-4ca3-bb24-f529e67a9a3a	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Charging panel	CP	R-2402	2401J4103	TBD	E	\N	f	\N	\N	\N	\N	230*165	t	是	互相隔离	a) 设备安装在面板或设备架上	2	270	\N	\N	\N	无	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e463e2f-7daa-422e-8eef-0df56eaa629c	2442E01001G900	外电源插座	24	structural	09fe854f-dbe0-4ee8-8170-02c7c1b33439	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	EXTERNAL POWER SOCKET	EP SOCKET	R-2401	2401J4101	TBD	E	\N	f	\N	\N	\N	\N	46*46	t	是	互相隔离	a) 设备安装在面板或设备架上	1	270	\N	\N	\N	无	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2f9d8862-798e-4881-babf-034301d2d432	3250E11001G900	左座转弯手轮	32	LRU	bf9309a3-a343-4072-8f97-ed6167b3ec37	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Pilot Steering Tiler	Tiler	S-3203	3201S2401	HY-JSP-101Z	其他	\N	f	t	t	\N	\N	138*150*169	t	否	信号地与机壳地不共地，电源地与机壳地不共地，信号地与电源地不共地	1A≤设备故障电流＜5A	\N	AC 0-7Vpp/16-31.5V	\N	\N	\N	线搭接	否	无	\N	0号机	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32fa0895-6be5-47b2-a0db-ea1f1f45dc3e	3250E11002G900	右座转弯手轮	32	LRU	bf9309a3-a343-4072-8f97-ed6167b3ec37	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Copilot Steering Tiler	Co-Tiler	S-3204	3201S2403	HY-JSP-101Y	其他	\N	f	t	t	\N	\N	138*150*169	t	否	信号地与机壳地不共地，电源地与机壳地不共地，信号地与电源地不共地	1A≤设备故障电流＜5A	\N	AC 0-7Vpp/16-31.5V	\N	\N	\N	线搭接	否	无	\N	0号机	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4086a3de-eb3f-4e90-a97e-f515eaf13d97	2463E01003G900	L270/28V DCDC	24	LRU	7d088409-fad6-45a3-a0e5-cc1de7bc89da	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left 270V-28V DC/DC Converter	L DC/DC	T-2401	2402T3401	TBD	B	\N	f	t	t	\N	\N	276*206*136	t	是	互相隔离	a) 设备安装在面板或设备架上	4	200~330	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
962509cd-50bc-4781-a07e-67c9810d649b	2461E01001G900	左配电盘箱	24	LRU	09fe854f-dbe0-4ee8-8170-02c7c1b33439	approved	区域: 客舱-后设备舱盘箱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left Distribution Panel	LDP	U-2401	2401U3401	TBD	B	\N	f	t	t	\N	\N	390*460*200	t	是	互相隔离	a) 设备安装在面板或设备架上	21	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
99b49e0b-9f8c-4df5-9909-7d2e336c8108	2463E01005G900	E270/28V DCDC	24	LRU	7d088409-fad6-45a3-a0e5-cc1de7bc89da	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Essential 270V-28V DC/DC Converter	E DC/DC	T-2403	2401T2601	TBD	B	\N	f	t	t	\N	\N	276*206*136	t	是	互相隔离	a) 设备安装在面板或设备架上	4	200~330	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a52471a6-739b-4943-8668-8f55e6632753	2461E01005G900	应急配电盘箱	24	LRU	09fe854f-dbe0-4ee8-8170-02c7c1b33439	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Essential Distribution Panel	EDP	U-2403	2401U2601	TBD	B	\N	f	t	t	\N	\N	320*650*170	t	是	互相隔离	a) 设备安装在面板或设备架上	25	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
12a47dbf-ea2a-4928-96fa-dc56b3c1ce35	2462E01005G900	远程配电装置 RPDU3	24	LRU	99e161fe-5853-45c7-ac23-498f5ce38567	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Remote Power Distribution Unit 3	RPDU3	U-2406	2404U3405	TBD	C	\N	f	t	t	\N	\N	293.4*280.3*221.8	t	是	互相隔离	a) 设备安装在面板或设备架上	7	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
15e50bff-bb76-457d-931a-ad7bd482d130	2462E01003G900	远程配电装置 RPDU2	24	LRU	99e161fe-5853-45c7-ac23-498f5ce38567	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Remote Power Distribution Unit 2	RPDU2	U-2405	2404U4103	TBD	C	\N	f	t	t	\N	\N	293.4*280.3*221.8	t	是	互相隔离	a) 设备安装在面板或设备架上	7	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5950dcbc-5e13-4dbc-b7e3-09ab82a8750f	2462E01001G900	远程配电装置 RPDU1	24	LRU	99e161fe-5853-45c7-ac23-498f5ce38567	approved	区域: 驾驶舱-右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Remote Power Distribution Unit 1	RPDU1	U-2404	2404U4101	TBD	C	\N	f	t	t	\N	\N	293.4*280.3*221.8	t	是	互相隔离	a) 设备安装在面板或设备架上	8	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
83cf0b00-ec68-45a0-a724-8b565d162342	2462E01007G900	远程配电装置 RPDU4	24	LRU	99e161fe-5853-45c7-ac23-498f5ce38567	approved	区域: 客舱-后设备舱右设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Remote Power Distribution Unit 4	RPDU4	U-2407	2404U3407	TBD	C	\N	f	t	t	\N	\N	293.4*280.3*221.8	t	是	互相隔离	a) 设备安装在面板或设备架上	4	200~330&\n20~29.2	\N	\N	\N	线搭接	是	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5afc64af-2c92-4b60-9a98-2d148a79c6a6	2519E04001G900	推力手柄	25	LRU	a68e9dfc-127b-4647-9190-a45328cb674b	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Throttle Control Quadrant	TCQ	U-2504	2501U2407	TBD	A	\N	f	t	t	\N	\N	\N	t	否	机壳地	监测电机温度（传感器在内部）	5	0-28V	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1c50a573-ae1f-4782-bb90-81f8dd598ca2	2514E01001G900	驾驶员座椅左	25	structural	60bb61b0-cf7e-4aec-9a8a-bd3b1ed92141	approved	区域: 驾驶舱-地板上	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Pilot Seat	\N	U-2505	2501U2201	KJY400-1911-203	D	\N	f	f	f	\N	\N	\N	f	否	设备内均不共地	1 A ≤ 设备故障电流< 5 A	1	26-32VDC	\N	\N	\N	线搭接	是	\N	\N	\N	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
48436bf1-4dab-4278-9850-cec39c073dd3	3130E02001G900	三轴加速度计（TAA）	31	LRU	fa1ee80f-8e7b-476e-bfbb-1de0c61a10d1	approved	区域: 机翼-中央翼盒	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Tri Axial accelerometer	TAA	U-3101	3101U6101	PA-LASIII-07C	E	\N	f	t	t	\N	\N	\N	t	阳极氧化，不易导电	壳体不带电，不接地，电源地默认和信号地共地	a) 设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上（小于1A）	1	18-32V	\N	\N	\N	无	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
74da3049-7989-4fa0-952b-749234b9da02	3160E01001G900	机载曲面显示屏	31	LRU	ca3a45e0-3fa5-4ba7-87c8-c79bcdc78f01	approved	区域: 驾驶舱-控制面板	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Onboard Curved Display	OCD	U-311	3101P2401	3101P2401-0101-01	B	\N	f	t	t	\N	\N	\N	t	是	电源地、信号地、机壳地相互隔离	c）	5	18~32	\N	\N	\N	线搭接	是	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
82d81c8a-fc3c-4362-8214-b962d9d00f94	3231E11100G900	左主起EHM控制器	32	LRU	f72c944e-4f95-4ebc-a228-4609140100a4	approved	区域: 机翼-中央翼盒	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Left main landing gear actuator control equipment	LMLGACE	U-3202	3201U6105	型号申请暂未审批完	A	\N	f	t	t	\N	\N	300*210*194（不含突出物）	t	否	信号地与机壳地共地,电源地与机壳地不共地,信号地与+28V电源地不共地,信号地与+270V电源地不共地	设备安装在金属结构上	9	270VDC	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c23589d-5f8f-4525-bdc0-920f1ab2c533	3250E12000G900	转弯控制单元	32	LRU	3ae1613d-7473-463e-bad2-5cb46dfebbac	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Steering Control Unit	SCU	U-3205	3201U4101	D3250-2057	A	\N	f	t	t	\N	\N	不超过289*149*130	t	否	信号地与机壳地不共地，电源地与机壳地不共地，信号地与+28V电源地共地，信号地与+270V电源地不共地	1A≤设备故障电流＜5A	\N	16-31.5V/200V-330V	\N	\N	\N	线搭接	是	无	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d26d0aa5-be7e-44d5-bafd-b3da2026be3c	3314E02001G900	驾驶舱灯具调光控制盒	33	LRU	\N	approved	区域: 设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Cockpit Dimming Control Unit	TBD	U-3302	3301U2501	TBD	D	\N	f	t	t	\N	\N	120*60*220	t	是	信号地、电源地与机壳地在设备内隔离	1) b)	\N	22V~30.3V	\N	\N	\N	线搭接	是	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
df446f5f-9e07-4aae-a38b-fb5e9aef3b29	4651E01001G900	视频服务单元1	46	LRU	44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	approved	区域: 客舱-后设备舱左设备架	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Video Monitoring Unit	VMU	U-4602	4601U3501	VAA-CJ8-1A-01	E	\N	f	t	t	\N	\N	94.4*98.3*130	t	是	电源地与机壳地共地	设备直接安装在碳纤维复材（CFC）结构上，或安装在CFC表面的金属结构上；	11	18-32	\N	\N	\N	无	否	\N	\N	基线版本	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fa2e4d12-8395-4eea-864f-a48e4c6dc1f5	3231E11300G900	前起EHM控制器	32	LRU	f72c944e-4f95-4ebc-a228-4609140100a4	approved	区域: 下机身前段-前设备舱	2026-04-22 03:35:09.267422+00	2026-04-22 03:35:09.418072+00	Nose landing gear actuator control equipment	NLGACE	U-3201	3201U4121	型号申请暂未审批完	A	\N	f	t	t	\N	\N	300*210*194（不含突出物）	t	否	信号地与机壳地共地,电源地与机壳地不共地,信号地与+28V电源地不共地,信号地与+270V电源地不共地	设备安装在金属结构上	9	270VDC	\N	\N	\N	线搭接	否	\N	\N	0号机	1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
049f7c9a-5639-4284-b964-c47dd8f68f2a	5231E09000G900	登机门上闩传感器	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 客舱-登机门	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	PASSENGER DOOR LATCHED PROXIMITY SENSOR	PAX LTCH PROX	U-5205	5201D3707	TBD	C	\N	f	\N	\N	\N	\N	\N	f	否	机壳地	1) b)	1	7	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
068f8a07-1907-46a1-b93d-4c7098bd90ab	5233E02001G900	登机门控制面板	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	PASSENGER DOOR Control Panel	PAX CP	U-5209	5201J2501	TBD	C	\N	f	\N	\N	\N	\N	\N	f	否	机壳地	2) b)	1	8	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
438c3120-36ee-4580-9758-3597f62fd65d	5231E08000G900	登机门飞行锁解锁传感器	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 客舱-登机门	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	PASSENGER DOOR FLIGHT LOCK DISENGAGED PROXIMITY SENSOR	PAX FL DNG PROX	U-5204	5201D3705	TBD	C	\N	f	\N	\N	\N	\N	\N	f	否	机壳地	1) b)	1	7	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
536594a1-7a7a-4e64-b837-b0eeed3dec17	5231E11000G900	登机门关闭传感器	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 客舱-登机门	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	PASSENGER DOOR CLOSEDD PROXIMITY SENSOR	PAX CLS PROX	U-5207	5201D3711	TBD	C	\N	f	\N	\N	\N	\N	\N	f	否	机壳地	1) b)	1	7	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6edfca52-fd98-4c53-94d8-14f81d0df193	5231E01000G900	舱门控制系统控制器	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 驾驶舱-左设备架	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	Proximity Sensor Electrical Unit	PROX SNSR ELEC UNIT	U-5201	5201U2501	TBD	B	\N	f	\N	\N	\N	\N	\N	t	是	信号地	1) c)	4	18-33	\N	\N	\N	线搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c44bca34-5667-427c-8bb4-d5440587679d	5232E01001G900	登机门飞行锁	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 客舱-登机门	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	PASSENGER DOOR  Flight Lock Actuator	PAX FLA	U-5208	5201X3701	TBD	C	\N	f	\N	\N	\N	\N	\N	f	否	机壳地	1) b)	1	7	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fd7671f0-2299-43ec-9aa1-77e4c7bbca5b	5231E07000G900	登机门飞行锁上锁传感器	52	structural	dcca152a-9a8b-4970-a67f-182d69bc6679	approved	区域: 客舱-登机门	2026-04-22 03:35:09.351497+00	2026-04-22 03:35:09.418072+00	PASSENGER DOOR FLIGHT LOCK ENGAGED PROXIMITY SENSOR	PAX FL ENG PROX	U-5203	5201D3703	TBD	C	\N	f	\N	\N	\N	\N	\N	f	否	机壳地	1) b)	1	7	\N	\N	\N	面搭接	否	\N	\N	基线版本	2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.programs (id, name, aircraft_type, description, created_at) FROM stdin;
e3b86aee-dc36-4be5-bb88-976748de714c	CE-25A	大型宽体客机	CE-25A电动飞机设备管理	2026-04-22 03:35:09.201444+00
\.


--
-- Data for Name: series; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.series (id, program_id, variant_name, description, created_at) FROM stdin;
2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	e3b86aee-dc36-4be5-bb88-976748de714c	基本型	CE-25A基本型	2026-04-22 03:35:09.201444+00
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, name, country, contact_email, created_at) FROM stdin;
9ca4df86-a3ab-456e-b0c4-3f6f86a68e89	华明航电	\N	\N	2026-04-22 03:35:09.418072+00
1e42d3da-ba8f-456b-bc82-0a9b0c740d76	武汉航达	\N	\N	2026-04-22 03:35:09.418072+00
f7019282-f81d-4963-9d48-573ad22a9fd7	武汉航空仪表有限责任公司（181厂）	\N	\N	2026-04-22 03:35:09.418072+00
6dd4c69a-24fd-42cc-957e-168d00a426a5	西安庆安电气控制有限责任公司	\N	\N	2026-04-22 03:35:09.418072+00
2d0fabf7-fe20-43c8-8aca-51a7db2990a1	陕西华燕仪表有限公司(141厂)	\N	\N	2026-04-22 03:35:09.418072+00
7f584876-1db4-42bc-8d45-dd195dcab928	安徽华明	\N	\N	2026-04-22 03:35:09.418072+00
b71503ab-6769-479c-b4d4-8df509633ba7	AVE	\N	\N	2026-04-22 03:35:09.418072+00
57467571-3567-4c55-b12a-c6e8b0256148	中兴通讯股份有限公司(ZTE)	\N	\N	2026-04-22 03:35:09.418072+00
4e51aac9-1fa8-427e-92a8-c1f6429c6cf7	中航光电	\N	\N	2026-04-22 03:35:09.418072+00
5021d8dc-cd7d-4b20-b0e0-7033d7da92ac	北京中航通用科技有限公司	\N	\N	2026-04-22 03:35:09.418072+00
3b18ec23-1095-4f61-858b-1bab93941fa5	天奥测控	\N	\N	2026-04-22 03:35:09.418072+00
0dddf518-0c0c-42d1-9f35-8439390d731d	北京润科通用技术有限公司	\N	\N	2026-04-22 03:35:09.418072+00
4ced0b23-4e99-4177-8ff5-ca422e0589e5	长沙鑫航机轮刹车有限公司	\N	\N	2026-04-22 03:35:09.418072+00
57aaa1a3-7344-45be-a3f1-35660f0a3cbc	陕西长岭电子科技有限责任公司	\N	\N	2026-04-22 03:35:09.418072+00
07f36105-9639-4398-bcbd-d6dba21f0563	陕西华燕航空仪表有限公司（141厂）	\N	\N	2026-04-22 03:35:09.418072+00
56bed113-5a40-4282-9b7f-89bb21c5ad37	上海柏飞	\N	\N	2026-04-22 03:35:09.418072+00
d4493a44-39dd-4dbc-8855-d5c234d77edc	西安翔腾微电子科技有限公司	\N	\N	2026-04-22 03:35:09.418072+00
7ef007c4-6f7f-49de-b1b1-5fddff84fe65	北京埃特西姆通信技术有限公司	\N	\N	2026-04-22 03:35:09.418072+00
bdfee5ef-7a79-4f62-b82c-fc6e6e9e4644	陕西蓝海电气有限公司	\N	\N	2026-04-22 03:35:09.418072+00
10e23027-2418-4ff5-8392-538a6ea71071	贵州华阳电工	\N	\N	2026-04-22 03:35:09.418072+00
e6c1d314-798f-4d09-bf31-bfa2eaf026ea	北京中科导控科技有限公司	\N	\N	2026-04-22 03:35:09.418072+00
f3338666-75d3-47fa-bbe7-3c9473638ed7	江苏铁锚科技股份有限公司	\N	\N	2026-04-22 03:35:09.418072+00
25e335bb-5a8d-41e1-af72-e0cf82b4c209	航天9院13所	\N	\N	2026-04-22 03:35:09.418072+00
5588fe74-1e8e-46bd-a1f3-f2f57c80cf25	北京精密机电控制设备研究所	\N	\N	2026-04-22 03:35:09.418072+00
2d9557ea-079e-4026-b3bb-6a14a34ec7bc	柏飞电子	\N	\N	2026-04-22 03:35:09.418072+00
831b0930-c008-407d-bbbe-19ce895ba2f1	陕西烽火电子股份有限公司	\N	\N	2026-04-22 03:35:09.418072+00
965e4586-6de4-43f0-9f0d-b0817782ba80	慧石（上海）测控科技有限公司	\N	\N	2026-04-22 03:35:09.418072+00
44ba2d6e-ed4a-4914-aa7d-8d217982d7ec	西安视成	\N	\N	2026-04-22 03:35:09.418072+00
5f65f17f-54ab-458c-8369-037d1e2fbab5	贵州振华群英电器有限公司(891)	\N	\N	2026-04-22 03:35:09.418072+00
797b66d6-7113-467b-a015-cf3ebe01042d	兰州万里航空机电有限责任公司	\N	\N	2026-04-22 03:35:09.418072+00
f72c944e-4f95-4ebc-a228-4609140100a4	中航工业西安飞行自动控制研究所	\N	\N	2026-04-22 03:35:09.418072+00
3ae1613d-7473-463e-bad2-5cb46dfebbac	兰州飞行控制有限责任公司	\N	\N	2026-04-22 03:35:09.418072+00
8c040031-b368-4614-9df4-75b4bc711406	四川凌峰航空液压机械有限公司	\N	\N	2026-04-22 03:35:09.418072+00
fc9cdc04-732f-4ec0-bd28-f89319b4e323	揭榜挂帅未定	\N	\N	2026-04-22 03:35:09.418072+00
3157a390-1cea-4ca3-bb24-f529e67a9a3a	商飞时代	\N	\N	2026-04-22 03:35:09.418072+00
e5a35efa-e170-4952-ab3c-56026e61081d	商飞时代（上海）航空有限公司（商飞时代）	\N	\N	2026-04-22 03:35:09.418072+00
09fe854f-dbe0-4ee8-8170-02c7c1b33439	汉中101厂	\N	\N	2026-04-22 03:35:09.418072+00
bf9309a3-a343-4072-8f97-ed6167b3ec37	贵阳华阳电工有限公司	\N	\N	2026-04-22 03:35:09.418072+00
7d088409-fad6-45a3-a0e5-cc1de7bc89da	成都航域卓越	\N	\N	2026-04-22 03:35:09.418072+00
99e161fe-5853-45c7-ac23-498f5ce38567	天津105厂	\N	\N	2026-04-22 03:35:09.418072+00
a68e9dfc-127b-4647-9190-a45328cb674b	贵州华阳电工有限公司（128厂）	\N	\N	2026-04-22 03:35:09.418072+00
60bb61b0-cf7e-4aec-9a8a-bd3b1ed92141	航宇嘉泰	\N	\N	2026-04-22 03:35:09.418072+00
fa1ee80f-8e7b-476e-bfbb-1de0c61a10d1	西安精准测控有限责任公司	\N	\N	2026-04-22 03:35:09.418072+00
ca3a45e0-3fa5-4ba7-87c8-c79bcdc78f01	中航华东光电	\N	\N	2026-04-22 03:35:09.418072+00
dcca152a-9a8b-4970-a67f-182d69bc6679	114	\N	\N	2026-04-22 03:35:09.418072+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, hashed_password, display_name, role, is_active, created_at) FROM stdin;
f5856ffe-f35d-43f0-96fe-7c0f8f352db3	admin	$2b$12$Dmgj9O8MaMNWQ1E.vgK9L.g8SPXQ1WOk9vZ/jb7yUyo9PAdwYtxGi	系统管理员	admin	t	2026-04-22 03:35:09.201444+00
33a1e27d-ebb5-49fc-bc04-0fd0cda1747a	engineer	$2b$12$8OL7msdLapNbCa60ZrezEep4VC3w/2F5EP0gleLIL0O9LUjfFhT3u	设备工程师	engineer	t	2026-04-22 03:35:09.201444+00
\.


--
-- Data for Name: weight_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.weight_balances (id, equipment_id, mass_kg) FROM stdin;
a0ba7120-f783-4e74-a420-c14143fecaf8	cf6fc01a-24fe-455c-8909-49888a3eacc1	2.671105
81b1f165-0aed-4f8e-9ee0-aa1b58fb2d29	43475883-4fb9-41a0-aa52-ab323bcade9a	10.081134
6ff0828e-b375-46ca-950d-867ab1c74da9	75d609ea-6735-4e45-8425-7e1c5e283f26	3.869881
1ef28efb-746a-406d-959f-a79d0d1cd16e	957836b3-3f19-4a30-9223-5667f6b4afc1	6.386789
2874f35f-8148-4883-b6ec-3ed409c83987	bb57baa7-e178-43d4-84e1-9dc7c73a95ea	98
8f6a1527-5b3a-4a1f-8478-ac808b0d0f93	6d91e335-b44e-4928-b37d-6dc4aea90822	192.4
50ebc8c6-b38f-48e8-b70b-a245d9dd7f0a	b8fbc68a-0401-4d91-a7e5-72137d7070d1	18.8
bdfcc26c-9768-4761-bfdd-9cc5ab56da6b	962509cd-50bc-4781-a07e-67c9810d649b	18
25e0339f-7788-4f8f-959b-63b3016fa027	069cb255-137d-4af4-942c-9a008d3e2e91	18
19ddbc4e-fb1d-4cc7-b95c-b4b7122ba3c1	a52471a6-739b-4943-8668-8f55e6632753	18
f6c33b13-4a8e-45a3-87d8-4637075b1a3b	5950dcbc-5e13-4dbc-b7e3-09ab82a8750f	7.6
816b5aa2-fbc0-4df4-ae76-82256175ca97	15e50bff-bb76-457d-931a-ad7bd482d130	7.6
e790daef-b896-4509-bbda-5ffabc0255ab	12a47dbf-ea2a-4928-96fa-dc56b3c1ce35	7.6
490fe69f-0c13-4dee-b9cf-c95f4b22a10d	83cf0b00-ec68-45a0-a724-8b565d162342	4.5
590bc930-336b-4d6d-885b-a16551d886b2	4086a3de-eb3f-4e90-a97e-f515eaf13d97	6.5
c4948e34-01f5-4d63-bc4b-48939c7a99ec	99b49e0b-9f8c-4df5-9909-7d2e336c8108	6.5
01812119-8a67-4fcc-b3d8-6b4c6fecf3d9	0871bc9a-b530-45e8-a543-9b31939bbec3	5.126831
c85abb85-4fe9-4404-a9a7-0aa7241c4d2c	77ea8529-8214-4479-93d1-4077f1a0470a	6.177486
34602058-6901-4e59-93f9-92453c317605	c0f9627f-0926-4cec-9f50-7bdb7418b9a9	2.116
099d939a-0a14-489e-ad8c-b023648cf497	b8766393-40b7-406b-a18c-d2a13f1f2e57	4.42
db75c3dc-86b7-4b9a-b50b-795edc091a7c	f1efdd80-24ef-4363-83c7-85da0a3f8fe4	3.32
1fab17d3-1ef2-496d-a790-519f555f2f21	dbb50dbf-0e35-4341-a245-992e89321ddd	4.65
13beb4d7-e895-486c-a409-5c248355a52c	56c2dabd-ffa6-4c07-98a0-9fb73715e83b	2.7
6976bcf8-f8a8-452b-9d2d-339b36cbc0d5	e600b367-8f84-4d95-ad42-96afa4cfb9dd	2.7
62977f86-64cd-44c0-a091-e829d90ff8c8	63cfaf67-6676-4ece-ab8e-f68aca7f4fc9	0.669
efe94053-2820-457c-81ca-cf00fdbc27a6	97fc5cff-4840-494d-917d-fefa06476cb7	0.669
d4d2dd1c-4c81-4254-a89f-ea037e04c421	d3a95ede-6378-40ad-9316-422a9750e214	3.32
f6fe63f6-28c5-4d9d-bbc7-fbd9acfed3bb	272e7215-7f69-4954-9e41-46f1eb35788d	3.32
36d39ff3-d12d-4882-84bd-47ad8a8427ad	1809a66a-37dc-4304-8725-529157c5ab8b	0.249
5c6b4f29-b2ac-492d-be3c-1f65ead3c0be	cfefd2dc-8482-4ddf-a86e-c2b2c639af81	0.249
f1e0a976-83a9-42fe-9e87-2bd0e24dc417	0a39cb2a-3bae-4b14-bba6-4fed248c663c	0.04
105888f5-15ec-431a-a8f3-ce29fef634c5	1480efe5-bb89-4038-b472-bf3f88dea12d	0.7
06b0c7e6-2630-41a2-b21e-e66bf88fc9e7	e86889d5-e732-497a-9660-1c4b980fd60a	0.7
345a8c92-1014-4bd9-b0f6-642ac0cf4963	6ddded46-b3f3-4ad4-b231-4dcc9cc51ec2	0.1
bc0b92b3-3e48-4c21-9102-2550d03b7d53	ec589b04-4108-4095-b955-48ba73162d3d	6.665
3ae4be3d-5554-478c-89b5-e8a518bff55f	82d26b07-ac4f-42e7-b560-f666e34c2c0a	0.15
b56b42c3-0b29-4007-ba49-7d9420539da9	78a01034-9fbf-443f-a193-7aed540cd97a	0.15
778d8ce8-8f54-4481-9de8-b85e764bd354	a3a4610a-f956-4b7e-be18-6212d74eb05f	4.06
6f8f40ec-c976-4fec-af22-ec9cbb2b1c89	321ad9fd-0ebd-4b8e-8c49-c76529e22abb	4.06
fbeb2bee-33f6-4cc3-9ff9-127586de664e	05fe5a5e-86e1-4782-8b50-85364c51320a	6
bee5d0c8-9c9f-4ed7-a8fe-e9fd5b772e19	69854094-3a63-43ee-ae98-f6dad96055d3	0.106
56c9bc8f-04f0-487f-941f-9ff60d4fa380	832b98c0-92aa-41ba-a780-b53506f485bc	0.096
96a405e5-385b-45d1-8c2f-5e4f300f6777	ec281aff-e7a4-4bfc-a845-e9d33519e36d	0.096
4dfb466a-e102-41eb-b92c-c1b512cd0e51	9fdaf6f9-f4a5-4412-93b9-d60a5fa2bd8b	0.44
c27a8ff7-7ff9-4fd7-832b-45f6ca8bd168	af8276d8-ac7a-4218-a03f-e3695508adab	0.44
1b47c3fc-c8ee-493e-b5cc-f4873006eca0	66c2b44b-0e1b-438e-a99f-f53684c902e7	0.145
d4c86fc2-4b9f-465c-8d92-5c935353c41a	2074a91a-9c58-4886-826a-cab4fa9c8921	0.145
027ca71c-60af-4dbc-9685-69b26412a489	b3b321a1-ecca-4407-91b0-8240e914593b	0.8
cfc74195-d64a-4747-a8e8-364eb24cb729	7596c827-3493-432b-a84b-f48315379a75	0.48
a546d4a2-32aa-48b8-ac80-d69dbf7791b9	5a525990-1de0-48cc-95dc-78c24253da53	0.48
ff9ddeb6-47c5-4b2a-bdb8-d0a040f11b82	e375d76e-c09c-45f3-bb3b-6b43b6e6b7ce	0.8
3e51d946-237d-4a91-a16b-613682d1c301	635d85f4-4741-4d48-a482-58fb217f2208	1.2
bbebfceb-3dcd-453f-8532-e603015eb1fb	b0909d0d-8a59-4ddb-b1df-032ab378f36d	1.2
522c1619-5f92-4aa8-8f16-373ae8c20c53	5c843dc6-e31c-4120-86fa-a8de99eccff5	1.2
ed49b11c-23d1-41b2-80cd-8794c9c5f180	81900d04-81e6-450f-8d39-895ad28b6438	1.2
f4a544db-57eb-4669-bdb9-69bfb39944df	fa4a3d52-8f03-4d36-a160-7eb066b2f00b	0.790714
15265143-eb04-4f78-81e8-b5c018f1eb89	29dfaf3c-8d81-4e14-8dec-b334430f74c7	0.079161
ccce07c0-0942-4cf6-968e-c434b0d775ca	799bbd94-6e70-4449-a4cd-4c106653c7b3	5.335745
d29c911d-37cc-4033-9b2b-48931d4897ec	8ed8b7ec-c487-40aa-aaab-3340cdb71621	5.4398
1ea3a6ca-bc3b-4198-9ea4-5e2a0e631a20	4a6c4183-0e81-4c9b-bbd9-1be9e9ae7dea	7.21038
e4fbd5a3-de3f-4163-a6ef-eff92a8325e0	6035443e-99da-4c68-ac6d-694baa6c3daf	6.045385
81261383-e5fa-419d-998a-09e41efaade9	18aaf178-059c-4dd3-8607-60ec26d863f8	9.5
31a0b91c-14d8-4b1f-a246-ae7905bfb36f	3e2409ca-018f-4eec-83b9-6cd8a6b4dc94	0.289052
4071ec57-1178-45e7-8b9a-d4a632f136e4	1ddcd47b-e5fe-40a2-8f5f-667395943b20	3.8
a428beff-d443-4ae6-81ab-868daa60b545	b205532a-53b5-4761-85b3-bffb7a1724da	3
69457f58-7470-42d1-8814-0c91cb156967	df446f5f-9e07-4aae-a38b-fb5e9aef3b29	1.153028
12056852-af56-47c6-be6d-ac50aceacb56	1dc3e37f-06ed-4ba8-8c3f-5986ce136723	6.220516
32cf169b-a56e-44e2-b33c-c6d925c470a1	8e92cab8-4e65-436b-9d46-a5ff3092d892	2.41
c86ac585-9570-47c1-b025-ab21fe770953	5e463e2f-7daa-422e-8eef-0df56eaa629c	0.2
41cd2b5e-bbdc-4a54-a4f2-3a480d5eb399	3e1d143c-30c7-482b-aa93-874cc83155c5	2.4
27c729c2-fe40-4592-b5b5-fb0a970b31cd	4689163d-a76c-4222-9381-00125cd79e8c	0.8
91bed156-4acc-4f82-bcfc-e1c41184c0d2	8d2e1f3b-4f46-4f84-9f93-7465f739a2e2	0.8
502cecf7-45ca-40fb-a120-ab26c4ef06cf	90fdb9ea-1c19-4d75-af62-ffcee44ae5c6	8
ea4cc693-1c97-4d2d-96d7-e4cd907dc7ee	394f583b-a892-4241-a46e-f6defc48a3bd	1
8683203c-bf72-4d12-bfa0-861d4d4ef5dd	03e0d842-ce48-450d-a422-3bd8c57bc8bc	0.2
6702011e-33ba-4a16-b306-c865da389d9d	4a6330dc-54aa-4502-941a-5ecca30b43b6	6
7c05006c-89c3-4a9f-b4d9-365c106ce55d	f70fce0c-92c8-4f93-8156-3fb9f80946ec	2.589624
7c2d1c05-0ecd-48ff-a70e-86dcef1e462f	ae39aa76-ecd7-4e51-a3d1-7c43090402f9	1.2849
358fbe91-2f85-4f33-9827-6cdf62741bc7	6edfca52-fd98-4c53-94d8-14f81d0df193	2
3f7d33df-7af4-4661-a7e7-da3e8820d8b5	068f8a07-1907-46a1-b93d-4c7098bd90ab	1.3
\.


--
-- Data for Name: zones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zones (id, series_id, zone_code, name, sta_from, sta_to, wl_from, wl_to, bl_from, bl_to, env_category) FROM stdin;
79db1b8c-7041-4424-a628-39739cd1db75	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	100	机头段	0	120	100	250	\N	\N	\N
39c0da74-eb5c-4690-886e-bed04158e64d	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	110	驾驶舱	120	350	150	280	\N	\N	\N
49a3ef4c-177f-49bb-b39f-fc33eac3eb66	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	120	下机身前段	120	500	50	150	\N	\N	\N
9228048c-6de1-46ea-a674-6c987557c210	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	130	前机身侧面	350	500	100	280	\N	\N	\N
5e0e94ad-877f-42c4-947a-8a1f4ca52cda	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	140	客舱段	350	800	150	300	\N	\N	\N
27b4b0c3-2fbb-429f-9945-4184450b4a71	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	150	下机身后段	500	850	50	150	\N	\N	\N
44667fc0-fb14-4ba2-9e5a-f9870438fdb6	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	200	机翼段	400	700	80	200	\N	\N	\N
1ff1548b-395b-49be-a6c6-a9e8b7fec947	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	300	短舱/发动机	350	650	50	180	\N	\N	\N
668881a2-a105-4e0d-ba81-aae942960a8e	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	400	尾段	850	1100	100	280	\N	\N	\N
dacf6d7d-1e58-46f8-ad30-da511844cfba	2486ebd6-62b6-437f-8dfc-4e9eb9f2749e	999	未知	0	1100	0	300	\N	\N	\N
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bus_definitions bus_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_definitions
    ADD CONSTRAINT bus_definitions_pkey PRIMARY KEY (id);


--
-- Name: change_requests change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_requests
    ADD CONSTRAINT change_requests_pkey PRIMARY KEY (id);


--
-- Name: config_equipment config_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_equipment
    ADD CONSTRAINT config_equipment_pkey PRIMARY KEY (config_id, equipment_id);


--
-- Name: configurations configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_pkey PRIMARY KEY (id);


--
-- Name: electrical_loads electrical_loads_equipment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electrical_loads
    ADD CONSTRAINT electrical_loads_equipment_id_key UNIQUE (equipment_id);


--
-- Name: electrical_loads electrical_loads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electrical_loads
    ADD CONSTRAINT electrical_loads_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: programs programs_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_name_key UNIQUE (name);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weight_balances weight_balances_equipment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_balances
    ADD CONSTRAINT weight_balances_equipment_id_key UNIQUE (equipment_id);


--
-- Name: weight_balances weight_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_balances
    ADD CONSTRAINT weight_balances_pkey PRIMARY KEY (id);


--
-- Name: zones zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_pkey PRIMARY KEY (id);


--
-- Name: ix_audit_logs_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_entity_id ON public.audit_logs USING btree (entity_id);


--
-- Name: ix_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: ix_equipment_ata_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_equipment_ata_chapter ON public.equipment USING btree (ata_chapter);


--
-- Name: ix_equipment_part_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_equipment_part_number ON public.equipment USING btree (part_number);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_zones_zone_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_zones_zone_code ON public.zones USING btree (zone_code);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bus_definitions bus_definitions_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_definitions
    ADD CONSTRAINT bus_definitions_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id);


--
-- Name: change_requests change_requests_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_requests
    ADD CONSTRAINT change_requests_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.configurations(id);


--
-- Name: change_requests change_requests_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_requests
    ADD CONSTRAINT change_requests_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: config_equipment config_equipment_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_equipment
    ADD CONSTRAINT config_equipment_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.bus_definitions(id);


--
-- Name: config_equipment config_equipment_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_equipment
    ADD CONSTRAINT config_equipment_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.configurations(id);


--
-- Name: config_equipment config_equipment_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_equipment
    ADD CONSTRAINT config_equipment_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: config_equipment config_equipment_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.config_equipment
    ADD CONSTRAINT config_equipment_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id);


--
-- Name: configurations configurations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: configurations configurations_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id);


--
-- Name: electrical_loads electrical_loads_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.electrical_loads
    ADD CONSTRAINT electrical_loads_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: equipment equipment_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: series series_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id);


--
-- Name: weight_balances weight_balances_equipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_balances
    ADD CONSTRAINT weight_balances_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: zones zones_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lO4D78LidXMo0nkJaoUCANqGvlGPcnNJbsgBEkosRYEiHfPD5ttWuZuEfqTevPE

