"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const interestOptions = ["Exploring", "Spring pilot", "Department-wide", "Institution-wide"] as const;

export function PilotRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }

    setSubmitted(true);
    form.reset();
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-forest/25 bg-forest/8 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-forest" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-ink">Request recorded (demo UI only)</p>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          This form does not send email yet. Share your interest with the LearnGuard team directly for pilot scheduling.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="focus-ring mt-4 text-sm font-semibold text-forest hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-coral/25 bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pilot-name" className="text-sm font-semibold text-ink">
            Name
          </label>
          <input
            id="pilot-name"
            name="name"
            required
            className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            placeholder="Dr. Maya Reynolds"
          />
        </div>
        <div>
          <label htmlFor="pilot-email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="pilot-email"
            name="email"
            type="email"
            required
            className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            placeholder="maya@university.edu"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pilot-school" className="text-sm font-semibold text-ink">
            School
          </label>
          <input
            id="pilot-school"
            name="school"
            className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            placeholder="Northstar University"
          />
        </div>
        <div>
          <label htmlFor="pilot-course" className="text-sm font-semibold text-ink">
            Course
          </label>
          <input
            id="pilot-course"
            name="course"
            className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
            placeholder="CS 101 — Intro to Programming"
          />
        </div>
      </div>

      <div>
        <label htmlFor="pilot-interest" className="text-sm font-semibold text-ink">
          Interest level
        </label>
        <select
          id="pilot-interest"
          name="interest"
          defaultValue="Exploring"
          className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
        >
          {interestOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="pilot-notes" className="text-sm font-semibold text-ink">
          Notes
        </label>
        <textarea
          id="pilot-notes"
          name="notes"
          rows={4}
          className="focus-ring mt-2 w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
          placeholder="Tell us about your Canvas setup, class size, and what you want to learn from a pilot."
        />
      </div>

      <button
        type="submit"
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-white shadow-soft hover:bg-forest/92 sm:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Submit pilot interest
      </button>
      <p className="text-xs text-ink/50">UI only — no email or CRM integration in this MVP.</p>
    </form>
  );
}
