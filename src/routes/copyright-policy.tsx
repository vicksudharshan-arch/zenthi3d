import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/copyright-policy")({
  head: () => ({
    meta: [
      { title: "Copyright & takedown policy — Zenthi" },
      {
        name: "description",
        content:
          "How Zenthi handles copyright on community-uploaded car part files, and how to report a file you believe was shared without the right to do so.",
      },
      { property: "og:title", content: "Copyright & takedown policy — Zenthi" },
      {
        property: "og:description",
        content: "Report a copyright concern about a file hosted on Zenthi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CopyrightPolicyPage,
});

const labelCls = "tech-label block";
const fieldCls =
  "mt-2 w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

const reportSchema = z.object({
  reporter_name: z.string().trim().min(1, "Enter your name.").max(120, "Name is too long."),
  reporter_email: z.string().trim().email("Enter a valid email address.").max(255),
  part_reference: z
    .string()
    .trim()
    .min(1, "Tell us which part or file this is about.")
    .max(500, "Keep the part name or link under 500 characters."),
  concern: z
    .string()
    .trim()
    .min(20, "Please describe the concern in a little more detail.")
    .max(4000, "Please keep the description under 4000 characters."),
});

function CopyrightPolicyPage() {
  const [reporterName, setReporterName] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [concern, setConcern] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goodFaith) {
      toast.error("Please confirm your good-faith belief before submitting.");
      return;
    }
    const parsed = reportSchema.safeParse({
      reporter_name: reporterName,
      reporter_email: email,
      part_reference: reference,
      concern,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("copyright_reports").insert({
        ...parsed.data,
        good_faith: true,
        status: "open",
      });
      if (error) throw error;
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-16">
        <p className="tech-label">Policy</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          Copyright &amp; takedown policy
        </h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Zenthi is a platform for community-shared 3D-printable car part files. Every uploader
            confirms at submission that they created the file, or otherwise have the right to share
            it, and grants Zenthi a license to host and redistribute it under a Creative Commons
            Attribution license.
          </p>
          <p>
            Zenthi does not independently verify the ownership or authorship of every file. If you
            believe a file on Zenthi infringes your copyright, or was uploaded without the proper
            rights, you can report it using the form below.
          </p>
          <p>
            When we receive a valid report, we will promptly remove or disable access to the file in
            question while the matter is reviewed.
          </p>
          <p>
            Contributors who repeatedly, or clearly, upload files they have no right to share may be
            permanently removed from contributing to the platform.
          </p>
        </div>

        <section className="mt-14 rounded-sm border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Report a copyright concern
          </h2>

          {done ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Thank you — your report has been received and is queued for review. If we need more
              information we will reach out at the email address you provided.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="reporter-name" className={labelCls}>
                    Your name
                  </label>
                  <input
                    id="reporter-name"
                    required
                    maxLength={120}
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className={fieldCls}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="reporter-email" className={labelCls}>
                    Your email
                  </label>
                  <input
                    id="reporter-email"
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldCls}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="part-reference" className={labelCls}>
                  Part or file in question
                </label>
                <input
                  id="part-reference"
                  required
                  maxLength={500}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={fieldCls}
                  placeholder="Part name, or a link to the part listing"
                />
              </div>

              <div>
                <label htmlFor="concern" className={labelCls}>
                  Description of the concern
                </label>
                <textarea
                  id="concern"
                  required
                  rows={6}
                  maxLength={4000}
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  className={fieldCls}
                  placeholder="Explain what the file is, what right you hold, and why you believe it was shared without permission."
                />
              </div>

              <div className="rounded-sm border border-brass/50 bg-brass/10 p-5">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    checked={goodFaith}
                    onChange={(e) => setGoodFaith(e.target.checked)}
                    className="mt-1 size-4 shrink-0 accent-[var(--brass)]"
                  />
                  <span>
                    I have a good-faith belief that the use of this file is not authorised by the
                    copyright owner, its agent, or the law, and the information in this report is
                    accurate.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !goodFaith}
                className="h-11 rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit report"}
              </button>
            </form>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
