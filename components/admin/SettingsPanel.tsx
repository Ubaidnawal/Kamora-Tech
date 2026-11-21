"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  KeyValue,
  StatusBadge,
} from "./AdminPrimitives";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  noteClass,
  textareaClass,
} from "./adminStyles";
import type { SiteSetting } from "./types";
import { useAdminResource } from "./useAdminResource";

type SettingDraft = { value: string; description: string };

const sensitiveKey = /(secret|password|token|api[_-]?key|credential|private|authorization)/i;

export function SettingsPanel() {
  const { user } = useAuth();
  const settings = useAdminResource<SiteSetting[]>("/api/v1/admin/settings");
  const [drafts, setDrafts] = useState<Record<string, SettingDraft>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const draftFor = (setting: SiteSetting): SettingDraft =>
    drafts[setting.key] ?? {
      value: JSON.stringify(setting.value ?? {}, null, 2),
      description: setting.description ?? "",
    };

  const setDraft = (setting: SiteSetting, patch: Partial<SettingDraft>) => {
    setDrafts((current) => ({
      ...current,
      [setting.key]: { ...draftFor(setting), ...patch },
    }));
  };

  const saveSetting = async (setting: SiteSetting) => {
    const draft = draftFor(setting);
    let value: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(draft.value || "{}");
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Value must be a JSON object.");
      }
      value = parsed as Record<string, unknown>;
    } catch (caught) {
      setSavedKey(null);
      setActionError(caught instanceof Error ? caught.message : "Value must be valid JSON.");
      return;
    }

    setSavingKey(setting.key);
    setActionError("");
    setSavedKey(null);
    try {
      const updated = await apiFetch<SiteSetting>(`/api/v1/admin/settings/${encodeURIComponent(setting.key)}`, {
        method: "PUT",
        body: JSON.stringify({ value, description: draft.description.trim() || null }),
      });
      settings.setData((current) =>
        current ? current.map((item) => (item.key === updated.key ? updated : item)) : [updated],
      );
      setSavedKey(setting.key);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The setting could not be saved.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Administrator account" description="Session details supplied by the authenticated /auth/me profile.">
          <div className="grid gap-5">
            <KeyValue label="Full name">{user?.full_name ?? "—"}</KeyValue>
            <KeyValue label="Email">{user?.email ?? "—"}</KeyValue>
            <KeyValue label="Phone">{user?.phone ?? "—"}</KeyValue>
            <KeyValue label="Roles">
              <div className="flex flex-wrap gap-1.5">
                {(user?.roles ?? []).length ? user?.roles.map((role) => <StatusBadge key={role} value={role} />) : "—"}
              </div>
            </KeyValue>
            <KeyValue label="Account status">
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge value={user?.is_active ? "active" : "inactive"} />
                <StatusBadge value={user?.is_verified ? "verified" : "unverified"} />
              </div>
            </KeyValue>
          </div>
        </AdminPanel>

        <AdminPanel title="Session security" description="How this console authenticates requests.">
          <ul className="space-y-3 font-sans text-xs leading-relaxed text-cream/65">
            <li className="border-b border-cream/10 pb-3">Session cookies are sent with every request using credentials include.</li>
            <li className="border-b border-cream/10 pb-3">CSRF tokens are read from the csrf_token cookie and sent as X-CSRF-Token for POST, PUT, PATCH and DELETE.</li>
            <li>Account roles are checked with the authenticated user context before the console is shown.</li>
          </ul>
          <p className={`${noteClass} mt-5`}>
            Secrets, tokens and private environment values are never displayed in this panel.
          </p>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Site settings"
        description="Values are read from GET /api/v1/admin/settings and saved with PUT /api/v1/admin/settings/{key}."
      >
        {settings.loading ? (
          <AdminLoadingBlock label="Loading site settings" />
        ) : settings.error ? (
          <AdminErrorBlock message={settings.error} onRetry={settings.reload} />
        ) : !(settings.data ?? []).length ? (
          <AdminEmptyBlock title="No site settings" description="The settings endpoint returned no records." />
        ) : (
          <div className="space-y-5">
            {actionError && (
              <div role="alert" className={`${cardClass} border-burgundy/60 text-sm text-cream`}>
                {actionError}
              </div>
            )}
            {(settings.data ?? []).map((setting) => {
              const hidden = sensitiveKey.test(setting.key);
              const draft = draftFor(setting);
              return (
                <div key={setting.key} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-cream">{setting.key}</p>
                      <p className="mt-1 font-sans text-[11px] text-cream/55">
                        {setting.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={hidden ? "hidden" : "editable"} />
                      {setting.updated_at && (
                        <span className="font-sans text-[10px] text-cream/40">
                          Updated <DateText value={setting.updated_at} withTime />
                        </span>
                      )}
                    </div>
                  </div>

                  {hidden ? (
                    <p className={`${noteClass} mt-4`}>
                      Value withheld because this key is treated as sensitive. It cannot be viewed or edited here.
                    </p>
                  ) : (
                    <>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label>
                          <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/55">
                            Value (JSON object)
                          </span>
                          <textarea
                            rows={5}
                            value={draft.value}
                            onChange={(event) => setDraft(setting, { value: event.target.value })}
                            className={`${textareaClass} mt-2`}
                          />
                        </label>
                        <label>
                          <span className="block font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/55">
                            Description
                          </span>
                          <textarea
                            rows={3}
                            maxLength={500}
                            value={draft.description}
                            onChange={(event) => setDraft(setting, { description: event.target.value })}
                            className={`${textareaClass} mt-2`}
                          />
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void saveSetting(setting)}
                          disabled={savingKey === setting.key}
                          className={buttonPrimaryClass}
                        >
                          {savingKey === setting.key ? "Saving" : "Save setting"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDrafts((current) => {
                              const next = { ...current };
                              delete next[setting.key];
                              return next;
                            })
                          }
                          disabled={savingKey === setting.key}
                          className={buttonSecondaryClass}
                        >
                          Reset
                        </button>
                        {savedKey === setting.key && (
                          <span className="font-sans text-[11px] text-cream/60">Saved.</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
