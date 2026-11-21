from sqlalchemy import or_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Product, ProductCategory, ProductStatus


def _product_options() -> tuple:
    return (
        selectinload(Product.images),
        selectinload(Product.category),
    )


async def list_products(
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 20,
    category_id: str | None = None,
    featured: bool | None = None,
    search: str | None = None,
    include_inactive: bool = False,
    include_deleted: bool = False,
) -> tuple[list[Product], int]:
    filters = []
    if not include_deleted:
        filters.append(Product.is_deleted.is_(False))
    if not include_inactive:
        filters.append(Product.is_active.is_(True))
        filters.append(Product.status == ProductStatus.active)
    if category_id:
        filters.append(Product.category_id == category_id)
    if featured is not None:
        filters.append(Product.is_featured.is_(featured))
    if search and search.strip():
        pattern = f"%{search.strip()}%"
        filters.append(or_(Product.name.ilike(pattern), Product.slug.ilike(pattern)))

    total = int(await db.scalar(select(func.count(Product.id)).where(*filters)) or 0)
    stmt = (
        select(Product)
        .where(*filters)
        .options(*_product_options())
        .order_by(Product.is_featured.desc(), Product.sort_order.asc(), Product.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.scalars(stmt)
    return list(result.unique()), total


async def get_product(
    db: AsyncSession,
    id_or_slug: str,
    *,
    include_inactive: bool = False,
    include_deleted: bool = False,
) -> Product | None:
    filters = [or_(Product.id == id_or_slug, Product.slug == id_or_slug)]
    if not include_deleted:
        filters.append(Product.is_deleted.is_(False))
    if not include_inactive:
        filters.append(Product.is_active.is_(True))
        filters.append(Product.status == ProductStatus.active)
    result = await db.scalars(select(Product).where(*filters).options(*_product_options()).limit(1))
    return result.unique().first()


async def get_purchasable_product(db: AsyncSession, product_id: str) -> Product | None:
    result = await db.scalars(
        select(Product)
        .where(
            Product.id == product_id,
            Product.is_deleted.is_(False),
            Product.is_active.is_(True),
            Product.status == ProductStatus.active,
        )
        .options(*_product_options())
        .limit(1)
    )
    return result.unique().first()


async def list_categories(
    db: AsyncSession,
    *,
    include_inactive: bool = False,
    include_deleted: bool = False,
) -> list[ProductCategory]:
    filters = []
    if not include_deleted:
        filters.append(ProductCategory.is_deleted.is_(False))
    if not include_inactive:
        filters.append(ProductCategory.is_active.is_(True))
    result = await db.scalars(select(ProductCategory).where(*filters).order_by(ProductCategory.name.asc()))
    return list(result.unique())
