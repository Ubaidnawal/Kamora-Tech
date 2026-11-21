from collections.abc import Iterable

import pytest
from pydantic import ValidationError
from sqlalchemy import JSON

from app.main import app
from app.models import Base, ContactMessage, Product, ProductFeature, ProjectInquiry
from app.schemas.commerce import (
    ContactCreateIn,
    ContactOut,
    InquiryCreateIn,
    InquiryOut,
)


def _index_names(table: object) -> set[str]:
    return {index.name for index in table.indexes}


def _foreign_key_targets(columns: Iterable[object]) -> list[str]:
    return [next(iter(column.foreign_keys)).target_fullname for column in columns if column.foreign_keys]


def test_new_tables_have_required_columns_and_indexes() -> None:
    tables = Base.metadata.tables
    assert {"product_features", "contact_messages", "project_inquiries"} <= set(tables)

    features = tables["product_features"]
    assert {"id", "product_id", "feature_name", "feature_description", "sort_order", "created_at"} <= set(
        features.c.keys()
    )
    assert "updated_at" not in features.c
    assert _foreign_key_targets([features.c.product_id]) == ["products.id"]
    assert "ix_product_features_product_sort" in _index_names(features)

    contacts = tables["contact_messages"]
    assert {
        "id",
        "full_name",
        "email",
        "phone_number",
        "subject",
        "message",
        "status",
        "created_at",
        "updated_at",
    } <= set(contacts.c.keys())
    assert {"ix_contact_messages_status", "ix_contact_messages_created_at"} <= _index_names(contacts)

    inquiries = tables["project_inquiries"]
    assert {
        "id",
        "user_id",
        "customer_name",
        "email",
        "phone_number",
        "project_type",
        "project_budget",
        "project_description",
        "status",
        "created_at",
        "updated_at",
    } <= set(inquiries.c.keys())
    assert _foreign_key_targets([inquiries.c.user_id]) == ["users.id"]
    assert {"ix_project_inquiries_status", "ix_project_inquiries_created_at"} <= _index_names(inquiries)


def test_existing_product_features_json_column_is_preserved() -> None:
    assert isinstance(Product.__table__.c.features.type, JSON)
    assert ProductFeature.__tablename__ == "product_features"
    assert ContactMessage.__tablename__ == "contact_messages"
    assert ProjectInquiry.__tablename__ == "project_inquiries"


def test_public_create_schemas_validate_payloads() -> None:
    contact = ContactCreateIn(
        full_name="Ada Lovelace",
        email="ada@example.com",
        subject="Project question",
        message="I would like to discuss a new website project with your team.",
    )
    assert contact.phone_number is None
    assert ContactOut.model_fields["status"].annotation is not None

    inquiry = InquiryCreateIn(
        customer_name="Ada Lovelace",
        email="ada@example.com",
        project_type="Website",
        project_budget="10k-20k",
        project_description="We need a new marketing website with a content management system.",
    )
    assert inquiry.phone_number is None
    assert InquiryOut.model_fields["user_id"].annotation is not None

    with pytest.raises(ValidationError):
        ContactCreateIn(full_name="A", email="not-an-email", subject="Question", message="Too short")


def test_public_and_admin_routes_are_registered() -> None:
    paths = app.openapi()["paths"]
    assert "post" in paths["/api/v1/contact"]
    assert "post" in paths["/api/v1/inquiries"]
    assert "get" in paths["/api/v1/admin/contact-messages"]
    assert "patch" in paths["/api/v1/admin/contact-messages/{message_id}/status"]
    assert "get" in paths["/api/v1/admin/inquiries"]
    assert "patch" in paths["/api/v1/admin/inquiries/{inquiry_id}/status"]
