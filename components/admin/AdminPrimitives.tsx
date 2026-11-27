import type { ReactNode } from "react";
import {
  buttonSecondaryClass,
  cardClass,
  errorBannerClass,
  noteClass,
  panelClass,
  panelHeaderClass,
  tableClass,
  tdClass,
  thClass,
} from "./adminStyles";

type AdminPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function AdminPanel({ title, description, action, children, className = "", id }: AdminPanelProps) {
  return (
    <section id={id} className={`${panelClass} ${className}`}>
      <div className={panelHeaderClass}>
        <div className="min-w-0">
          <h2 className="font-title text-lg font-medium uppercase tracking-wide text-[#000000]">{title}</h2>
          {description && <p className="mt-1 font-sans text-[11px] leading-relaxed text-[#666666]">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  note?: string;
  accent?: "red" | "green" | "yellow" | "blue";
};

export function StatCard({ label, value, note, accent = "red" }: StatCardProps) {
  const accentBorder = {
    red: "border-l-[#B00020]",
    green: "border-l-[#15803D]",
    yellow: "border-l-[#CA8A04]",
    blue: "border-l-[#1D4ED8]",
  }[accent];

  return (
    <div className={`${panelClass} border-l-4 ${accentBorder} p-5 transition-shadow duration-200 hover:shadow-md`}>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#555555]">{label}</p>
      <div className="mt-3 font-condense text-3xl tracking-wide text-[#000000]">{value}</div>
      {note && <p className="mt-2 font-sans text-[11px] leading-relaxed text-[#666666]">{note}</p>}
    </div>
  );
}

export function AdminLoadingBlock({ label = "Loading data" }: { label?: string }) {
  return (
    <div className={`${cardClass} py-12 text-center`}>
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#E2E2E2] border-t-[#B00020]" aria-hidden="true" />
      <p className="mt-4 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B00020]">{label}</p>
      <p className="mt-2 font-sans text-xs text-[#666666]">Waiting for the admin API response.</p>
    </div>
  );
}

export function AdminErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className={errorBannerClass}>
      <div className="min-w-0">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]">Request failed</p>
        <p className="mt-2 font-sans text-sm">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={`${buttonSecondaryClass} mt-4`}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminEmptyBlock({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${cardClass} py-12 text-center`}>
      <h3 className="font-title text-xl font-medium uppercase tracking-wide text-[#000000]">{title}</h3>
      <p className="mx-auto mt-3 max-w-md font-sans text-xs leading-relaxed text-[#666666]">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "border-[#15803D]/40 bg-[#F0FDF4] text-[#166534]",
  warning: "border-[#CA8A04]/50 bg-[#FEFCE8] text-[#854D0E]",
  danger: "border-[#B00020]/40 bg-[#FEF2F2] text-[#B00020]",
  info: "border-[#1D4ED8]/40 bg-[#EFF6FF] text-[#1D4ED8]",
  neutral: "border-[#D4D4D4] bg-[#F5F5F5] text-[#444444]",
};

function toneFor(value: string): Tone {
  const text = value.toLowerCase();
  if (["paid", "completed", "confirmed", "approved", "answered", "active", "shipped", "delivered", "resolved", "available"].includes(text)) return "success";
  if (["pending", "awaiting_payment", "partially_paid", "under_review", "in_progress", "open", "review", "processing", "draft", "unavailable"].includes(text)) return "warning";
  if (["cancelled", "rejected", "suspended", "deleted", "refunded", "closed"].includes(text)) return "danger";
  if (["complaint", "new", "assigned", "escalated", "investigating", "customer"].includes(text)) return "info";
  return "neutral";
}

export function StatusBadge({ value, tone }: { value: string | null | undefined; tone?: Tone }) {
  const text = value ?? "unknown";
  return (
    <span
      className={`inline-flex min-h-6 items-center border px-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] ${toneClasses[tone ?? toneFor(text)]}`}
    >
      {text.replaceAll("_", " ")}
    </span>
  );
}

export function RatingBadge({ value }: { value: number | null | undefined }) {
  const rating = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(rating)) return <span className="font-sans text-xs text-[#888888]">—</span>;
  return (
    <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#000000]">
      <span aria-hidden="true" className="text-[#CA8A04]">★</span>
      {rating.toFixed(1)}
    </span>
  );
}

export function Money({ value, currency }: { value: number | null | undefined; currency?: string }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return <>—</>;

  if (!currency) {
    return <>{new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}</>;
  }

  try {
    return <>{new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value))}</>;
  } catch {
    return <>{`${Number(value).toFixed(2)} ${currency}`}</>;
  }
}

export function DateText({ value, withTime = false }: { value: string | null | undefined; withTime?: boolean }) {
  if (!value) return <>—</>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <>{value}</>;

  return (
    <>
      {date.toLocaleString(
        "en-GB",
        withTime
          ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
          : { day: "2-digit", month: "short", year: "numeric" },
      )}
    </>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-[#E5E5E5] pt-3">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666]">{label}</p>
      <div className="mt-1 font-sans text-sm leading-relaxed text-[#000000]">{children}</div>
    </div>
  );
}

type ResponsiveTableProps<T> = {
  columns: { key: string; label: string; className?: string }[];
  rows: T[];
  rowKey: (row: T) => string;
  renderCell: (row: T, key: string) => ReactNode;
  renderCard: (row: T) => ReactNode;
  empty?: ReactNode;
};

export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  renderCell,
  renderCard,
  empty = "No records found.",
}: ResponsiveTableProps<T>) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className={tableClass}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`${thClass} ${column.className ?? ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={`${tdClass} text-center`}>
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-[#FAFAFA]">
                  {columns.map((column) => (
                    <td key={column.key} className={`${tdClass} ${column.className ?? ""}`}>
                      {renderCell(row, column.key)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.length === 0 ? <div className={cardClass}>{empty}</div> : rows.map((row) => <div key={rowKey(row)}>{renderCard(row)}</div>)}
      </div>
    </>
  );
}

export function PaginationControls({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5E5] pt-4">
      <p className="font-sans text-[11px] text-[#666666]">
        Page {page} of {totalPages} · {total} records
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className={buttonSecondaryClass}>
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={buttonSecondaryClass}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function AdminBanner({ message, tone = "info", onDismiss }: { message: string; tone?: "success" | "error" | "info"; onDismiss?: () => void }) {
  if (!message) return null;
  const className = tone === "success" ? "border-[#15803D]/40 bg-[#F0FDF4] text-[#166534]" : tone === "error" ? "border-[#B00020]/40 bg-[#FEF2F2] text-[#B00020]" : "border-[#1D4ED8]/30 bg-[#EFF6FF] text-[#1D4ED8]";
  return (
    <div role="status" className={`flex items-start justify-between gap-3 border px-4 py-3 font-sans text-xs leading-relaxed ${className}`}>
      <span>{message}</span>
      {onDismiss && <button type="button" onClick={onDismiss} className="font-semibold underline underline-offset-2">Dismiss</button>}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  busy = false,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  tone?: "danger" | "primary" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const confirmClass = tone === "info" ? "border-[#1D4ED8] bg-[#1D4ED8] text-[#FFFFFF]" : tone === "primary" ? "border-[#B00020] bg-[#B00020] text-[#FFFFFF]" : "border-[#B00020] bg-[#B00020] text-[#FFFFFF]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md border border-[#E2E2E2] bg-[#FFFFFF] p-6 shadow-xl">
        <h3 id="confirm-title" className="font-title text-lg font-medium uppercase tracking-wide text-[#000000]">{title}</h3>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#555555]">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className={buttonSecondaryClass}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`inline-flex min-h-10 items-center justify-center border px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] ${confirmClass}`}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SmallNote({ children }: { children: ReactNode }) {
  return <p className={noteClass}>{children}</p>;
}
