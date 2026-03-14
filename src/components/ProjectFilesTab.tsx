"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ─── Categories ─────────────────────────────────────────
const CATEGORIES = [
  { id: "schedule", label: "Schedule" },
  { id: "venue", label: "Venue" },
  { id: "show", label: "Show" },
  { id: "technical", label: "Technical" },
  { id: "logistics", label: "Logistics" },
  { id: "other", label: "Other" },
];

const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.ms-powerpoint": "PPT",
  "text/csv": "CSV",
  "text/plain": "TXT",
  "application/zip": "ZIP",
};

const MAX_FILE_SIZE = 52_428_800; // 50 MB
const MAX_FILES = 25;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.txt,.zip,.dwg";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getMimeLabel(mime: string) {
  return MIME_LABELS[mime] || mime.split("/").pop()?.toUpperCase() || "FILE";
}

// ─── Component ──────────────────────────────────────────
interface Props {
  projectId: string;
  projectName: string;
  onFileCountChange: (count: number) => void;
}

export default function ProjectFilesTab({ projectId, projectName, onFileCountChange }: Props) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("other");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const apiCall = async (body: any) => {
    const token = await getToken();
    const res = await fetch("/api/project-files", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const loadFiles = useCallback(async () => {
    const data = await apiCall({ action: "list", projectId });
    const f = data.files || [];
    setFiles(f);
    onFileCountChange(f.length);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Upload flow ───────────────────────────────────────
  const handleFilesSelected = (selected: File[]) => {
    // Filter out oversized
    const valid = selected.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        setError(`${f.name} exceeds 50 MB limit`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;
    if (files.length + valid.length > MAX_FILES) {
      setError(`Max ${MAX_FILES} files per project. ${MAX_FILES - files.length} slots remaining.`);
      return;
    }
    setError("");
    setPendingFiles(valid);
    setSelectedCategory("other");
    setShowUploadModal(true);
  };

  const uploadFiles = async () => {
    if (pendingFiles.length === 0) return;
    setShowUploadModal(false);
    setUploading(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUploading(false); return; }

    const successFiles: any[] = [];

    for (const file of pendingFiles) {
      const ext = file.name.split(".").pop() || "bin";
      const uuid = crypto.randomUUID();
      const storagePath = `${projectId}/${uuid}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file);

      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      successFiles.push({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        category: selectedCategory,
        storagePath,
      });
    }

    // Register metadata via API
    if (successFiles.length > 0) {
      const result = await apiCall({
        action: "register",
        projectId,
        files: successFiles,
      });
      if (result.error) {
        setError(result.error);
      } else {
        showToast(`${successFiles.length} file${successFiles.length !== 1 ? "s" : ""} uploaded`);
      }
    }

    setPendingFiles([]);
    setUploading(false);
    loadFiles();
  };

  // ── Download ──────────────────────────────────────────
  const handleDownload = async (fileId: string) => {
    const data = await apiCall({ action: "download", fileId });
    if (data.url) {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (fileId: string) => {
    setConfirmDeleteId(null);
    const result = await apiCall({ action: "delete", fileId });
    if (result.success) {
      showToast("File deleted");
      loadFiles();
    } else {
      setError(result.error || "Failed to delete");
    }
  };

  // ── Edit metadata ─────────────────────────────────────
  const startEdit = (file: any) => {
    setEditingId(file.id);
    setEditCategory(file.category);
    setEditNotes(file.notes || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await apiCall({ action: "update", fileId: editingId, category: editCategory, notes: editNotes });
    setEditingId(null);
    showToast("File updated");
    loadFiles();
  };

  // ── Group files by category ───────────────────────────
  const grouped: Record<string, any[]> = {};
  for (const f of files) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <span className="font-mono text-sm text-aluminum">Loading files...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="mb-4 px-4 py-2 bg-go-green/10 border border-go-green/20 rounded-lg font-mono text-xs text-go-green">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg font-mono text-xs text-red-400">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-red-400/60 hover:text-red-400">x</button>
        </div>
      )}

      {/* ── Drop Zone ──────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFilesSelected(Array.from(e.dataTransfer.files));
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all mb-6 ${
          dragActive
            ? "border-signal-orange/50 bg-signal-orange/5"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {uploading ? (
          <div className="font-mono text-sm text-signal-orange animate-pulse">Uploading...</div>
        ) : (
          <>
            <div className="font-mono text-sm text-aluminum mb-1">
              Drop files here or click to browse
            </div>
            <div className="text-[10px] text-aluminum/50 mb-3">
              PDF, images, Office docs, CAD, ZIP — 50 MB max per file — {MAX_FILES - files.length} of {MAX_FILES} slots remaining
            </div>
            <label
              htmlFor="pf-upload"
              className="inline-block px-4 py-2 bg-signal-orange/10 text-signal-orange text-xs font-mono rounded-lg border border-signal-orange/20 hover:bg-signal-orange/20 transition-all cursor-pointer"
            >
              Browse Files
            </label>
            <input
              id="pf-upload"
              type="file"
              multiple
              accept={ACCEPT}
              onChange={(e) => {
                handleFilesSelected(Array.from(e.target.files || []));
                e.target.value = "";
              }}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* ── File List ──────────────────────────────────── */}
      {files.length === 0 ? (
        <div className="text-center py-12 bg-deep-stage rounded-lg border border-dashed border-white/10">
          <div className="text-sm text-aluminum mb-1">No files yet</div>
          <p className="text-[11px] text-aluminum/50">
            Upload schedules, venue specs, input lists, and show docs so your crew arrives prepared.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.filter(cat => grouped[cat.id]?.length > 0).map(cat => (
            <div key={cat.id}>
              <h3 className="font-heading text-xs font-semibold tracking-widest uppercase text-aluminum mb-2">
                {cat.label}
              </h3>
              <div className="space-y-1">
                {grouped[cat.id].map((file: any) => (
                  <div key={file.id}>
                    {/* Edit mode */}
                    {editingId === file.id ? (
                      <div className="bg-blackout rounded-lg p-3 border border-signal-orange/15">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[10px] font-bold text-signal-orange w-10 flex-shrink-0">
                            {getMimeLabel(file.mime_type)}
                          </span>
                          <span className="text-sm font-semibold truncate">{file.file_name}</span>
                        </div>
                        <div className="mb-2">
                          <label className="block text-[9px] font-mono text-aluminum tracking-wider uppercase mb-1">Category</label>
                          <select
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            className="w-full px-2 py-1.5 bg-deep-stage border border-white/10 rounded text-xs text-house-lights outline-none"
                          >
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="block text-[9px] font-mono text-aluminum tracking-wider uppercase mb-1">Notes</label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            maxLength={200}
                            placeholder="Optional description..."
                            className="w-full px-2 py-1.5 bg-deep-stage border border-white/10 rounded text-xs text-house-lights outline-none placeholder:text-aluminum/30"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-white/10 rounded text-[10px] font-mono text-aluminum">
                            Cancel
                          </button>
                          <button onClick={saveEdit} className="px-3 py-1.5 bg-signal-orange text-white rounded text-[10px] font-heading font-semibold tracking-wider uppercase">
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal display */
                      <div className="flex items-center justify-between bg-blackout rounded-lg px-3 py-2.5 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-[10px] font-bold text-signal-orange w-10 flex-shrink-0 text-center">
                            {getMimeLabel(file.mime_type)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{file.file_name}</div>
                            <div className="text-[10px] text-aluminum">
                              {formatSize(file.file_size)} · {formatDate(file.created_at)}
                              {file.notes && <span className="ml-1 text-aluminum/60">· {file.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDownload(file.id)}
                            className="text-[10px] font-mono text-signal-orange hover:underline">
                            Download
                          </button>
                          <button onClick={() => startEdit(file)}
                            className="text-[10px] font-mono text-aluminum hover:text-house-lights transition-colors">
                            Edit
                          </button>
                          {confirmDeleteId === file.id ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => handleDelete(file.id)}
                                className="text-[10px] font-mono text-red-400">Yes</button>
                              <button onClick={() => setConfirmDeleteId(null)}
                                className="text-[10px] font-mono text-aluminum">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(file.id)}
                              className="text-[10px] font-mono text-red-400/40 hover:text-red-400 transition-colors">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="text-[10px] font-mono text-aluminum/40 text-center">
            {files.length} of {MAX_FILES} files
          </div>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-deep-stage border border-white/10 rounded-lg p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading text-lg font-bold mb-4">
              Upload {pendingFiles.length} File{pendingFiles.length !== 1 ? "s" : ""}
            </h3>

            {/* File list preview */}
            <div className="space-y-1 mb-4 max-h-40 overflow-auto">
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="truncate text-house-lights">{f.name}</span>
                  <span className="text-aluminum ml-2 flex-shrink-0">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>

            {/* Category picker */}
            <label className="block text-[10px] font-mono text-aluminum tracking-wider uppercase mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-2 rounded-lg text-xs font-mono text-center border transition-all ${
                    selectedCategory === cat.id
                      ? "border-signal-orange/30 bg-signal-orange/10 text-signal-orange"
                      : "border-white/5 text-aluminum hover:border-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowUploadModal(false); setPendingFiles([]); }}
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-xs font-mono text-aluminum"
              >
                Cancel
              </button>
              <button
                onClick={uploadFiles}
                className="flex-1 px-4 py-2.5 bg-signal-orange text-white font-heading font-semibold text-xs tracking-wider uppercase rounded-lg hover:bg-orange-600 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
