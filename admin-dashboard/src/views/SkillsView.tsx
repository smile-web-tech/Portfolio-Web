import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Modal } from '../components/Modal';

export function SkillsView() {
  const { data: skills, loading, error, mutate } = useApi<any[]>('/skills');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', proficiency: '' });

  if (loading && !skills) return <div className="text-muted-foreground p-8">Loading skills...</div>;
  if (error && !skills) return <div className="text-destructive p-8">Error: {error}</div>;

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name || '', category: item.category || '', proficiency: item.proficiency || '' });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: '', proficiency: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      proficiency: formData.proficiency || null
    };
    try {
      if (editingId) await mutate('PUT', payload, `/${editingId}`);
      else await mutate('POST', payload);
      setIsModalOpen(false);
    } catch (err: any) { alert(err.message || 'Validation Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Skills Database</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Skill
        </button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Proficiency</th>
              <th className="px-4 py-3 font-medium flex justify-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {skills?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No skills defined.</td></tr>
            )}
            {skills?.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3">
                  <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md border border-border">{item.category}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.proficiency || '-'}</td>
                <td className="px-4 py-3 flex justify-end gap-2 text-muted-foreground">
                  <button onClick={() => openForm(item)} className="p-1.5 hover:text-primary hover:bg-muted rounded-md transition-colors"><Edit size={16} /></button>
                  <button onClick={() => { if(confirm('Are you sure?')) mutate('DELETE', null, `/${item.id}`) }} className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Skill" : "Add Skill"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <input required placeholder="e.g. Frontend, Backend, Tools" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Skill Name</label>
            <input required placeholder="e.g. React.js, PostgreSQL" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Proficiency (Optional)</label>
            <input placeholder="e.g. Expert, Intermediate, 90%" value={formData.proficiency} onChange={e => setFormData({...formData, proficiency: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">Cancel</button>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Save Skill</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
