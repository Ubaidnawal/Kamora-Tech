from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, verify_csrf_token
from app.database.connection import get_db
from app.models import User
from app.schemas.commerce import (
    ProductListOut,
    ProductOut,
    ReviewCreateIn,
    ReviewListOut,
    ReviewOut,
    ReviewSummaryOut,
    TestimonialOut,
)
from app.services import catalog_service, review_service

router = APIRouter(prefix="/products", tags=["products"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=ProductListOut)
async def list_products(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    category_id: str | None = Query(default=None),
    featured: bool | None = Query(default=None),
    search: str | None = Query(default=None),
) -> ProductListOut:
    products, total = await catalog_service.list_products(
        db,
        page=page,
        page_size=page_size,
        category_id=category_id,
        featured=featured,
        search=search,
    )
    return ProductListOut(
        items=[ProductOut.model_validate(product) for product in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/reviews/summaries", response_model=dict[str, ReviewSummaryOut])
async def get_review_summaries(
    db: DbSession,
    slugs: str = Query(default=""),
) -> dict[str, ReviewSummaryOut]:
    slug_list = [s.strip() for s in slugs.split(",") if s.strip()]
    summaries = await review_service.get_review_summaries(db, slug_list)
    return {slug: ReviewSummaryOut.model_validate(summary) for slug, summary in summaries.items()}


@router.get("/reviews/testimonials", response_model=list[TestimonialOut])
async def list_testimonials(
    db: DbSession,
    limit: int = Query(default=12, ge=1, le=24),
) -> list[TestimonialOut]:
    items = await review_service.list_public_testimonials(db, limit=limit)
    return [TestimonialOut.model_validate(item) for item in items]


@router.get("/{id_or_slug}/reviews/summary", response_model=ReviewSummaryOut)
async def get_review_summary(db: DbSession, id_or_slug: str) -> ReviewSummaryOut:
    summary = await review_service.get_review_summary(db, id_or_slug)
    return ReviewSummaryOut.model_validate(summary)


@router.get("/{id_or_slug}/reviews", response_model=ReviewListOut)
async def list_reviews(
    db: DbSession,
    id_or_slug: str,
    sort: str = Query(default="recent"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> ReviewListOut:
    result = await review_service.list_reviews(db, id_or_slug, sort=sort, page=page, page_size=page_size)
    return ReviewListOut.model_validate(result)


@router.get("/{id_or_slug}/reviews/me", response_model=ReviewOut | None)
async def get_my_review(
    id_or_slug: str,
    db: DbSession,
    user: CurrentUser,
) -> ReviewOut | None:
    review = await review_service.get_my_review(db, id_or_slug, user)
    return ReviewOut.model_validate(review) if review is not None else None


@router.post("/{id_or_slug}/reviews", response_model=ReviewOut)
async def upsert_review(
    id_or_slug: str,
    payload: ReviewCreateIn,
    request: Request,
    db: DbSession,
    user: CurrentUser,
) -> ReviewOut:
    await verify_csrf_token(request)
    review = await review_service.upsert_review(
        db,
        id_or_slug,
        user,
        rating=payload.rating,
        review_text=payload.review_text,
    )
    return ReviewOut.model_validate(review)


@router.get("/{id_or_slug}", response_model=ProductOut)
async def get_product(db: DbSession, id_or_slug: str) -> ProductOut:
    product = await catalog_service.get_product(db, id_or_slug)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductOut.model_validate(product)
