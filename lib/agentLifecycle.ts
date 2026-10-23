export type CoverageStage = "pipeline" | "onboarding" | "active" | "closed";

export function coverageStage(kind: "auto" | "build", status?: string): CoverageStage {
  const value = String(status || "").trim().toLowerCase();
  if (kind === "auto" && ["won", "active", "customer"].includes(value)) return "active";
  if (kind === "build" && ["active", "won", "customer"].includes(value)) return "active";
  if (value === "onboarding") return "onboarding";
  if (["archived", "lost", "rejected", "do not contact", "inactive", "canceled"].includes(value)) return "closed";
  return "pipeline";
}

export function sameContact(a: { email?: string; phone?: string }, b: { email?: string; phone?: string }) {
  const emailA = String(a.email || "").trim().toLowerCase();
  const emailB = String(b.email || "").trim().toLowerCase();
  if (emailA && emailB) return emailA === emailB;
  const phoneA = String(a.phone || "").replace(/\D/g, "");
  const phoneB = String(b.phone || "").replace(/\D/g, "");
  return Boolean(phoneA && phoneB && phoneA === phoneB);
}
