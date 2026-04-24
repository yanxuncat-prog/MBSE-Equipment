"""Seed the database with sample CE-25A data."""
import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, async_session_factory, Base
from app.models import *
from app.services import import_svc

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # 1. Create admin user
        admin = User(
            username="admin",
            hashed_password=pwd_context.hash("admin123"),
            display_name="系统管理员",
            role="admin",
        )
        engineer = User(
            username="engineer",
            hashed_password=pwd_context.hash("eng123"),
            display_name="设备工程师",
            role="engineer",
        )
        db.add_all([admin, engineer])
        await db.flush()

        # 2. Create program
        program = Program(name="CE-25A", aircraft_type="大型宽体客机", description="CE-25A型飞机设备管理")
        db.add(program)
        await db.flush()

        # 3. Create zones
        zones_data = [
            ("131", "前电子设备舱", 178, 360, 120, 220),
            ("132", "前起落架舱/中电子舱", 360, 600, 100, 210),
            ("141", "后电子设备舱", 850, 950, 130, 200),
            ("142", "尾段设备舱", 950, 1100, 120, 180),
        ]
        zone_map = {}
        for code, name, sf, st, wf, wt in zones_data:
            z = Zone(program_id=program.id, zone_code=code, name=name, sta_from=sf, sta_to=st, wl_from=wf, wl_to=wt)
            db.add(z)
            await db.flush()
            zone_map[code] = str(z.id)

        # 4. Create bus definitions
        buses_data = [
            ("AC BUS 1", "AC", 20.0),
            ("AC BUS 2", "AC", 20.0),
            ("DC ESS", "DC", 5.0),
            ("DC MAIN", "DC", 8.0),
        ]
        bus_map = {}
        for bname, btype, cap in buses_data:
            b = BusDefinition(program_id=program.id, bus_name=bname, bus_type=btype, rated_capacity_kva=cap)
            db.add(b)
            await db.flush()
            bus_map[bname] = str(b.id)

        await db.commit()

        # 5. Import sample equipment from Excel
        xlsx_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "sample", "ce25a_equipment.xlsx")
        if os.path.exists(xlsx_path):
            result = await import_svc.import_from_excel(db, xlsx_path, zone_map=zone_map, bus_map=bus_map)
            print(f"Imported {result['success_count']}/{result['total_rows']} equipment")
            if result["error_rows"]:
                for err in result["error_rows"]:
                    print(f"  Row {err['row']}: {err['error']}")
        else:
            print(f"Warning: Sample Excel not found at {xlsx_path}")

        # 6. Create V1.0 baseline configuration
        from sqlalchemy import select
        all_equip = (await db.execute(select(Equipment))).scalars().all()

        config = Configuration(
            program_id=program.id,
            version="V1.0",
            status="baseline",
            description="初始基线构型",
            created_by=admin.id,
        )
        db.add(config)
        await db.flush()

        for idx, equip in enumerate(all_equip, 1):
            ce = ConfigEquipment(config_id=config.id, lin_number=f"LIN-{idx:04d}", equipment_id=equip.id)
            db.add(ce)

        # Create a draft V1.1 for working
        config_draft = Configuration(
            program_id=program.id,
            version="V1.1-draft",
            status="draft",
            description="工作构型",
            created_by=engineer.id,
        )
        db.add(config_draft)
        await db.flush()

        for idx, equip in enumerate(all_equip, 1):
            ce = ConfigEquipment(config_id=config_draft.id, lin_number=f"LIN-{idx:04d}", equipment_id=equip.id)
            db.add(ce)

        await db.commit()
        print(f"Seed complete: {len(all_equip)} equipment in V1.0 baseline + V1.1-draft")


if __name__ == "__main__":
    asyncio.run(seed())
