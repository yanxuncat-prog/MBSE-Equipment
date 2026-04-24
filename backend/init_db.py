"""Create SQLite database schema and seed initial data."""
import asyncio
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main():
    from app.database import engine, Base
    # Import all models so Base knows about them
    import app.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("Schema created.")

    # Seed users
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        from app.models import User
        admin = User(
            id=str(uuid.uuid4()),
            username="admin",
            hashed_password=pwd_context.hash("admin123"),
            display_name="系统管理员",
            role="admin",
            is_active=True,
        )
        engineer = User(
            id=str(uuid.uuid4()),
            username="engineer",
            hashed_password=pwd_context.hash("engineer123"),
            display_name="设备工程师",
            role="engineer",
            is_active=True,
        )
        session.add_all([admin, engineer])
        await session.commit()
        print(f"Users created: admin ({admin.id}), engineer ({engineer.id})")
        print(f"ADMIN_UID={admin.id}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
