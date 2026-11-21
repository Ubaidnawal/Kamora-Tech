from __future__ import annotations

import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.base import SoftDeleteMixin
from app.database.connection import AsyncSessionLocal
from app.models import Product, ProductCategory


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


CATEGORIES = [
    {
        "name": "Website Development",
        "slug": "website-development",
        "description": "Editorial, fast and built to convert for businesses, portfolios and online stores.",
    },
    {
        "name": "Management Systems",
        "slug": "management-systems",
        "description": "Purpose-built internal systems that replace spreadsheets and scattered tools.",
    },
    {
        "name": "Software Development",
        "slug": "software-development",
        "description": "Custom business software, dashboards and automation shaped around real workflows.",
    },
]

PRODUCTS: list[dict[str, Any]] = [
    {
        "name": "E-Commerce Website",
        "category": "Website Development",
        "short_description": "A storefront built around product storytelling, catalogue management and checkout.",
        "description": "Complete online stores, product catalogues, shopping cart interfaces and responsive checkout UI, built around your audience and goals.",
        "features": ["Complete Online Stores", "Product Management", "Shopping Cart Interfaces", "Product Catalogues", "Responsive Checkout UI", "Storefront Design", "E-Commerce Redesign"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "Hospital Management System",
        "category": "Management Systems",
        "short_description": "One calm working view for appointments, staff and operational information.",
        "description": "Purpose-built internal systems that replace spreadsheets and scattered tools with one reliable source of truth for your team.",
        "features": ["Appointment Management System", "Employee Management System", "Inventory Management System", "Role-based working views"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "School Management System",
        "category": "Management Systems",
        "short_description": "Student, staff and scheduling information in one structured place.",
        "description": "Purpose-built internal systems that replace spreadsheets and scattered tools with one reliable source of truth for your team.",
        "features": ["Student Management System", "Employee Management System", "Appointment Management System", "Role-based working views"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "Restaurant Website",
        "category": "Website Development",
        "short_description": "A focused restaurant presence with a clear path to enquiry or booking.",
        "description": "Editorial, fast and built to convert, with an audience-first structure and responsive layouts.",
        "features": ["Restaurant Website", "Booking & Reservation Systems", "Responsive layouts", "Clear enquiry path"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "Business Website",
        "category": "Website Development",
        "short_description": "A clear, credible company presence with considered typography and enquiry path.",
        "description": "Editorial, fast and built to convert. From a focused landing page to a multi-section corporate platform, every build starts with your audience and goals.",
        "features": ["Art Direction", "Next.js", "CMS", "Service structure", "Direct enquiry path"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "Portfolio Website",
        "category": "Website Development",
        "short_description": "A curated, typographic home for selected work and professional identity.",
        "description": "Editorial compositions with clear hierarchy, deliberate space and restrained detail across phone, tablet and widescreen.",
        "features": ["Portfolio Website", "Personal Website", "Editorial Publishing Platform", "Responsive layouts"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "ERP Software",
        "category": "Software Development",
        "short_description": "A role-based admin interface for live information, exceptions and reporting.",
        "description": "Custom business software, dashboards and automation that remove repetitive work and let your people focus on what matters.",
        "features": ["ERP Software", "Admin Dashboards", "Automation", "Role-based working views"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "CRM Software",
        "category": "Software Development",
        "short_description": "Scheduling, reminders and a calmer customer management workflow.",
        "description": "Customer management systems and booking workflows that keep information in one place.",
        "features": ["CRM Software", "Customer Management Systems", "Booking & Reservation Systems", "Scheduling"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "Custom Website Development",
        "category": "Website Development",
        "short_description": "A website shaped around your audience, content and business objective.",
        "description": "Editorial, fast and built to convert, extended with custom web applications and care plans where needed.",
        "features": ["E-Commerce Website", "Business Website", "Corporate Website", "Portfolio Website", "Personal Website", "Blog Website"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
    {
        "name": "Custom Software Development",
        "category": "Software Development",
        "short_description": "Business software shaped around real workflows, dashboards and integrations.",
        "description": "Custom business software, dashboards and automation that remove repetitive work. Scope is defined during discovery and confirmed in a fixed-scope proposal.",
        "features": ["ERP Software", "CRM Software", "POS Software", "Billing Software", "Custom Business Software", "Admin Dashboards"],
        "specifications": {"engagement": "Fixed-scope proposal", "pricing": "Quoted after discovery"},
    },
]


async def seed_catalog(session: AsyncSession) -> None:
    category_ids: dict[str, str] = {}
    for item in CATEGORIES:
        result = await session.scalar(select(ProductCategory).where(ProductCategory.slug == item["slug"]))
        category = result or ProductCategory(**item)
        if result is not None:
            for key, value in item.items():
                setattr(category, key, value)
            category.is_deleted = False
        session.add(category)
        await session.flush()
        category_ids[item["name"]] = category.id

    for item in PRODUCTS:
        slug = _slugify(item["name"])
        result = await session.scalar(select(Product).where(Product.slug == slug))
        product = result or Product(slug=slug, price=None, currency="USD", is_active=True, is_featured=True)
        product.category_id = category_ids[item["category"]]
        product.name = item["name"]
        product.short_description = item["short_description"]
        product.description = item["description"]
        product.features = item["features"]
        product.specifications = item["specifications"]
        if isinstance(product, SoftDeleteMixin):
            product.is_deleted = False
            product.deleted_at = None
        session.add(product)

    await session.commit()


async def main() -> None:
    async with AsyncSessionLocal() as session:
        await seed_catalog(session)
    print("Catalog seeded: 3 categories, 10 products, no prices configured.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
