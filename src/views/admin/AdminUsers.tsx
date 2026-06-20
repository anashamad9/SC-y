import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListUsers, useUpdateUser, useListDepartments } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/runtime";

const ROLE_COLORS: Record<string, string> = {
  employee: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  admin: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  superadmin: "bg-primary/20 text-primary border-primary/30",
  executive: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  hr: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};
const ROLES = ["employee", "admin", "executive", "hr", "superadmin"];
const EMPTY_EDIT_FORM = { role: "", departmentId: "", firstName: "", lastName: "", jobTitle: "", avatarUrl: "" };

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const BLANK_FORM = { email: "", firstName: "", lastName: "", role: "employee", departmentId: "", jobTitle: "", password: "" };

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editImageMessage, setEditImageMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...BLANK_FORM });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListUsers({ role: roleFilter || undefined, page, limit: 20 });
  const { data: departments } = useListDepartments();
  const updateUser = useUpdateUser();

  const createUser = useMutation({
    mutationFn: (body: typeof BLANK_FORM) => apiFetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setPage(1);
      toast({ title: "User created", description: `Default password: ${createForm.password || "Welcome1!"}` });
      setShowCreate(false);
      setCreateForm({ ...BLANK_FORM });
    },
    onError: (e: any) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
      setConfirmDeleteId(null);
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const filtered = data?.users?.filter(u =>
    !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  async function saveEdit(id: number) {
    try {
      await updateUser.mutateAsync({
        id,
        data: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          jobTitle: editForm.jobTitle || null,
          avatarUrl: editForm.avatarUrl || null,
          role: editForm.role,
          departmentId: editForm.departmentId ? parseInt(editForm.departmentId) : null,
        },
      });
      setEditingId(null);
      setEditImageMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated" });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  function startEdit(u: any) {
    setEditingId(u.id);
    setEditImageMessage(null);
    setEditForm({
      role: u.role,
      departmentId: String(u.departmentId ?? ""),
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      jobTitle: u.jobTitle ?? "",
      avatarUrl: u.avatarUrl ?? "",
    });
  }

  function handleEditAvatarFile(file?: File) {
    setEditImageMessage(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditImageMessage("Choose an image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setEditImageMessage("Image must be 1MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditForm(f => ({ ...f, avatarUrl: String(reader.result ?? "") }));
      setEditImageMessage("Image selected. Save to apply it.");
    };
    reader.onerror = () => setEditImageMessage("Could not read image.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} total operatives</p>
        </div>
        <Button size="sm" onClick={() => { setShowCreate(true); setCreateForm({ ...BLANK_FORM }); }}>+ Invite User</Button>
      </div>

      {/* Create User Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card/90 border border-primary/30 rounded-xl p-5 backdrop-blur-sm">
            <div className="text-sm font-semibold mb-4">Invite New User</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">First Name *</label>
                <Input value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Layla" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Last Name *</label>
                <Input value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Al Rashid" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                <Input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="user@cybercultx.com" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                <select value={createForm.departmentId} onChange={e => setCreateForm(f => ({ ...f, departmentId: e.target.value }))}
                  className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
                  <option value="">None</option>
                  {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Job Title</label>
                <Input value={createForm.jobTitle} onChange={e => setCreateForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="Security Analyst" className="bg-muted/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Initial Password (optional)</label>
                <Input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Defaults to Welcome1!" className="bg-muted/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" disabled={!createForm.email || !createForm.firstName || !createForm.lastName || createUser.isPending}
                onClick={() => createUser.mutate(createForm)}>
                {createUser.isPending ? "Creating..." : "Create User"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-red-400">Delete this user permanently? Their data cannot be recovered.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={deleteUser.isPending}
                onClick={() => deleteUser.mutate(confirmDeleteId)}>
                {deleteUser.isPending ? "Deleting..." : "Delete"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search by name or email..." value={search}
          onChange={e => setSearch(e.target.value)} className="max-w-xs bg-muted/30" />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-muted/30 border border-border rounded-md px-3 py-2 text-sm">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card/80 border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] text-xs text-muted-foreground uppercase tracking-wider px-5 py-3 border-b border-border bg-muted/20">
          <div>Profile</div><div>Email</div><div>Role</div><div>Department</div><div>Actions</div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] px-5 py-3 items-center hover:bg-muted/10">
                <div className="min-w-0">
                  {editingId === u.id ? (
                    <div className="space-y-2 pr-2">
                      <div className="flex items-center gap-2">
                        {editForm.avatarUrl ? (
                          <img src={editForm.avatarUrl} alt={`${editForm.firstName} ${editForm.lastName}`} className="h-8 w-8 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {(editForm.firstName[0] ?? "?")}{editForm.lastName[0] ?? ""}
                          </div>
                        )}
                        <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => handleEditAvatarFile(e.target.files?.[0])} className="h-8 text-xs" />
                      </div>
                      {editImageMessage && <div className="text-[11px] text-muted-foreground">{editImageMessage}</div>}
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} className="h-8 text-xs" placeholder="First" />
                        <Input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} className="h-8 text-xs" placeholder="Last" />
                      </div>
                      <Input value={editForm.jobTitle} onChange={e => setEditForm(f => ({ ...f, jobTitle: e.target.value }))} className="h-8 text-xs" placeholder="Job title" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {(u as any).avatarUrl ? (
                        <img src={(u as any).avatarUrl} alt={`${u.firstName} ${u.lastName}`} className="h-8 w-8 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-muted-foreground truncate">{(u as any).jobTitle ?? "—"}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                <div>
                  {editingId === u.id ? (
                    <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                      className="bg-muted border border-border rounded px-2 py-1 text-xs w-full">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role.toLowerCase()] ?? ROLE_COLORS.employee}`}>
                      {u.role}
                    </span>
                  )}
                </div>
                <div>
                  {editingId === u.id ? (
                    <select value={editForm.departmentId} onChange={e => setEditForm(f => ({ ...f, departmentId: e.target.value }))}
                      className="bg-muted border border-border rounded px-2 py-1 text-xs w-full">
                      <option value="">None</option>
                      {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-muted-foreground">{(u as any).departmentName ?? "—"}</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  {editingId === u.id ? (
                    <>
                      <Button size="sm" className="h-6 text-xs px-2" onClick={() => saveEdit(u.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setEditingId(null); setEditImageMessage(null); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                        onClick={() => startEdit(u)}>
                        Edit
                      </Button>
                      <button onClick={() => { setConfirmDeleteId(u.id); setEditingId(null); }}
                        className="text-xs text-muted-foreground hover:text-red-400 transition-colors px-1">
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {data && data.total > 20 && (
        <div className="flex items-center gap-3 justify-center">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(data.total / 20)}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 20)}>Next →</Button>
        </div>
      )}
    </div>
  );
}
