"use client";

import { useState } from "react";
import {
  CONFIRM_SIGNUP_TEMPLATE,
  RESET_PASSWORD_TEMPLATE,
  MAGIC_LINK_TEMPLATE,
  INVITE_USER_TEMPLATE,
  CHANGE_EMAIL_TEMPLATE,
  REAUTHENTICATION_TEMPLATE,
  PASSWORD_CHANGED_TEMPLATE,
  EMAIL_CHANGED_TEMPLATE,
  PHONE_CHANGED_TEMPLATE,
  IDENTITY_LINKED_TEMPLATE,
  IDENTITY_UNLINKED_TEMPLATE,
  MFA_ENROLLED_TEMPLATE,
  MFA_UNENROLLED_TEMPLATE,
} from "@/lib/email";

const AUTH_TEMPLATES = [
  {
    name: "Confirm Signup",
    key: "confirm",
    html: CONFIRM_SIGNUP_TEMPLATE,
    supabasePath: "Authentication > Email Templates > Confirm signup",
  },
  {
    name: "Reset Password",
    key: "reset",
    html: RESET_PASSWORD_TEMPLATE,
    supabasePath: "Authentication > Email Templates > Reset password",
  },
  {
    name: "Magic Link",
    key: "magic",
    html: MAGIC_LINK_TEMPLATE,
    supabasePath: "Authentication > Email Templates > Magic link",
  },
  {
    name: "Invite User",
    key: "invite",
    html: INVITE_USER_TEMPLATE,
    supabasePath: "Authentication > Email Templates > Invite user",
  },
  {
    name: "Change Email Address",
    key: "change-email",
    html: CHANGE_EMAIL_TEMPLATE,
    supabasePath: "Authentication > Email Templates > Change email address",
  },
  {
    name: "Reauthentication",
    key: "reauth",
    html: REAUTHENTICATION_TEMPLATE,
    supabasePath: "Authentication > Email Templates > Reauthentication",
  },
];

const SECURITY_TEMPLATES = [
  {
    name: "Password Changed",
    key: "password-changed",
    html: PASSWORD_CHANGED_TEMPLATE,
    supabasePath: "Auth > Notifications > Password changed",
  },
  {
    name: "Email Address Changed",
    key: "email-changed",
    html: EMAIL_CHANGED_TEMPLATE,
    supabasePath: "Auth > Notifications > Email changed",
  },
  {
    name: "Phone Number Changed",
    key: "phone-changed",
    html: PHONE_CHANGED_TEMPLATE,
    supabasePath: "Auth > Notifications > Phone changed",
  },
  {
    name: "Identity Linked",
    key: "identity-linked",
    html: IDENTITY_LINKED_TEMPLATE,
    supabasePath: "Auth > Notifications > Identity linked",
  },
  {
    name: "Identity Unlinked",
    key: "identity-unlinked",
    html: IDENTITY_UNLINKED_TEMPLATE,
    supabasePath: "Auth > Notifications > Identity unlinked",
  },
  {
    name: "MFA Method Added",
    key: "mfa-enrolled",
    html: MFA_ENROLLED_TEMPLATE,
    supabasePath: "Auth > Notifications > MFA factor enrolled",
  },
  {
    name: "MFA Method Removed",
    key: "mfa-unenrolled",
    html: MFA_UNENROLLED_TEMPLATE,
    supabasePath: "Auth > Notifications > MFA factor unenrolled",
  },
];

function TemplateCard({
  t,
  copied,
  onCopy,
}: {
  t: { name: string; key: string; html: string; supabasePath: string };
  copied: string | null;
  onCopy: (key: string, html: string) => void;
}) {
  return (
    <div className="bg-deep-stage border border-white/5 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div>
          <span className="font-heading text-sm font-bold text-house-lights">
            {t.name}
          </span>
          <span className="ml-3 text-[10px] font-mono text-aluminum/40">
            {t.supabasePath}
          </span>
        </div>
        <button
          onClick={() => onCopy(t.key, t.html)}
          className={`px-4 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-lg transition-all ${
            copied === t.key
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-signal-orange/10 text-signal-orange border border-signal-orange/20 hover:bg-signal-orange/20"
          }`}
        >
          {copied === t.key ? "Copied" : "Copy HTML"}
        </button>
      </div>
      <div className="p-4">
        <iframe
          srcDoc={t.html}
          className="w-full h-[480px] rounded-lg border border-white/[0.04]"
          sandbox=""
        />
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyHtml = (key: string, html: string) => {
    navigator.clipboard.writeText(html);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="font-heading text-xl font-bold tracking-tight mb-1">
        Email Templates
      </h1>
      <p className="text-xs font-mono text-aluminum/50 mb-8">
        Copy each template and paste into Supabase Dashboard. Auth templates use
        Go variables ({"{{ .ConfirmationURL }}"}) that Supabase replaces at send
        time.
      </p>

      <h2 className="font-heading text-base font-bold text-house-lights mb-4 border-b border-white/5 pb-2">
        Authentication Templates
      </h2>
      <div className="space-y-8 mb-12">
        {AUTH_TEMPLATES.map((t) => (
          <TemplateCard key={t.key} t={t} copied={copied} onCopy={copyHtml} />
        ))}
      </div>

      <h2 className="font-heading text-base font-bold text-house-lights mb-2 border-b border-white/5 pb-2">
        Security Notification Templates
      </h2>
      <p className="text-xs font-mono text-aluminum/50 mb-4">
        These must be enabled in Supabase Dashboard under Auth {">"} Notifications
        before they will send.
      </p>
      <div className="space-y-8">
        {SECURITY_TEMPLATES.map((t) => (
          <TemplateCard key={t.key} t={t} copied={copied} onCopy={copyHtml} />
        ))}
      </div>
    </div>
  );
}
