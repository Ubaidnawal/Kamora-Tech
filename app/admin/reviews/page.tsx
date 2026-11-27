import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewsPanel } from "@/components/admin/ReviewsPanel";

export const metadata: Metadata = {
  title: "Admin Reviews",
  robots: { index: false, follow: false },
};

export default function AdminReviewsPage() {
  return (
    <AdminShell title="Reviews" description="Moderate customer reviews, adjust ratings and remove inappropriate content.">
      <ReviewsPanel />
    </AdminShell>
  );
}
