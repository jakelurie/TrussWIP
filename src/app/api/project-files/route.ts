import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";

// ─── Constants ──────────────────────────────────────────
const ALLOWED_CATEGORIES = ["schedule", "venue", "show", "technical", "logistics", "other"];
const MAX_FILES_PER_PROJECT = 25;
const MAX_FILE_SIZE = 52_428_800; // 50 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/csv", "text/plain",
  "application/zip",
]);
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "jpg", "jpeg", "png", "gif", "webp",
  "xlsx", "xls", "docx", "doc", "pptx", "ppt",
  "csv", "txt", "zip", "dwg",
]);

const limiter = rateLimit({ interval: 60_000, limit: 40 });

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getAuthUser(req: NextRequest): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const supaAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supaAuth.auth.getUser(token);
  return user?.id || null;
}

async function checkProjectFileAccess(userId: string, projectId: string): Promise<boolean> {
  // Producer?
  const { data: project } = await supabaseAdmin
    .from("projects").select("producer_id").eq("id", projectId).single();
  if (project?.producer_id === userId) return true;
  // Booked tech?
  const { data: booking } = await supabaseAdmin
    .from("bookings").select("id")
    .eq("project_id", projectId).eq("tech_id", userId)
    .in("status", ["accepted", "confirmed", "paid", "completed"])
    .limit(1).maybeSingle();
  return !!booking;
}

// ─── POST /api/project-files ────────────────────────────
export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  const userId = await getAuthUser(req);
  if (!userId) return err("Unauthorized", 401);

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "register": return handleRegister(userId, body);
    case "list":     return handleList(userId, body);
    case "download": return handleDownload(userId, body);
    case "delete":   return handleDelete(userId, body);
    case "update":   return handleUpdate(userId, body);
    default:         return err("Unknown action");
  }
}

// ─── Register file metadata after client uploads to storage ──
async function handleRegister(userId: string, body: any) {
  const { projectId, files } = body;
  if (!projectId || !Array.isArray(files) || files.length === 0) {
    return err("projectId and files[] required");
  }

  // Verify producer owns project
  const { data: project } = await supabaseAdmin
    .from("projects").select("id, name, producer_id")
    .eq("id", projectId).single();
  if (!project || project.producer_id !== userId) return err("Not your project", 403);

  // Enforce file count limit
  const { count } = await supabaseAdmin
    .from("project_files").select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count || 0) + files.length > MAX_FILES_PER_PROJECT) {
    return err(`Max ${MAX_FILES_PER_PROJECT} files per project. ${MAX_FILES_PER_PROJECT - (count || 0)} slots remaining.`);
  }

  // Validate each file
  for (const f of files) {
    if (!f.fileName || !f.fileSize || !f.mimeType || !f.storagePath) {
      return err("Missing file data");
    }
    if (f.fileSize > MAX_FILE_SIZE) return err("File too large (50 MB max)");
    if (!ALLOWED_MIME_TYPES.has(f.mimeType)) return err(`File type not allowed: ${f.mimeType}`);
    // Validate file extension matches an allowed type (don't trust MIME alone)
    const ext = f.fileName.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) return err(`File extension not allowed: .${ext}`);
    if (f.category && !ALLOWED_CATEGORIES.includes(f.category)) return err("Invalid category");

    // Prevent path traversal — storagePath must start with this project's folder
    const expectedPrefix = `${projectId}/`;
    if (
      typeof f.storagePath !== "string" ||
      !f.storagePath.startsWith(expectedPrefix) ||
      f.storagePath.includes("..") ||
      f.storagePath.split("/").length !== 2
    ) {
      return err("Invalid storage path");
    }
  }

  // Insert records
  const records = files.map((f: any) => ({
    project_id: projectId,
    uploaded_by: userId,
    file_name: f.fileName.slice(0, 255),
    file_size: f.fileSize,
    mime_type: f.mimeType,
    category: f.category || "other",
    storage_path: f.storagePath,
    notes: f.notes ? f.notes.slice(0, 200) : null,
  }));

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("project_files").insert(records).select("id");
  if (insertError) return err(insertError.message, 500);

  // Notify booked techs (async, don't block response)
  notifyProjectFiles(projectId, project.name, userId, files.length).catch(() => {});

  return NextResponse.json({ ids: inserted?.map((r: any) => r.id) || [] });
}

