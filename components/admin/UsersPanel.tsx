"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import { cardClass, inputClass, labelClass } from "./adminStyles";
import type { AdminUser, UserStatus } from "./types";
import { useAdminResource } from "./useAdminResource";

const statusOptions: UserStatus[] = ["active", "suspended"];

export function UsersPanel() {
  const { data, setData, loading, error, reload } = useAdminResource<AdminUser[]>("/api/v1/admin/users?limit=200");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const roles = useMemo(() => {
    const values = new Set<string>();
    (data ?? []).forEach((user) => user.roles.forEach((role) => values.add(role)));
    return Array.from(values).sort();
  }, [data]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data ?? []).filter((user) => {
      const matchesText =
        !needle ||
        [user.full_name, user.email, user.phone, user.id].some((value) => value.toLowerCase().includes(needle));
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter);
      return matchesText && matchesStatus && matchesRole;
    });
  }, [data, query, roleFilter, statusFilter]);

  const updateStatus = async (user: AdminUser, status: UserStatus) => {
    if (status === user.status) return;
    setUpdatingId(user.id);
    setActionError("");

    try {
      const updated = await apiFetch<AdminUser>(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? [updated]);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The status update could not be completed.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <AdminLoadingBlock label="Loading users" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Directory filters"
        description="Search and filter accounts already returned by the admin users endpoint."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className={labelClass}>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email, phone or ID"
              className={`${inputClass} mt-2`}
            />
          </label>
          <label>
            <span className={labelClass}>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | UserStatus)}
              className={`${inputClass} mt-2`}
            >
              <option value="all">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={`${inputClass} mt-2`}>
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-4 font-sans text-[11px] leading-relaxed text-cream/45">
          Password fields are never requested or displayed. The admin users response does not include credentials.
        </p>
      </AdminPanel>

      {actionError && (
        <div role="alert" className={`${cardClass} border-burgundy/60 text-sm text-cream`}>
          {actionError}
        </div>
      )}

      <AdminPanel
        title="Accounts"
        description={`${filteredUsers.length.toString().padStart(2, "0")} of ${(data?.length ?? 0).toString().padStart(2, "0")} loaded accounts shown.`}
      >
        <ResponsiveTable
          columns={[
            { key: "user", label: "User" },
            { key: "contact", label: "Contact" },
            { key: "roles", label: "Roles" },
            { key: "status", label: "Status" },
            { key: "joined", label: "Joined" },
            { key: "action", label: "Update status" },
          ]}
          rows={filteredUsers}
          rowKey={(user) => user.id}
          empty={<AdminEmptyBlock title="No matching users" description="Adjust the filters above or reload the directory." />}
          renderCell={(user, key) => {
            if (key === "user") {
              return (
                <div>
                  <p className="font-sans text-sm font-medium text-cream">{user.full_name}</p>
                  <p className="mt-1 font-sans text-[10px] tracking-wide text-cream/40">{user.id}</p>
                </div>
              );
            }
            if (key === "contact") {
              return (
                <div className="font-sans text-xs leading-relaxed">
                  <p className="text-cream/85">{user.email}</p>
                  <p className="text-cream/55">{user.phone}</p>
                </div>
              );
            }
            if (key === "roles") {
              return (
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.length ? user.roles.map((role) => <StatusBadge key={role} value={role} />) : <span className="text-cream/40">—</span>}
                </div>
              );
            }
            if (key === "status") {
              return <StatusBadge value={user.status} />;
            }
            if (key === "joined") {
              return <DateText value={user.created_at} />;
            }
            return (
              <select
                aria-label={`Update status for ${user.full_name}`}
                value={user.status}
                disabled={updatingId === user.id}
                onChange={(event) => void updateStatus(user, event.target.value as UserStatus)}
                className={`${inputClass} min-w-[9rem]`}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }}
          renderCard={(user) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-medium text-cream">{user.full_name}</p>
                  <p className="mt-1 font-sans text-[10px] text-cream/40">{user.id}</p>
                </div>
                <StatusBadge value={user.status} />
              </div>
              <div className="mt-4 grid gap-3 font-sans text-xs">
                <p className="text-cream/75">{user.email}</p>
                <p className="text-cream/55">{user.phone}</p>
                <p className="text-cream/55">Joined <DateText value={user.created_at} /></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {user.roles.length ? user.roles.map((role) => <StatusBadge key={role} value={role} />) : <span className="font-sans text-xs text-cream/40">No roles</span>}
              </div>
              <label className="mt-4 block">
                <span className={labelClass}>Update status</span>
                <select
                  value={user.status}
                  disabled={updatingId === user.id}
                  onChange={(event) => void updateStatus(user, event.target.value as UserStatus)}
                  className={`${inputClass} mt-2`}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        />
      </AdminPanel>
    </div>
  );
}
