// ── Shared Markdown-lite renderer ──
// Supports: headings (##), bold (**), italic (*), links [text](url),
// bullet lists (- ), numbered lists (1. ), code blocks (```), inline code (`),
// horizontal rules (---), optional wiki gear links ([[Gear Name]])

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function inlineFormat(text: string, options?: { wikiLinks?: boolean }): string {
  let s = escapeHtml(text);
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-ink/[0.05] rounded text-xs font-mono text-signal-orange/80">$1</code>');
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Links — block javascript: URLs
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    if (!/^https?:\/\//i.test(url)) return label;
    return `<a href="${url}" class="text-signal-orange hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  // Gear links [[Gear Name]] — wiki only
  if (options?.wikiLinks) {
    s = s.replace(/\[\[([^\]]+)\]\]/g, (_match, name) => {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      return `<a href="/wiki/${slug}" class="text-signal-orange hover:underline">${escapeHtml(name)}</a>`;
    });
  }
  return s;
}

export function renderMarkdown(md: string, options?: { wikiLinks?: boolean }): string {
  if (!md) return "";
  const lines = md.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inList: "ul" | "ol" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
      } else {
        if (inList) { html.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
        html.push('<pre class="bg-blackout border border-white/10 rounded-lg p-4 my-3 overflow-x-auto"><code class="text-xs font-mono text-house-lights/80">');
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      html.push(escapeHtml(line) + "\n");
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) { html.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      html.push('<hr class="border-ink/[0.06] my-4" />');
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{2,4})\s+(.*)/);
    if (headingMatch) {
      if (inList) { html.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      const level = headingMatch[1].length;
      const text = inlineFormat(headingMatch[2], options);
      const sizes: Record<number, string> = { 2: "text-lg font-bold mt-6 mb-2", 3: "text-base font-bold mt-4 mb-2", 4: "text-sm font-bold mt-3 mb-1" };
      html.push(`<h${level} class="font-heading ${sizes[level] || sizes[4]} text-house-lights">${text}</h${level}>`);
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(line)) {
      if (inList !== "ul") {
        if (inList) html.push("</ol>");
        html.push('<ul class="list-disc list-inside space-y-1 my-2 text-sm text-house-lights/80">');
        inList = "ul";
      }
      html.push(`<li>${inlineFormat(line.replace(/^[-*]\s+/, ""), options)}</li>`);
      continue;
    }

    // Numbered list
    const olMatch = line.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      if (inList !== "ol") {
        if (inList) html.push("</ul>");
        html.push('<ol class="list-decimal list-inside space-y-1 my-2 text-sm text-house-lights/80">');
        inList = "ol";
      }
      html.push(`<li>${inlineFormat(olMatch[1], options)}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    if (inList && line.trim()) {
      html.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }

    // Empty line
    if (!line.trim()) {
      if (inList) { html.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      html.push('<div class="h-3"></div>');
      continue;
    }

    // Paragraph
    html.push(`<p class="text-sm text-house-lights/80 leading-relaxed my-1">${inlineFormat(line, options)}</p>`);
  }

  if (inList) html.push(inList === "ul" ? "</ul>" : "</ol>");
  if (inCodeBlock) html.push("</code></pre>");

  return html.join("\n");
}

export function stripMarkdown(md: string): string {
  if (!md) return "";
  let s = md;
  // Remove code blocks
  s = s.replace(/```[\s\S]*?```/g, "");
  // Remove headings markers
  s = s.replace(/^#{1,4}\s+/gm, "");
  // Remove bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  // Remove italic
  s = s.replace(/\*([^*]+)\*/g, "$1");
  // Remove links, keep text
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove inline code backticks
  s = s.replace(/`([^`]+)`/g, "$1");
  // Remove horizontal rules
  s = s.replace(/^---+$/gm, "");
  // Remove list markers
  s = s.replace(/^[-*]\s+/gm, "");
  s = s.replace(/^\d+\.\s+/gm, "");
  // Collapse whitespace
  s = s.replace(/\n{2,}/g, " ").replace(/\s+/g, " ").trim();
  return s.length > 200 ? s.slice(0, 200) + "..." : s;
}
