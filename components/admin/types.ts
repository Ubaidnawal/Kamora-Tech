export type UserStatus = "active" | "suspended";

export type ProductStatus = "draft" | "active" | "archived";

export type OrderStatus = "pending" | "confirmed" | "in_progress" | "under_review" | "completed" | "cancelled";

export type PaymentStatus = "pending" | "awaiting_payment" | "partially_paid" | "paid" | "refunded";

export type MessageStatus = "open" | "answered" | "closed";

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  status: UserStatus;
  roles: string[];
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  features: unknown[];
  specifications: Record<string, unknown>;
  price: number | null;
  currency: string;
  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  category: Category | null;
  category_id: string | null;
  images: ProductImage[];
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AdminProductList = {
  items: AdminProduct[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminProductPayload = {
  name: string;
  slug: string | null;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  features: unknown[];
  specifications: Record<string, unknown>;
  price: number | null;
  currency: string;
  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type AdminCategoryPayload = {
  name: string;
  slug: string | null;
  description: string | null;
  is_active: boolean;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number | null;
  currency: string;
  status: PaymentStatus;
  provider: string | null;
  provider_reference: string | null;
  paid_at: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price: number | null;
  quantity: number;
  line_total: number | null;
};

export type OrderStatusHistory = {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type AdminOrder = {
  id: string;
  order_number: string;
  tracking_id: string;
  user_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  business_name: string | null;
  project_requirements: string | null;
  additional_instructions: string | null;
  amount: number | null;
  currency: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  admin_notes: string | null;
  items: OrderItem[];
  payments: Payment[];
  status_history: OrderStatusHistory[];
  created_at: string;
  updated_at: string | null;
};

export type AdminDashboard = {
  total_users: number;
  total_products: number;
  total_categories: number;
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  paid_orders: number;
  open_messages: number;
  revenue_paid: number;
  recent_orders: AdminOrder[];
  recent_registrations: AdminUser[];
};

export type TopProduct = {
  product_name: string;
  units_sold: number;
  revenue: number;
};

export type MonthlyOrder = {
  month: string;
  orders: number;
};

export type Report = {
  total_orders: number;
  paid_orders: number;
  pending_payments: number;
  cancelled_orders: number;
  total_customers: number;
  completed_projects: number;
  revenue_paid: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  payments_by_status: Record<string, number>;
  monthly_orders: MonthlyOrder[];
  top_products: TopProduct[];
};

export type SiteSetting = {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string | null;
};

export type CustomerMessage = {
  id: string;
  user_id: string;
  order_id: string | null;
  subject: string;
  message: string;
  status: MessageStatus;
  admin_reply: string | null;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
};
