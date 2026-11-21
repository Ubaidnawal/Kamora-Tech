from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Product, ProductReview, User
from app.services import catalog_service


def _db_now() -> datetime:
    return datetime.now(UTC)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _empty_distribution() -> dict[str, int]:
    return {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}


def review_to_out(review: ProductReview) -> dict[str, Any]:
    product = review.product
    user = review.user
    created_at = review.created_at
    updated_at = review.updated_at
    return {
        "id": str(review.id),
        "product_id": str(review.product_id),
        "product_slug": str(product.slug) if product is not None else "",
        "user_id": str(review.user_id),
        "user_name": str(user.full_name) if user is not None else "",
        "rating": int(review.rating),
        "review_text": review.review_text,
        "created_at": created_at,
        "updated_at": updated_at,
        "is_updated": bool(
            created_at
            and updated_at
            and _as_utc(updated_at) is not None
            and _as_utc(created_at) is not None
            and _as_utc(updated_at) > _as_utc(created_at)
        ),
    }


async def _resolve_product(db: AsyncSession, id_or_slug: str) -> Product:
    product = await catalog_service.get_product(db, id_or_slug)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def _summary_rows(db: AsyncSession, product_ids: list[str]) -> dict[str, dict[str, Any]]:
    if not product_ids:
        return {}

    stmt = (
        select(
            ProductReview.product_id.label("product_id"),
            func.count(ProductReview.id).label("review_count"),
            func.avg(ProductReview.rating).label("average_rating"),
            func.sum(case((ProductReview.rating == 1, 1), else_=0)).label("r1"),
            func.sum(case((ProductReview.rating == 2, 1), else_=0)).label("r2"),
            func.sum(case((ProductReview.rating == 3, 1), else_=0)).label("r3"),
            func.sum(case((ProductReview.rating == 4, 1), else_=0)).label("r4"),
            func.sum(case((ProductReview.rating == 5, 1), else_=0)).label("r5"),
        )
        .where(ProductReview.product_id.in_(product_ids))
        .group_by(ProductReview.product_id)
    )
    result = await db.execute(stmt)
    rows: dict[str, dict[str, Any]] = {}
    for row in result.mappings():
        product_id = str(row["product_id"])
        count = int(row["review_count"] or 0)
        avg = float(row["average_rating"]) if row["average_rating"] is not None else None
        rows[product_id] = {
            "average_rating": avg,
            "review_count": count,
            "distribution": {
                "1": int(row["r1"] or 0),
                "2": int(row["r2"] or 0),
                "3": int(row["r3"] or 0),
                "4": int(row["r4"] or 0),
                "5": int(row["r5"] or 0),
            },
        }
    return rows


def _summary_for_product(product: Product, aggregate: dict[str, Any] | None) -> dict[str, Any]:
    data = aggregate or {
        "average_rating": None,
        "review_count": 0,
        "distribution": _empty_distribution(),
    }
    price = product.price
    return {
        "product_slug": str(product.slug),
        "average_rating": data["average_rating"],
        "review_count": int(data["review_count"]),
        "distribution": data["distribution"],
        "price": float(price) if price is not None else None,
        "currency": str(product.currency),
    }


async def get_review_summaries(db: AsyncSession, slugs: list[str]) -> dict[str, dict[str, Any]]:
    normalized: list[str] = []
    seen: set[str] = set()
    for raw in slugs:
        slug = str(raw).strip()
        if not slug or slug in seen:
            continue
        seen.add(slug)
        normalized.append(slug)
    if not normalized:
        return {}

    result = await db.scalars(
        select(Product).where(
            Product.slug.in_(normalized),
            Product.is_deleted.is_(False),
            Product.is_active.is_(True),
        )
    )
    products = list(result.unique())
    by_slug = {str(p.slug): p for p in products}
    aggregates = await _summary_rows(db, [str(p.id) for p in products])

    summaries: dict[str, dict[str, Any]] = {}
    for slug in normalized:
        product = by_slug.get(slug)
        if product is None:
            continue
        summaries[slug] = _summary_for_product(product, aggregates.get(str(product.id)))
    return summaries


async def get_review_summary(db: AsyncSession, id_or_slug: str) -> dict[str, Any]:
    product = await _resolve_product(db, id_or_slug)
    aggregates = await _summary_rows(db, [str(product.id)])
    return _summary_for_product(product, aggregates.get(str(product.id)))


