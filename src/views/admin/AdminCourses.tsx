import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListCourses } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { CourseProfilePage } from "@/components/course-profile-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/runtime";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText, Film, Pencil, Plus, Trash2 } from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400",
  intermediate: "text-yellow-400",
  advanced: "text-red-400",
};

const CATEGORY_COLORS = [
  "from-blue-600 to-blue-800",
  "from-purple-600 to-purple-800",
  "from-orange-600 to-orange-800",
  "from-teal-600 to-teal-800",
  "from-primary to-red-900",
  "from-green-600 to-green-800",
];

const CATEGORIES = [
  "password_security",
  "social_engineering",
  "email_security",
  "phishing",
  "deepfake_awareness",
  "data_protection",
  "device_security",
  "incident_response",
  "compliance",
  "network_security",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const EDITOR_STEPS = [
  { key: "details", label: "Details", icon: BookOpen },
  { key: "assets", label: "Assets", icon: Film },
  { key: "preview", label: "Preview", icon: Eye },
] as const;
const MAX_VIDEO_SIZE_BYTES = 2_147_483_648;
const MAX_INLINE_VIDEO_BYTES = 25 * 1024 * 1024;
type EditorStep = (typeof EDITOR_STEPS)[number]["key"];

async function apiFetch(path: string, opts?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

interface CourseForm {
  title: string;
  category: string;
  description: string;
  difficulty: string;
  videoUrl: string;
  videoFileName: string;
  videoMimeType: string;
  videoSizeBytes: number | "";
  markdownUrl: string;
  markdownFileName: string;
  markdownContent: string;
  markdownSizeBytes: number | "";
  minScore: number | "";
  maxScore: number | "";
  durationMinutes: number;
  xpReward: number;
  lessonCount: number;
  thumbnailColor: string;
}

const DEFAULT_FORM: CourseForm = {
  title: "",
  category: "email_security",
  description: "",
  difficulty: "intermediate",
  videoUrl: "",
  videoFileName: "",
  videoMimeType: "",
  videoSizeBytes: "",
  markdownUrl: "",
  markdownFileName: "",
  markdownContent: "",
  markdownSizeBytes: "",
  minScore: "",
  maxScore: "",
  durationMinutes: 30,
  xpReward: 120,
  lessonCount: 4,
  thumbnailColor: "#dc143c",
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return "Not available";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function isDirectVideo(url: string) {
  return /^(data:video|blob:|https?:.*\.(mp4|webm|ogg)(\?.*)?$|\/)/i.test(url);
}

export default function AdminCourses({ canManage = false }: { canManage?: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [editorStep, setEditorStep] = useState<EditorStep>("details");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CourseForm>(DEFAULT_FORM);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);
  const [markdownMessage, setMarkdownMessage] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [previewCourseId, setPreviewCourseId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useListCourses({});

  useEffect(() => {
    return () => {
      if (videoPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const createCourse = useMutation({
    mutationFn: (data: CourseForm) =>
      apiFetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created" });
      closeModal();
    },
    onError: (error: Error) => toast({ title: error.message || "Failed to create course", variant: "destructive" }),
  });

  const updateCourse = useMutation({
    mutationFn: (data: CourseForm & { id: number }) =>
      apiFetch(`/api/courses/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course updated" });
      closeModal();
    },
    onError: (error: Error) => toast({ title: error.message || "Failed to update course", variant: "destructive" }),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/courses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted" });
      setConfirmDelete(null);
    },
    onError: (error: Error) => toast({ title: error.message || "Failed to delete course", variant: "destructive" }),
  });

  function resetPreview() {
    if (videoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
  }

  function openCreate() {
    if (!canManage) return;
    resetPreview();
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setEditorStep("details");
    setVideoMessage(null);
    setMarkdownMessage(null);
    setShowModal(true);
  }

  function openEdit(course: any) {
    if (!canManage) return;
    resetPreview();
    setEditorStep("details");
    setForm({
      title: course.title,
      category: course.category,
      description: course.description ?? "",
      difficulty: course.difficulty,
      videoUrl: course.videoUrl ?? "",
      videoFileName: course.videoFileName ?? "",
      videoMimeType: course.videoMimeType ?? "",
      videoSizeBytes: course.videoSizeBytes ?? "",
      markdownUrl: course.markdownUrl ?? "",
      markdownFileName: course.markdownFileName ?? "",
      markdownContent: course.markdownContent ?? "",
      markdownSizeBytes: course.markdownSizeBytes ?? "",
      minScore: course.minScore ?? "",
      maxScore: course.maxScore ?? "",
      durationMinutes: course.durationMinutes,
      xpReward: course.xpReward,
      lessonCount: course.lessonCount ?? 0,
      thumbnailColor: course.thumbnailColor ?? "#dc143c",
    });
    setEditingId(course.id);
    setVideoMessage(null);
    setMarkdownMessage(null);
    setShowModal(true);
  }

  function closeModal() {
    resetPreview();
    setShowModal(false);
    setEditingId(null);
    setEditorStep("details");
    setVideoMessage(null);
    setMarkdownMessage(null);
    setForm(DEFAULT_FORM);
  }

  function handleVideoFile(file?: File) {
    setVideoMessage(null);
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setVideoMessage("Choose a valid video file.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setVideoMessage("Uploaded videos must be 2GB or smaller.");
      return;
    }

    resetPreview();
    const nextPreview = URL.createObjectURL(file);
    setVideoPreviewUrl(nextPreview);
    setForm((current) => ({
      ...current,
      videoFileName: file.name,
      videoMimeType: file.type,
      videoSizeBytes: file.size,
    }));

    if (file.size <= MAX_INLINE_VIDEO_BYTES) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((current) => ({ ...current, videoUrl: String(reader.result ?? "") }));
        setVideoMessage("Video embedded directly into the course.");
      };
      reader.onerror = () => setVideoMessage("Could not read the selected video file.");
      reader.readAsDataURL(file);
      return;
    }

    setVideoMessage("Video metadata captured. Paste a hosted or public video URL so learners can play it after saving.");
  }

  function handleMarkdownFile(file?: File) {
    setMarkdownMessage(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".md")) {
      setMarkdownMessage("Only Markdown files ending in .md are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        markdownFileName: file.name,
        markdownContent: String(reader.result ?? ""),
        markdownSizeBytes: file.size,
      }));
      setMarkdownMessage("Markdown file loaded and ready to save.");
    };
    reader.onerror = () => setMarkdownMessage("Could not read the Markdown file.");
    reader.readAsText(file);
  }

  function handleSubmit() {
    if (!canManage) return;
    if (!form.title.trim()) return;
    if ((form.videoFileName || form.videoSizeBytes) && !form.videoUrl.trim()) {
      toast({
        title: "Video URL required",
        description: "Paste a hosted or public video URL so the course page can play the uploaded video.",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      updateCourse.mutate({ ...form, id: editingId });
      return;
    }
    createCourse.mutate(form);
  }

  const isPending = createCourse.isPending || updateCourse.isPending;
  const previewVideoSource = videoPreviewUrl ?? form.videoUrl;
  const editorStepIndex = EDITOR_STEPS.findIndex((step) => step.key === editorStep);
  const isFirstStep = editorStepIndex === 0;
  const isLastStep = editorStepIndex === EDITOR_STEPS.length - 1;
  const readinessRange = `${form.minScore || "Any"} - ${form.maxScore || "Any"}`;
  const hasVideo = Boolean(form.videoUrl || form.videoFileName || form.videoSizeBytes);
  const hasMarkdown = Boolean(form.markdownUrl || form.markdownFileName || form.markdownContent);

  function goToAdjacentStep(direction: 1 | -1) {
    const nextStep = EDITOR_STEPS[editorStepIndex + direction];
    if (nextStep) setEditorStep(nextStep.key);
  }

  if (previewCourseId !== null) {
    return <CourseProfilePage courseId={previewCourseId} mode="preview" onBack={() => setPreviewCourseId(null)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Course Library</h2>
          <p className="text-sm text-muted-foreground">
            {courses?.length ?? 0} courses with video, Markdown notes, and readiness-based recommendations
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate} className="gap-2 active:scale-[0.96] transition-transform">
            <Plus className="h-4 w-4" />
            Add course
          </Button>
        )}
      </div>

      <AnimatePresence>
        {canManage && showModal && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-primary/30 bg-card/95 p-5 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.55)] backdrop-blur-sm"
          >
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold">{editingId ? "Edit course" : "Add course"}</div>
                <div className="mt-1 text-xs text-muted-foreground">Compose the course, attach assets, then review the learner preview before saving.</div>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/40 p-1">
                {EDITOR_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const active = step.key === editorStep;
                  const completed = index < editorStepIndex;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setEditorStep(step.key)}
                      className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-[background-color,color,box-shadow,transform] active:scale-[0.96] ${
                        active
                          ? "bg-background text-foreground shadow-sm"
                          : completed
                            ? "text-primary hover:bg-background/50"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      }`}
                    >
                      {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      <span>{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {editorStep === "details" && (
                  <>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">Title *</label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Security Awareness Fundamentals"
                  className="bg-muted/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
                  className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Duration (minutes)</label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(event) => setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
                  className="bg-muted/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">XP reward</label>
                <Input
                  type="number"
                  value={form.xpReward}
                  onChange={(event) => setForm((current) => ({ ...current, xpReward: Number(event.target.value) }))}
                  className="bg-muted/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Min assessment points</label>
                <Input
                  type="number"
                  min={8}
                  max={32}
                  value={form.minScore}
                  onChange={(event) => setForm((current) => ({ ...current, minScore: event.target.value === "" ? "" : Number(event.target.value) }))}
                  className="bg-muted/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Max assessment points</label>
                <Input
                  type="number"
                  min={8}
                  max={32}
                  value={form.maxScore}
                  onChange={(event) => setForm((current) => ({ ...current, maxScore: event.target.value === "" ? "" : Number(event.target.value) }))}
                  className="bg-muted/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Lesson count</label>
                <Input
                  type="number"
                  value={form.lessonCount}
                  onChange={(event) => setForm((current) => ({ ...current, lessonCount: Number(event.target.value) }))}
                  className="bg-muted/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Thumbnail color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.thumbnailColor}
                    onChange={(event) => setForm((current) => ({ ...current, thumbnailColor: event.target.value }))}
                    className="h-9 w-16 cursor-pointer rounded border border-border bg-muted/30"
                  />
                  <span className="text-xs text-muted-foreground">{form.thumbnailColor}</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-muted-foreground">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                  placeholder="Summarize what learners will get from this course."
                  className="w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
                  </>
                )}

                {editorStep === "assets" && (
                  <>
              <div className="sm:col-span-2 rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 text-sm font-medium">Video</div>
                <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                  <Input
                    value={form.videoUrl}
                    onChange={(event) => {
                      setVideoMessage(null);
                      setForm((current) => ({ ...current, videoUrl: event.target.value }));
                    }}
                    placeholder="Paste a hosted MP4, WebM, YouTube, or Vimeo URL"
                    className="bg-muted/30"
                  />
                  <Input type="file" accept="video/*" onChange={(event) => handleVideoFile(event.target.files?.[0])} className="bg-muted/30" />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Videos can be selected up to 2GB. Files up to 25MB are embedded directly. Larger files need a hosted URL for playback after save.
                </div>
                {videoMessage && <div className="mt-2 text-xs text-muted-foreground">{videoMessage}</div>}
                {(form.videoFileName || form.videoSizeBytes) && (
                  <div className="mt-3 grid gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <div>File name: <span className="text-foreground">{form.videoFileName || "Not provided"}</span></div>
                    <div>Type: <span className="text-foreground">{form.videoMimeType || "Not provided"}</span></div>
                    <div>Size: <span className="text-foreground">{formatBytes(typeof form.videoSizeBytes === "number" ? form.videoSizeBytes : null)}</span></div>
                  </div>
                )}
                {previewVideoSource && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-border bg-black">
                    {isDirectVideo(previewVideoSource) ? (
                      <video src={previewVideoSource} controls className="max-h-72 w-full" />
                    ) : (
                      <iframe
                        src={previewVideoSource}
                        title="Course video preview"
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-3 text-sm font-medium">Markdown notes</div>
                <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                  <Input
                    value={form.markdownUrl}
                    onChange={(event) => setForm((current) => ({ ...current, markdownUrl: event.target.value }))}
                    placeholder="Optional public URL for the Markdown file"
                    className="bg-muted/30"
                  />
                  <Input type="file" accept=".md,text/markdown,text/plain" onChange={(event) => handleMarkdownFile(event.target.files?.[0])} className="bg-muted/30" />
                </div>
                {markdownMessage && <div className="mt-2 text-xs text-muted-foreground">{markdownMessage}</div>}
                {(form.markdownFileName || form.markdownSizeBytes) && (
                  <div className="mt-3 grid gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>File name: <span className="text-foreground">{form.markdownFileName || "Not provided"}</span></div>
                    <div>Size: <span className="text-foreground">{formatBytes(typeof form.markdownSizeBytes === "number" ? form.markdownSizeBytes : null)}</span></div>
                  </div>
                )}
                {form.markdownContent && (
                  <div className="prose prose-sm mt-3 max-w-none rounded-lg border border-border bg-card p-4 dark:prose-invert">
                    <ReactMarkdown>{form.markdownContent}</ReactMarkdown>
                  </div>
                )}
              </div>
                  </>
                )}

                {editorStep === "preview" && (
                  <div className="sm:col-span-2 space-y-4">
                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Publish checklist
                      </div>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        {[
                          { label: "Title", value: form.title.trim() || "Missing", ready: Boolean(form.title.trim()) },
                          { label: "Category", value: form.category.replace(/_/g, " "), ready: Boolean(form.category) },
                          { label: "Video", value: hasVideo ? "Attached" : "Not attached", ready: hasVideo },
                          { label: "Markdown notes", value: hasMarkdown ? "Attached" : "Optional", ready: true },
                          { label: "Readiness range", value: readinessRange, ready: true },
                          { label: "Reward", value: `${form.xpReward} XP`, ready: form.xpReward > 0 },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-muted/20 px-3 py-2">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className={`text-right text-xs font-medium ${item.ready ? "text-foreground" : "text-red-400"}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-primary" />
                        Notes preview
                      </div>
                      {form.markdownContent ? (
                        <div className="prose prose-sm max-h-64 max-w-none overflow-auto rounded-lg bg-card p-4 dark:prose-invert">
                          <ReactMarkdown>{form.markdownContent}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">
                          Markdown notes are optional. Add a `.md` file or URL if this course needs learner notes.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <aside className="space-y-3">
                <div className="sticky top-4 rounded-xl border border-border bg-background/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">Learner preview</div>
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Live</span>
                  </div>
                  <div
                    className="overflow-hidden rounded-lg bg-card"
                    style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
                  >
                    <div className="h-2" style={{ background: form.thumbnailColor }} />
                    <div className="space-y-3 p-4">
                      <div>
                        <div className="text-balance text-base font-semibold leading-tight">
                          {form.title.trim() || "Untitled course"}
                        </div>
                        <div className="mt-1 text-pretty text-xs text-muted-foreground">
                          {form.description.trim() || "Course description will appear here as you write it."}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
                        <div className="rounded-md bg-muted/30 px-2 py-2">
                          <div className="font-medium text-foreground tabular-nums">{form.durationMinutes || 0}m</div>
                          <div>Duration</div>
                        </div>
                        <div className="rounded-md bg-muted/30 px-2 py-2">
                          <div className="font-medium text-foreground tabular-nums">{form.xpReward || 0}</div>
                          <div>XP</div>
                        </div>
                        <div className="rounded-md bg-muted/30 px-2 py-2">
                          <div className="font-medium capitalize text-foreground">{form.difficulty}</div>
                          <div>Level</div>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-lg bg-black">
                        {previewVideoSource ? (
                          isDirectVideo(previewVideoSource) ? (
                            <video src={previewVideoSource} controls className="max-h-48 w-full" />
                          ) : (
                            <iframe
                              src={previewVideoSource}
                              title="Course video preview"
                              className="aspect-video w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          )
                        ) : (
                          <div className="flex aspect-video items-center justify-center text-muted-foreground">
                            <Film className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-md bg-muted/30 px-2 py-1 capitalize">{form.category.replace(/_/g, " ")}</span>
                        <span className="rounded-md bg-muted/30 px-2 py-1">Range {readinessRange}</span>
                        {hasMarkdown && <span className="rounded-md bg-muted/30 px-2 py-1">Notes ready</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button size="sm" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => goToAdjacentStep(-1)} disabled={isFirstStep}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                {!isLastStep ? (
                  <Button size="sm" onClick={() => goToAdjacentStep(1)} className="gap-2 active:scale-[0.96] transition-transform">
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSubmit} disabled={!form.title.trim() || isPending} className="gap-2 active:scale-[0.96] transition-transform">
                    <CheckCircle2 className="h-4 w-4" />
                    {isPending ? "Saving..." : editingId ? "Update course" : "Create course"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canManage && confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4"
          >
            <span className="text-sm text-red-300">Delete this course? This action cannot be undone.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => deleteCourse.mutate(confirmDelete)} disabled={deleteCourse.isPending}>
                {deleteCourse.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course, index) => {
            const currentCourse = course as any;
            return (
              <motion.div
                key={currentCourse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_48px_-32px_rgba(0,0,0,0.55)]"
              >
                <div
                  className={`h-2 bg-gradient-to-r ${CATEGORY_COLORS[index % CATEGORY_COLORS.length]}`}
                  style={{ background: `linear-gradient(to right, ${currentCourse.thumbnailColor}, ${currentCourse.thumbnailColor}99)` }}
                />
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm leading-tight">{currentCourse.title}</div>
                    <span className={`shrink-0 text-xs ${DIFFICULTY_COLORS[currentCourse.difficulty] ?? "text-muted-foreground"}`}>
                      {currentCourse.difficulty}
                    </span>
                  </div>

                  <div className="line-clamp-2 text-xs text-muted-foreground">{currentCourse.description}</div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{currentCourse.category?.replace(/_/g, " ")}</span>
                    <span>{currentCourse.durationMinutes}m</span>
                    <span className="text-primary">+{currentCourse.xpReward} XP</span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Video: {currentCourse.videoFileName || (currentCourse.videoUrl ? "Attached" : "Not set")}</div>
                    <div>Markdown: {currentCourse.markdownFileName || "Not set"}</div>
                    {(currentCourse.minScore !== null || currentCourse.maxScore !== null) && (
                      <div>
                        Range: {currentCourse.minScore ?? "Any"} to {currentCourse.maxScore ?? "Any"}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant="secondary" onClick={() => setPreviewCourseId(currentCourse.id)} className="gap-2 active:scale-[0.96] transition-transform">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {canManage && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEdit(currentCourse)} className="gap-2 active:scale-[0.96] transition-transform">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(currentCourse.id)} className="gap-2 active:scale-[0.96] transition-transform">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
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
