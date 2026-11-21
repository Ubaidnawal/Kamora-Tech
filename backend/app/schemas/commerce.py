from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field

from app.models import (
    CartStatus,
    MessageStatus,
    OrderStatus,
    PaymentStatus,
    ProductStatus,
    UserStatus,
)


def _as_float(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    return value


Money = Annotated[float, BeforeValidator(_as_float)]
OptionalMoney = Annotated[float | None, BeforeValidator(_as_float)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CategoryOut(ORMModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    is_active: bool = True


class ProductImageOut(ORMModel):
    id: str
    url: str
    alt_text: str | None = None
    is_primary: bool = False
    sort_order: int = 0


class ProductOut(ORMModel):
    id: str
    name: str
    slug: str
    short_description: str | None = None
    description: str | None = None
    features: list[Any] = Field(default_factory=list)
    specifications: dict[str, Any] = Field(default_factory=dict)
    price: OptionalMoney = None
    currency: str = "USD"
    status: ProductStatus
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0
    category: CategoryOut | None = None
    images: list[ProductImageOut] = Field(default_factory=list)
    created_at: datetime | None = None


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int = 1
    page_size: int = 20


class CartItemOut(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price: OptionalMoney = None
    line_total: OptionalMoney = None
    product: ProductOut | None = None


class CartOut(BaseModel):
    id: str
    status: CartStatus
    items: list[CartItemOut]
    item_count: int
    total: OptionalMoney
    currency: str = "USD"


class CartAddIn(BaseModel):
    product_id: str = Field(min_length=1, max_length=36)
    quantity: int = Field(default=1, ge=1, le=100)


class CartUpdateIn(BaseModel):
    quantity: int = Field(ge=1, le=100)


class CheckoutIn(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    customer_email: EmailStr
    customer_phone: str = Field(min_length=5, max_length=32)
    business_name: str | None = Field(default=None, max_length=160)
    project_requirements: str | None = None
    additional_instructions: str | None = None


class GuestCartItemIn(BaseModel):
    product_id: str = Field(min_length=1, max_length=36)
    quantity: int = Field(ge=1, le=100)


class GuestCheckoutIn(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    customer_email: EmailStr
    customer_phone: str = Field(min_length=5, max_length=32)
    business_name: str | None = Field(default=None, max_length=160)
    project_requirements: str | None = None
    additional_instructions: str | None = None
    items: list[GuestCartItemIn] = Field(min_length=1, max_length=50)


class OrderStatusHistoryOut(ORMModel):
    id: str
    from_status: OrderStatus | None = None
    to_status: OrderStatus
    note: str | None = None
    created_at: datetime


class OrderItemOut(ORMModel):
    id: str
    product_id: str | None = None
    product_name_snapshot: str
    unit_price: OptionalMoney = None
    quantity: int
    line_total: OptionalMoney = None


class PaymentOut(ORMModel):
    id: str
    order_id: str
    amount: OptionalMoney = None
    currency: str = "USD"
    status: PaymentStatus
    provider: str | None = None
    provider_reference: str | None = None
    paid_at: datetime | None = None
    created_at: datetime


class OrderOut(ORMModel):
    id: str
    order_number: str
    tracking_id: str
    user_id: str | None
    product_id: str | None = None
    product_name_snapshot: str
    customer_name: str
    customer_email: str
    customer_phone: str
    business_name: str | None = None
    project_requirements: str | None = None
    additional_instructions: str | None = None
    amount: OptionalMoney = None
    currency: str = "USD"
    payment_status: PaymentStatus
    order_status: OrderStatus
    admin_notes: str | None = None
    items: list[OrderItemOut] = Field(default_factory=list)
    payments: list[PaymentOut] = Field(default_factory=list)
    status_history: list[OrderStatusHistoryOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime | None = None


class OrderStatusOut(BaseModel):
    order_id: str
    tracking_id: str
    order_status: OrderStatus
    payment_status: PaymentStatus
    timeline: list[OrderStatusHistoryOut]


class TrackOut(BaseModel):
    tracking_id: str
    order_number: str
    order_status: OrderStatus
    payment_status: PaymentStatus
    timeline: list[OrderStatusHistoryOut]
    created_at: datetime
    updated_at: datetime | None = None


class AdminUserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    is_active: bool
    is_verified: bool
    status: UserStatus
    roles: list[str] = Field(default_factory=list)
    created_at: datetime


class MessageOut(BaseModel):
    id: str
    user_id: str
    order_id: str | None = None
    subject: str
    message: str
    status: MessageStatus
    admin_reply: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    created_at: datetime


class ContactCreateIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=32)
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=10, max_length=10000)


class ContactOut(ORMModel):
    id: str
    full_name: str
    email: str
    phone_number: str | None = None
    subject: str
    message: str
    status: MessageStatus
    created_at: datetime
    updated_at: datetime | None = None


class InquiryCreateIn(BaseModel):
    customer_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=32)
    project_type: str = Field(min_length=2, max_length=120)
    project_budget: str | None = Field(default=None, max_length=120)
    project_description: str = Field(min_length=10, max_length=10000)


class InquiryOut(ORMModel):
    id: str
    user_id: str | None = None
    customer_name: str
    email: str
    phone_number: str | None = None
    project_type: str
    project_budget: str | None = None
    project_description: str
    status: MessageStatus
    created_at: datetime
    updated_at: datetime | None = None


class AdminMessageStatusIn(BaseModel):
    status: MessageStatus


class AdminOrderUpdateIn(BaseModel):
    order_status: OrderStatus
    note: str | None = Field(default=None, max_length=4000)


class AdminPaymentUpdateIn(BaseModel):
    status: PaymentStatus
    amount: OptionalMoney = Field(default=None, ge=0)
    provider: str | None = Field(default=None, max_length=80)
    provider_reference: str | None = Field(default=None, max_length=160)
    paid_at: datetime | None = None
    note: str | None = Field(default=None, max_length=4000)


class AdminProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    slug: str | None = Field(default=None, max_length=200)
    category_id: str | None = Field(default=None, max_length=36)
    short_description: str | None = Field(default=None, max_length=500)
    description: str | None = None
    features: list[Any] = Field(default_factory=list)
    specifications: dict[str, Any] = Field(default_factory=dict)
    price: OptionalMoney = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    status: ProductStatus = ProductStatus.active
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0


class AdminProductOut(ProductOut):
    category_id: str | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    updated_at: datetime | None = None


class AdminProductListOut(BaseModel):
    items: list[AdminProductOut]
    total: int
    page: int = 1
    page_size: int = 20


class AdminCategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str | None = Field(default=None, max_length=160)
    description: str | None = None
    is_active: bool = True


class SiteSettingIn(BaseModel):
    value: dict[str, Any] = Field(default_factory=dict)
    description: str | None = Field(default=None, max_length=500)


class SiteSettingOut(ORMModel):
    key: str
    value: dict[str, Any]
    description: str | None = None
    updated_at: datetime | None = None


class AdminUserStatusIn(BaseModel):
    status: UserStatus


class AdminOrderNoteIn(BaseModel):
    note: str = Field(min_length=1, max_length=4000)


class AdminMessageReplyIn(BaseModel):
    reply: str = Field(min_length=1, max_length=4000)
    status: MessageStatus = MessageStatus.answered


class AdminDashboardOut(BaseModel):
    total_users: int
    total_products: int
    total_categories: int
    total_orders: int
    pending_orders: int
    confirmed_orders: int
    in_progress_orders: int
    completed_orders: int
    paid_orders: int
    open_messages: int
    revenue_paid: float
    recent_orders: list[OrderOut] = Field(default_factory=list)
    recent_registrations: list[AdminUserOut] = Field(default_factory=list)


class TopProductOut(BaseModel):
    product_name: str
    units_sold: int
    revenue: float


class MonthlyOrderOut(BaseModel):
    month: str
    orders: int


class ReportOut(BaseModel):
    total_orders: int
    paid_orders: int
    pending_payments: int
    cancelled_orders: int
    total_customers: int
    completed_projects: int
    revenue_paid: float
    average_order_value: float
    orders_by_status: dict[str, int]
    payments_by_status: dict[str, int]
    monthly_orders: list[MonthlyOrderOut] = Field(default_factory=list)
    top_products: list[TopProductOut]


class ReviewCreateIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    id: str
    product_id: str
    product_slug: str
    user_id: str
    user_name: str
    rating: int
    review_text: str | None = None
    created_at: datetime
    updated_at: datetime
    is_updated: bool


class ReviewListOut(BaseModel):
    items: list[ReviewOut]
    total: int
    page: int
    page_size: int


class ReviewSummaryOut(BaseModel):
    product_slug: str
    average_rating: float | None
    review_count: int
    distribution: dict[str, int]
    price: float | None
    currency: str


class TestimonialOut(BaseModel):
    id: str
    user_name: str
    user_avatar: str | None = None
    rating: int
    review_text: str
    product_name: str | None = None
    created_at: datetime
