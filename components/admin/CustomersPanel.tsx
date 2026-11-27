"use client";

import { useMemo, useState } from "react";
import {
  AdminBanner,
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  KeyValue,
  Money,
  PaginationControls,
  RatingBadge,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import { AdminShell } from "./AdminShell";
import { buttonSecondaryClass, cardClass, inputClass, labelClass } from "./adminStyles";
import type { AdminUser, CustomerDetail } from "./types";
import { useAdminResource } from "./useAdminResource";
import Link from "next/link";

const PAGE_SIZE = 10;

export function CustomersPanel() {
  const { data, loading, error, reload } = useAdminResource<AdminUser[]>("/api/v1/admin/users?limit=500");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const users = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.full_name, user.email, user.phone, user.id, ...user.roles].some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [query, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <AdminLoadingBlock label="Loading customers" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <AdminPanel title="Customer directory" description="Accounts are loaded from the admin users endpoint. Open a profile to see linked orders, complaints and reviews.">
        <label className="block">
          <span className={labelClass}>Search customers</span>
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Name, email, phone, ID or role"
            className={`${inputClass} mt-2`}
          />
        </label>
      </AdminPanel>

      <AdminPanel title="Accounts" description={`${filtered.length} matching accounts.`}>
        <ResponsiveTable
          columns={[
            { key: "customer", label: "Customer" },
            { key: "contact", label: "Contact" },
            { key: "status", label: "Status" },
            { key: "joined", label: "Joined" },
            { key: "action", label: "" },
          ]}
          rows={visible}
          rowKey={(user) => user.id}
          empty={<AdminEmptyBlock title="No customers found" description="Adjust your search or reload the directory." />}
          renderCell={(user, key) => {
            if (key === "customer") {
              return (
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{user.full_name}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{user.id}</p>
                </div>
              );
            }
            if (key === "contact") {
              return (
                <div className="font-sans text-xs">
                  <p className="text-[#000000]">{user.email}</p>
                  <p className="mt-1 text-[#666666]">{user.phone}</p>
                </div>
              );
            }
            if (key === "status") return <StatusBadge value={user.status} />;
            if (key === "joined") return <DateText value={user.created_at} />;
            return (
              <Link href={`/admin/customers/${user.id}`} className="inline-flex min-h-9 items-center border border-[#1D4ED8] bg-[#1D4ED8] px-3 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFFFFF]">
                View profile
              </Link>
            );
          }}
          renderCard={(user) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{user.full_name}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{user.id}</p>
                </div>
                <StatusBadge value={user.status} />
              </div>
              <div className="mt-4 grid gap-2 font-sans text-xs text-[#555555]">
                <p>{user.email}</p>
                <p>{user.phone}</p>
                <p>Joined <DateText value={user.created_at} /></p>
              </div>
              <Link href={`/admin/customers/${user.id}`} className={`${buttonSecondaryClass} mt-4 w-full`}>View profile</Link>
            </div>
          )}
        />
        <PaginationControls page={page} totalPages={totalPages} total={filtered.length} onPageChange={setPage} />
      </AdminPanel>
    </div>
  );
}

