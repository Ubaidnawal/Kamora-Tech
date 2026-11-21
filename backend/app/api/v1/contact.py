import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models import ContactMessage, ProjectInquiry
from app.schemas.commerce import (
    ContactCreateIn,
    ContactOut,
    InquiryCreateIn,
    InquiryOut,
)

logger = logging.getLogger("kamora")

router = APIRouter(tags=["contact"])

DbSession = Annotated[AsyncSession, Depends(get_db)]

SAVE_ERROR_DETAIL = "Your message could not be saved right now. Please try again later."


async def _save(db: AsyncSession, record: ContactMessage | ProjectInquiry) -> None:
    try:
        db.add(record)
        await db.commit()
        await db.refresh(record)
    except (SQLAlchemyError, OSError) as exc:
        await db.rollback()
        logger.error("Failed to save %s: %s", type(record).__name__, type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=SAVE_ERROR_DETAIL) from exc


@router.post("/contact", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
async def create_contact_message(payload: ContactCreateIn, db: DbSession) -> ContactOut:
    message = ContactMessage(**payload.model_dump())
    await _save(db, message)
    return ContactOut.model_validate(message)


@router.post("/inquiries", response_model=InquiryOut, status_code=status.HTTP_201_CREATED)
async def create_project_inquiry(payload: InquiryCreateIn, db: DbSession) -> InquiryOut:
    inquiry = ProjectInquiry(**payload.model_dump())
    await _save(db, inquiry)
    return InquiryOut.model_validate(inquiry)
