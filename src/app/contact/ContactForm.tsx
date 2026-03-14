"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || "General Inquiry",
          message: message.trim(),
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="bg-deep-stage border border-go-green/20 p-6 text-center">
        <div className="text-go-green font-heading font-bold text-sm tracking-wider uppercase mb-2">
          Message Sent
        </div>
        <p className="text-xs text-aluminum/60">
          We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-[11px] text-signal-orange hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-deep-stage border border-ink/[0.1] text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
        />
      </div>
      <div>
        <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-deep-stage border border-ink/[0.1] text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
        />
      </div>
      <div>
        <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="General Inquiry"
          className="w-full px-3 py-2 bg-deep-stage border border-ink/[0.1] text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30"
        />
      </div>
      <div>
        <label className="block text-[10px] font-heading tracking-[2px] uppercase text-aluminum/50 mb-1.5">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full px-3 py-2 bg-deep-stage border border-ink/[0.1] text-sm text-house-lights placeholder:text-aluminum/40 focus:outline-none focus:border-signal-orange/30 resize-y"
        />
      </div>
      {status === "error" && (
        <p className="text-xs text-red-400">Something went wrong. Try emailing us directly.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-2.5 bg-signal-orange text-white font-heading font-bold text-[11px] tracking-[2px] uppercase hover:bg-signal-orange/90 transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