export function CustomerDetailPanel({ userId }: { userId: string }) {
  const { data, loading, error, reload } = useAdminResource<CustomerDetail>(`/api/v1/admin/customers/${encodeURIComponent(userId)}`);

  if (loading) return <AdminLoadingBlock label="Loading customer profile" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;
  if (!data) return <AdminEmptyBlock title="Customer not found" description="No profile was returned for this account." />;

  const { user, orders, complaints, reviews } = data;
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="space-y-6">
      <AdminBanner tone="info" message={`Linked records are loaded from GET /api/v1/admin/customers/${userId}.`} />
      <AdminPanel
        title="Customer profile"
        description={`${user.full_name} · ${user.email}`}
        action={<Link href="/admin/customers" className={buttonSecondaryClass}>All customers</Link>}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Name">{user.full_name}</KeyValue>
          <KeyValue label="Email">{user.email}</KeyValue>
          <KeyValue label="Phone">{user.phone || "—"}</KeyValue>
          <KeyValue label="Status"><StatusBadge value={user.status} /></KeyValue>
          <KeyValue label="Verified"><StatusBadge value={user.is_verified ? "verified" : "unverified"} /></KeyValue>
          <KeyValue label="Active"><StatusBadge value={user.is_active ? "active" : "inactive"} /></KeyValue>
          <KeyValue label="Roles">{user.roles.length ? user.roles.map((role) => <StatusBadge key={role} value={role} />) : "—"}</KeyValue>
          <KeyValue label="Joined"><DateText value={user.created_at} withTime /></KeyValue>
        </div>
      </AdminPanel>

      <AdminPanel title="Orders" description={`${safeOrders.length} orders linked to this customer.`}>
        <ResponsiveTable
          columns={[
            { key: "order", label: "Order" },
            { key: "product", label: "Product" },
            { key: "status", label: "Status" },
            { key: "payment", label: "Payment" },
            { key: "amount", label: "Amount" },
            { key: "created", label: "Created" },
          ]}
          rows={safeOrders}
          rowKey={(order) => order.id}
          empty={<AdminEmptyBlock title="No orders" description="This customer has no linked orders." />}
          renderCell={(order, key) => {
            if (key === "order") return <div><p className="font-sans text-sm font-semibold text-[#000000]">{order.order_number}</p><p className="mt-1 font-sans text-[10px] text-[#666666]">{order.tracking_id}</p></div>;
            if (key === "product") return <span className="font-sans text-xs text-[#444444]">{order.product_name_snapshot}</span>;
            if (key === "status") return <StatusBadge value={order.order_status} />;
            if (key === "payment") return <StatusBadge value={order.payment_status} />;
            if (key === "amount") return <Money value={order.amount} currency={order.currency} />;
            return <DateText value={order.created_at} />;
          }}
          renderCard={(order) => (
            <div className={cardClass}>
              <p className="font-sans text-sm font-semibold text-[#000000]">{order.order_number}</p>
              <p className="mt-1 font-sans text-[11px] text-[#666666]">{order.product_name_snapshot}</p>
              <div className="mt-3 flex flex-wrap gap-2"><StatusBadge value={order.order_status} /><StatusBadge value={order.payment_status} /></div>
              <p className="mt-3 font-sans text-xs text-[#444444]"><Money value={order.amount} currency={order.currency} /> · <DateText value={order.created_at} /></p>
            </div>
          )}
        />
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Complaints" description={`${safeComplaints.length} complaints linked to this customer.`}>
          {safeComplaints.length ? (
            <ul className="space-y-3">
              {safeComplaints.map((complaint) => (
                <li key={complaint.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-sans text-sm font-semibold text-[#000000]">{complaint.subject ?? complaint.tracking_id}</p>
                      <p className="mt-1 font-sans text-[10px] text-[#666666]">{complaint.tracking_id ?? complaint.id} · {complaint.category ?? "—"}</p>
                    </div>
                    <StatusBadge value={complaint.status ?? "new"} tone="info" />
                  </div>
                  <p className="mt-2 font-sans text-[11px] text-[#666666]"><DateText value={complaint.created_at} /></p>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyBlock title="No complaints" description="No complaints are linked to this customer." />
          )}
        </AdminPanel>

        <AdminPanel title="Reviews" description={`${safeReviews.length} reviews written by this customer.`}>
          {safeReviews.length ? (
            <ul className="space-y-3">
              {safeReviews.map((review) => (
                <li key={review.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-sans text-sm font-semibold text-[#000000]">{review.product_name ?? review.product_slug ?? "Product"}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingBadge value={review.rating} />
                      <StatusBadge value={review.is_approved ? "approved" : "pending"} />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 font-sans text-xs leading-relaxed text-[#444444]">{review.review_text}</p>
                  <p className="mt-2 font-sans text-[10px] text-[#666666]"><DateText value={review.created_at} /></p>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyBlock title="No reviews" description="No reviews are linked to this customer." />
          )}
        </AdminPanel>
      </div>
    </div>
  );
}

export function CustomerDetailPage({ userId }: { userId: string }) {
  return (
    <AdminShell title="Customer profile" description="Profile, orders, complaints and reviews loaded from the admin customer endpoint.">
      <CustomerDetailPanel userId={userId} />
    </AdminShell>
  );
}
