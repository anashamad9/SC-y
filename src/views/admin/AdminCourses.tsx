import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListCourses } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/runtime";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400", intermediate: "text-yellow-400", advanced: "text-red-400",
};
const CATEGORY_COLORS = [
  "from-blue-600 to-blue-800","from-purple-600 to-purple-800","from-orange-600 to-orange-800",
  "from-teal-600 to-teal-800","from-primary to-red-900","from-green-600 to-green-800",
];
const CATEGORIES = ["password_security","social_engineering","email_security","phishing","deepfake_awareness",
  "data_protection","device_security","incident_response","compliance","network_security"];
const DIFFICULTIES = ["beginner","intermediate","advanced"] as const;

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

interface CourseForm {
  title: string; category: string; description: string; difficulty: string;
  videoUrl: string; minScore: number | ""; maxScore: number | "";
  durationMinutes: number; xpReward: number; lessonCount: number; thumbnailColor: string;
}
const DEFAULT_FORM: CourseForm = {
  title: "", category: "email_security", description: "", difficulty: "intermediate",
  videoUrl: "", minScore: "", maxScore: "",
  durationMinutes: 30, xpReward: 120, lessonCount: 4, thumbnailColor: "#dc143c",
};

export default function AdminCourses() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseForm>(DEFAULT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useListCourses({});

  const createCourse = useMutation({
    mutationFn: (data: CourseForm) => apiFetch("/api/courses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created!" });
      closeModal();
    },
    onError: () => toast({ title: "Failed to create course", variant: "destructive" }),
  });

  const updateCourse = useMutation({
    mutationFn: (data: CourseForm & { id: number }) => apiFetch(`/api/courses/${data.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course updated!" });
      closeModal();
    },
    onError: () => toast({ title: "Failed to update course", variant: "destructive" }),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted" });
      setConfirmDelete(null);
    },
    onError: () => toast({ title: "Failed to delete course", variant: "destructive" }),
  });

  function openCreate() { setForm(DEFAULT_FORM); setEditingId(null); setVideoMessage(null); setShowModal(true); }
  function openEdit(c: any) {
    setForm({
      title: c.title, category: c.category, description: c.description ?? "",
      difficulty: c.difficulty, durationMinutes: c.durationMinutes, xpReward: c.xpReward,
      videoUrl: c.videoUrl ?? "", minScore: c.minScore ?? "", maxScore: c.maxScore ?? "",
      lessonCount: c.lessonCount ?? 0, thumbnailColor: c.thumbnailColor ?? "#dc143c",
    });
    setEditingId(c.id);
    setVideoMessage(null);
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditingId(null); setVideoMessage(null); setForm(DEFAULT_FORM); }

  function handleVideoFile(file?: File) {
    setVideoMessage(null);
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setVideoMessage("Choose an MP4, WebM, or Ogg video file.");
      return;
    }
    if (file.size > 3.5 * 1024 * 1024) {
      setVideoMessage("Uploaded videos must be 3.5MB or smaller. Use a hosted video URL for larger files.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, videoUrl: String(reader.result ?? "") }));
      setVideoMessage("Video uploaded into the course. Save the course to apply it.");
    };
    reader.onerror = () => setVideoMessage("Could not read video file.");
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    if (editingId) updateCourse.mutate({ ...form, id: editingId });
    else createCourse.mutate(form);
  }

  const isPending = createCourse.isPending || updateCourse.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Training Video Library</h2>
          <p className="text-sm text-muted-foreground">{courses?.length ?? 0} videos with categories, score ranges, and recommendations</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Training Video</Button>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-card/90 border border-primary/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-sm font-semibold mb-4">{editingId ? "Edit Training Video" : "Add Training Video"}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Video Name *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Password Security Mastery" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Difficulty</label>
                <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration (minutes)</label>
                <Input type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))} className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">XP Reward</label>
                <Input type="number" value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: +e.target.value }))} className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Assessment Points</label>
                <Input type="number" min={8} max={32} value={form.minScore} onChange={e => setForm(f => ({ ...f, minScore: e.target.value === "" ? "" : +e.target.value }))} placeholder="8" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Assessment Points</label>
                <Input type="number" min={8} max={32} value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value === "" ? "" : +e.target.value }))} placeholder="32" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Lesson Count</label>
                <Input type="number" value={form.lessonCount} onChange={e => setForm(f => ({ ...f, lessonCount: +e.target.value }))} className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Thumbnail Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.thumbnailColor} onChange={e => setForm(f => ({ ...f, thumbnailColor: e.target.value }))} className="h-9 w-16 rounded border border-border bg-muted/30 cursor-pointer" />
                  <span className="text-xs text-muted-foreground">{form.thumbnailColor}</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Video Source</label>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-2">
                  <Input value={form.videoUrl} onChange={e => { setForm(f => ({ ...f, videoUrl: e.target.value })); setVideoMessage(null); }} placeholder="Paste a YouTube, Vimeo, MP4, WebM, or hosted video URL" className="bg-muted/30" />
                  <Input type="file" accept="video/mp4,video/webm,video/ogg" onChange={e => handleVideoFile(e.target.files?.[0])} className="bg-muted/30" />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Hosted URLs are recommended. Small uploads up to 3.5MB are stored directly in the existing video field.
                </div>
                {videoMessage && <div className="mt-1 text-xs text-muted-foreground">{videoMessage}</div>}
                {form.videoUrl && (
                  <div className="mt-3 rounded-lg border border-border bg-background p-2">
                    <video src={form.videoUrl} controls className="max-h-44 w-full rounded-md bg-black" />
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">Video Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Describe what this training video teaches..."
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleSubmit} disabled={!form.title.trim() || isPending}>
                {isPending ? "Saving..." : editingId ? "Update Video" : "Create Video"}
              </Button>
              <Button size="sm" variant="ghost" onClick={closeModal}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-red-400">Delete this training video? This action cannot be undone.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => deleteCourse.mutate(confirmDelete)} disabled={deleteCourse.isPending}>
                {deleteCourse.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses?.map((course, i) => {
            const c = course as any;
            return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-card/80 border border-border rounded-xl overflow-hidden backdrop-blur-sm group">
              <div className={`h-2 bg-gradient-to-r ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                style={{ background: `linear-gradient(to right, ${c.thumbnailColor}, ${c.thumbnailColor}99)` }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-semibold text-sm leading-tight">{c.title}</div>
                  <span className={`text-xs shrink-0 ${DIFFICULTY_COLORS[c.difficulty] ?? "text-muted-foreground"}`}>{c.difficulty}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-3 line-clamp-2">{c.description}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{c.category?.replace(/_/g, " ")}</span>
                  <span>{c.durationMinutes}m</span>
                  <span className="text-primary">+{c.xpReward} XP</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Points: {c.minScore ?? 8} - {c.maxScore ?? 32}{c.videoUrl ? " · Video linked" : ""}
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.lessonCount} lessons</span>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors">Edit</button>
                    <button onClick={() => { setConfirmDelete(c.id); setShowModal(false); }}
                      className="text-muted-foreground hover:text-red-400 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
