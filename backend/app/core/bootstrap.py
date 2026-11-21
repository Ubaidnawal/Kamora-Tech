import asyncio

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.database.connection import AsyncSessionLocal
from app.models import Role, RoleName, User, UserStatus

settings = get_settings()


async def create_initial_admin() -> None:
    email = settings.BOOTSTRAP_ADMIN_EMAIL.strip()
    password = settings.BOOTSTRAP_ADMIN_PASSWORD

    if not email or not password:
        print("Bootstrap skipped: set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in .env.")
        return

    async with AsyncSessionLocal() as session:
        admin_role = await session.scalar(select(Role).where(Role.name == RoleName.admin))
        if admin_role is None:
            admin_role = Role(name=RoleName.admin, description="Administrator")
            session.add(admin_role)
            await session.flush()
            print("Created admin role.")
        else:
            print("Admin role already exists.")

        user = await session.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(
                full_name="Administrator",
                email=email,
                phone="",
                password_hash=hash_password(password),
                is_active=True,
                is_verified=True,
                status=UserStatus.active,
            )
            session.add(user)
            await session.flush()
            user.roles.append(admin_role)
            await session.commit()
            print(f"Created initial admin user for {email}.")
            return

        if admin_role not in user.roles:
            user.roles.append(admin_role)
            await session.commit()
            print(f"Granted admin role to existing user {email}.")
            return

        print(f"Admin user {email} already exists.")


if __name__ == "__main__":
    asyncio.run(create_initial_admin())
