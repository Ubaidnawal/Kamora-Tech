export const complaintStatuses = ["new", "assigned", "in_progress", "resolved", "closed"] as const;

export const complaintCategories = [
  "Service quality",
  "Product issue",
  "Billing",
  "Delivery",
  "Communication",
  "Other",
] as const;

export const complaintPriorities = ["low", "medium", "high", "urgent"] as const;

export type ComplaintStatus = (typeof complaintStatuses)[number];
export type ComplaintPriority = (typeof complaintPriorities)[number];
export type ComplaintCategory = (typeof complaintCategories)[number];

export type ComplaintTimelineEntry = {
  id: string;
  previous_status: string | null;
  new_status: string;
  message: string | null;
  changed_by_role: string | null;
  created_at: string;
};

export type ComplaintCreateResponse = {
  tracking_id: string;
  status: string;
  message: string;
  created_at: string;
  updated_at: string;
};

export type ComplaintTrackResponse = {
  tracking_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  timeline: ComplaintTimelineEntry[];
};

export type ComplaintListItem = {
  id: string;
  tracking_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  subject: string;
  category: string;
  priority?: string | null;
  status: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type ComplaintAdminDetail = ComplaintListItem & {
  admin_note?: string | null;
  internal_note?: string | null;
  assigned_admin_id?: string | null;
  timeline?: ComplaintTimelineEntry[];
};

export type ComplaintAdminList = {
  items: ComplaintListItem[];
  total: number;
};
