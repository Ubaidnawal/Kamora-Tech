import type { ReactNode } from "react";
import { buttonSecondaryClass, cardClass, panelClass, panelHeaderClass, tdClass, thClass, tableClass } from "./adminStyles";

type AdminPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPanel({ title, description, action, children, className = "" }: AdminPanelProps) {
  return (
    <section className={`${panelClass} ${className}`}>
      <div className={panelHeaderClass}>
        <div className="min-w-0">
          <h2 className="font-title text-lg font-medium uppercase tracking-wide text-cream">{title}</h2>
          {description && <p className="mt-1 font-sans text-[11px] leading-relaxed text-cream/50">{description}</p>}
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
};

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <div className={`${panelClass} p-5`}>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/50">{label}</p>
      <div className="mt-3 font-condense text-3xl tracking-wide text-cream">{value}</div>
      {note && <p className="mt-2 font-sans text-[11px] leading-relaxed text-cream/45">{note}</p>}
    </div>
  );
}

export function AdminLoadingBlock({ label = "Loading data" }: { label?: string }) {
  return (
    <div className={`${cardClass} py-12 text-center`}>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-burgundy">{label}</p>
      <p className="mt-2 font-sans text-xs text-cream/50">Waiting for the admin API response.</p>
    </div>
  );
}

export function AdminErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className={`${cardClass} border-burgundy/60 bg-burgundy/[0.06]`}>
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-burgundy">Request failed</p>
      <p className="mt-2 font-sans text-sm text-cream">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${buttonSecondaryClass} mt-4`}>
          Retry
        </button>
      )}
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
      <h3 className="font-title text-xl font-medium uppercase tracking-wide text-cream">{title}</h3>
      <p className="mx-auto mt-3 max-w-md font-sans text-xs leading-relaxed text-cream/55">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const text = value ?? "unknown";
  const strong = ["active", "paid", "completed", "answered"].includes(text);
  const muted = ["cancelled", "suspended", "refunded", "archived", "deleted"].includes(text);
  const style = strong
    ? "border-burgundy bg-burgundy/15 text-cream"
    : muted
      ? "border-cream/25 bg-cream/[0.03] text-cream/60"
      : "border-cream/20 bg-black text-cream/75";

  return (
    <span
      className={`inline-flex min-h-6 items-center border px-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] ${style}`}
    >
      {text.replaceAll("_", " ")}
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
    <div className="border-t border-cream/10 pt-3">
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/45">{label}</p>
      <div className="mt-1 font-sans text-sm leading-relaxed text-cream/85">{children}</div>
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
                <tr key={rowKey(row)} className="transition-colors hover:bg-cream/[0.02]">
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
