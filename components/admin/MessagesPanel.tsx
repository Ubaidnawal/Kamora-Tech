"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  StatusBadge,
} from "./AdminPrimitives";
import { buttonPrimaryClass, cardClass, inputClass, labelClass, noteClass, textareaClass } from "./adminStyles";
import type { CustomerMessage, MessageStatus } from "./types";
import { useAdminResource } from "./useAdminResource";

const statusOptions: MessageStatus[] = ["open", "answered", "closed"];

export function MessagesPanel() {
  const { data, setData, loading, error, reload } = useAdminResource<CustomerMessage[]>("/api/v1/admin/messages?limit=200");
  const [statusFilter, setStatusFilter] = useState<"all" | MessageStatus>("all");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, MessageStatus>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const messages = useMemo(() => {
    const list = data ?? [];
    if (statusFilter === "all") return list;
    return list.filter((message) => message.status === statusFilter);
  }, [data, statusFilter]);

  const replyToMessage = async (message: CustomerMessage) => {
    const reply = (replies[message.id] ?? "").trim();
    if (!reply) {
      setActionError("Enter a reply before submitting.");
      return;
    }

    const status = statuses[message.id] ?? (message.status === "open" ? "answered" : message.status);
    setBusyId(message.id);
    setActionError("");
    setActionMessage("");

    try {
      const updated = await apiFetch<CustomerMessage>(`/api/v1/admin/messages/${message.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply, status }),
      });
      setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? [updated]);
      setReplies((current) => ({ ...current, [message.id]: "" }));
      setActionMessage("Reply saved.");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The reply could not be saved.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <AdminLoadingBlock label="Loading messages" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {actionError && (
        <div role="alert" className={`${cardClass} border-[#B00020]/60 text-sm text-[#000000]`}>
          {actionError}
        </div>
      )}
      {actionMessage && <div className={`${cardClass} text-sm text-[#000000]`}>{actionMessage}</div>}

      <AdminPanel title="Inbox filter" description="Messages returned by the admin messages endpoint.">
        <label className="block max-w-xs">
          <span className={labelClass}>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | MessageStatus)}
            className={`${inputClass} mt-2`}
          >
            <option value="all">All messages</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </AdminPanel>

      <AdminPanel title="Customer messages" description={`${messages.length.toString().padStart(2, "0")} messages shown.`}>
        {messages.length === 0 ? (
          <AdminEmptyBlock title="No messages found" description="Adjust the status filter or reload the inbox." />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <article key={message.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-[#B00020]">{message.subject}</p>
                    <p className="mt-2 font-sans text-sm font-medium text-[#000000]">
                      {message.user_name ?? "Unknown sender"} <span className="text-[#000000]/45">· {message.user_email ?? "No email"}</span>
                    </p>
                    <p className="mt-1 font-sans text-[10px] text-[#000000]/40"><DateText value={message.created_at} withTime /></p>
                  </div>
                  <StatusBadge value={message.status} />
                </div>

                <p className="mt-4 whitespace-pre-line font-sans text-sm leading-relaxed text-[#000000]/75">{message.message}</p>

                {message.admin_reply && (
                  <div className="mt-4 border-l border-[#B00020] pl-4">
                    <p className={labelClass}>Existing reply</p>
                    <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-[#000000]/65">{message.admin_reply}</p>
                  </div>
                )}

                <div className="mt-5 grid gap-4 border-t border-[#E2E2E2]/10 pt-5 sm:grid-cols-[1fr_auto]">
                  <label>
                    <span className={labelClass}>Reply</span>
                    <textarea
                      rows={4}
                      value={replies[message.id] ?? ""}
                      onChange={(event) => setReplies((current) => ({ ...current, [message.id]: event.target.value }))}
                      placeholder="Write a reply to this message"
                      className={`${textareaClass} mt-2`}
                    />
                  </label>
                  <div className="flex flex-col gap-4">
                    <label>
                      <span className={labelClass}>Status</span>
                      <select
                        value={statuses[message.id] ?? message.status}
                        onChange={(event) =>
                          setStatuses((current) => ({ ...current, [message.id]: event.target.value as MessageStatus }))
                        }
                        className={`${inputClass} mt-2`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => void replyToMessage(message)}
                      disabled={busyId === message.id}
                      className={buttonPrimaryClass}
                    >
                      {busyId === message.id ? "Sending" : "Send reply"}
                    </button>
                  </div>
                </div>
                {message.order_id && <p className={`${noteClass} mt-3`}>Related order: {message.order_id}</p>}
              </article>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
