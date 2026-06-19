import { useState } from "react";
import { motion } from "framer-motion";
import { useListDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminDepartments() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useListDepartments();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      await createDept.mutateAsync({ data: { name: newName, description: newDesc } });
      setNewName(""); setNewDesc(""); setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department created" });
    } catch { toast({ title: "Failed to create", variant: "destructive" }); }
  }

  async function handleUpdate(id: number) {
    try {
      await updateDept.mutateAsync({ id, data: { name: editName, description: editDesc } });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department updated" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete department "${name}"?`)) return;
    try {
      await deleteDept.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Department Management</h2>
          <p className="text-sm text-muted-foreground">{departments?.length ?? 0} departments</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} variant="default" size="sm">
          {showCreate ? "Cancel" : "+ New Department"}
        </Button>
      </div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 border border-primary/30 rounded-xl p-5 space-y-3">
          <div className="text-sm font-semibold">Create Department</div>
          <Input placeholder="Department name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-muted/30" />
          <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-muted/30" />
          <Button onClick={handleCreate} disabled={!newName.trim()} size="sm">Create Department</Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : departments?.map((d: any, i: number) => (
          <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-card/80 border border-border rounded-xl p-5 backdrop-blur-sm">
            {editingId === d.id ? (
              <div className="space-y-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-muted/30 text-sm" />
                <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="bg-muted/30 text-sm" placeholder="Description" />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => handleUpdate(d.id)}>Save</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-primary text-lg mb-2">⬡</div>
                <div className="font-semibold mb-1">{d.name}</div>
                <div className="text-xs text-muted-foreground mb-3">{d.description ?? "No description"}</div>
                <div className="text-xs text-muted-foreground mb-4">{d.memberCount ?? 0} members</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingId(d.id); setEditName(d.name); setEditDesc(d.description ?? ""); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(d.id, d.name)}>Delete</Button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