// ─── List files for a project ────────────────────────────
async function handleList(userId: string, body: any) {
  const { projectId } = body;
  if (!projectId) return err("projectId required");

  const hasAccess = await checkProjectFileAccess(userId, projectId);
  if (!hasAccess) return err("Access denied", 403);

  const { data: files } = await supabaseAdmin
    .from("project_files").select("*")
    .eq("project_id", projectId)
    .order("category").order("created_at", { ascending: false });

  return NextResponse.json({ files: files || [] });
}

// ─── Generate signed download URL ────────────────────────
async function handleDownload(userId: string, body: any) {
  const { fileId } = body;
  if (!fileId) return err("fileId required");

  const { data: file } = await supabaseAdmin
    .from("project_files").select("*")
    .eq("id", fileId).single();
  if (!file) return err("File not found", 404);

  const hasAccess = await checkProjectFileAccess(userId, file.project_id);
  if (!hasAccess) return err("Access denied", 403);

  const { data, error } = await supabaseAdmin.storage
    .from("project-files")
    .createSignedUrl(file.storage_path, 3600);
  if (error || !data) return err("Could not generate download URL", 500);

  return NextResponse.json({ url: data.signedUrl, fileName: file.file_name });
}

// ─── Delete file (producer only) ─────────────────────────
async function handleDelete(userId: string, body: any) {
  const { fileId } = body;
  if (!fileId) return err("fileId required");

  const { data: file } = await supabaseAdmin
    .from("project_files").select("*, projects(producer_id)")
    .eq("id", fileId).single();
  if (!file) return err("File not found", 404);
  if ((file as any).projects?.producer_id !== userId) return err("Not your file", 403);

  // Delete from storage then DB
  await supabaseAdmin.storage.from("project-files").remove([file.storage_path]);
  await supabaseAdmin.from("project_files").delete().eq("id", fileId);

  return NextResponse.json({ success: true });
}

// ─── Update file metadata (producer only) ────────────────
async function handleUpdate(userId: string, body: any) {
  const { fileId, category, notes } = body;
  if (!fileId) return err("fileId required");

  const { data: file } = await supabaseAdmin
    .from("project_files").select("*, projects(producer_id)")
    .eq("id", fileId).single();
  if (!file) return err("File not found", 404);
  if ((file as any).projects?.producer_id !== userId) return err("Not your file", 403);

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (category && ALLOWED_CATEGORIES.includes(category)) updates.category = category;
  if (notes !== undefined) updates.notes = notes ? notes.slice(0, 200) : null;

  await supabaseAdmin.from("project_files").update(updates).eq("id", fileId);
  return NextResponse.json({ success: true });
}

// ─── Notification helper ─────────────────────────────────
async function notifyProjectFiles(
  projectId: string,
  projectName: string,
  producerId: string,
  fileCount: number
) {
  // Get producer name
  const { data: producer } = await supabaseAdmin
    .from("profiles").select("display_name").eq("id", producerId).single();
  const producerName = producer?.display_name || "Producer";

  // Get all booked techs (deduplicated)
  const { data: bookings } = await supabaseAdmin
    .from("bookings").select("tech_id")
    .eq("project_id", projectId)
    .in("status", ["accepted", "confirmed", "paid", "completed"]);
  if (!bookings?.length) return;

  const techIds = [...new Set(bookings.map(b => b.tech_id))];
  const fileWord = fileCount === 1 ? "file" : "files";
  const message = `${producerName} uploaded ${fileCount} ${fileWord} to ${projectName}`;

  for (const techId of techIds) {
    // In-app notification
    await supabaseAdmin.from("notifications").insert({
      user_id: techId,
      type: "project_files",
      title: "New Project Files",
      message,
      link: "/bookings",
    });

    // Email (check preference — maps to booking_updates_email)
    try {
      const { data: prefs } = await supabaseAdmin
        .from("notification_preferences")
        .select("booking_updates_email")
        .eq("user_id", techId).single();
      if (prefs && prefs.booking_updates_email === false) continue;

      const { data: tech } = await supabaseAdmin
        .from("profiles").select("email, display_name").eq("id", techId).single();
      if (!tech?.email) continue;

      const { sendProjectFilesEmail } = await import("@/lib/email");
      await sendProjectFilesEmail(
        tech.email, tech.display_name || "Tech",
        producerName, projectName, fileCount
      );
    } catch {
      // Don't fail on email errors
    }
  }
}