async def list_reviews(
    db: AsyncSession,
    id_or_slug: str,
    *,
    sort: str = "recent",
    page: int = 1,
    page_size: int = 10,
) -> dict[str, Any]:
    product = await _resolve_product(db, id_or_slug)
    if sort not in {"recent", "highest", "lowest"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid sort")

    filters = [ProductReview.product_id == str(product.id)]
    total = int(await db.scalar(select(func.count(ProductReview.id)).where(*filters)) or 0)

    order = [ProductReview.created_at.desc(), ProductReview.id.desc()]
    if sort == "highest":
        order = [ProductReview.rating.desc(), ProductReview.created_at.desc(), ProductReview.id.desc()]
    elif sort == "lowest":
        order = [ProductReview.rating.asc(), ProductReview.created_at.desc(), ProductReview.id.desc()]

    stmt = (
        select(ProductReview)
        .where(*filters)
        .options(selectinload(ProductReview.product), selectinload(ProductReview.user))
        .order_by(*order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await db.scalars(stmt)
    items = [review_to_out(review) for review in list(result.unique())]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def get_my_review(db: AsyncSession, id_or_slug: str, user: User) -> dict[str, Any] | None:
    product = await _resolve_product(db, id_or_slug)
    result = await db.scalars(
        select(ProductReview)
        .where(ProductReview.product_id == str(product.id), ProductReview.user_id == str(user.id))
        .options(selectinload(ProductReview.product), selectinload(ProductReview.user))
        .limit(1)
    )
    review = result.unique().first()
    return review_to_out(review) if review is not None else None


async def upsert_review(
    db: AsyncSession,
    id_or_slug: str,
    user: User,
    *,
    rating: int,
    review_text: str | None,
) -> dict[str, Any]:
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Rating must be between 1 and 5")

    normalized_text = review_text.strip() if isinstance(review_text, str) else None
    if normalized_text == "":
        normalized_text = None
    if normalized_text is not None and len(normalized_text) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Review text must be at most 2000 characters",
        )

    product = await _resolve_product(db, id_or_slug)

    async def _load(product_id: str, user_id: str) -> ProductReview | None:
        result = await db.scalars(
            select(ProductReview)
            .where(ProductReview.product_id == product_id, ProductReview.user_id == user_id)
            .options(selectinload(ProductReview.product), selectinload(ProductReview.user))
            .limit(1)
        )
        return result.unique().first()

    existing = await _load(str(product.id), str(user.id))
    if existing is not None:
        existing.rating = rating
        existing.review_text = normalized_text
        existing.updated_at = _db_now()
        await db.commit()
        refreshed = await _load(str(product.id), str(user.id))
        assert refreshed is not None
        return review_to_out(refreshed)

    now = _db_now()
    review = ProductReview(
        product_id=str(product.id),
        user_id=str(user.id),
        rating=rating,
        review_text=normalized_text,
        created_at=now,
        updated_at=now,
    )
    db.add(review)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await _load(str(product.id), str(user.id))
        if existing is None:
            raise
        existing.rating = rating
        existing.review_text = normalized_text
        existing.updated_at = _db_now()
        await db.commit()
        refreshed = await _load(str(product.id), str(user.id))
        assert refreshed is not None
        return review_to_out(refreshed)

    refreshed = await _load(str(product.id), str(user.id))
    assert refreshed is not None
    return review_to_out(refreshed)


async def list_public_testimonials(db: AsyncSession, limit: int = 12) -> list[dict[str, Any]]:
    limit = max(1, min(limit, 24))
    stmt = (
        select(ProductReview)
        .where(ProductReview.review_text.is_not(None), func.length(func.trim(ProductReview.review_text)) > 0)
        .options(selectinload(ProductReview.product), selectinload(ProductReview.user).selectinload(User.profile))
        .order_by(ProductReview.rating.desc(), ProductReview.created_at.desc())
        .limit(limit)
    )
    result = await db.scalars(stmt)
    items: list[dict[str, Any]] = []
    for review in list(result.unique()):
        user = review.user
        product = review.product
        text = (review.review_text or "").strip()
        if not text:
            continue
        items.append(
            {
                "id": str(review.id),
                "user_name": str(user.full_name) if user is not None else "Customer",
                "user_avatar": (user.profile.avatar_url if user and user.profile else None),
                "rating": int(review.rating),
                "review_text": text,
                "product_name": str(product.name) if product is not None else None,
                "created_at": review.created_at,
            }
        )
    return items
