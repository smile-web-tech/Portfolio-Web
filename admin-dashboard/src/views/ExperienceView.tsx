import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Modal } from '../components/Modal';

export function ExperienceView() {
  const { data: exp, loading, error, mutate } = useApi<any[]>('/experience');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company: '', role: '', startDate: '', endDate: '', description: ''
  });

  if (loading && !exp) return <div className="text-muted-foreground p-8">Loading experience...</div>;
  if (error && !exp) return <div className="text-destructive p-8">Error: {error}</div>;

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        company: item.company || '',
        role: item.role || '',
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        description: item.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({ company: '', role: '', startDate: '', endDate: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      endDate: formData.endDate ? formData.endDate : null
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
        <h2 className="text-lg font-semibold">Experience</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Experience
        </button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium flex justify-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {exp?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No experience found. Add one above.</td></tr>
            )}
            {exp?.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.role}</td>
                <td className="px-4 py-3">{item.company}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(item.startDate).getFullYear()} - {item.endDate ? new Date(item.endDate).getFullYear() : 'Present'}
                </td>
                <td className="px-4 py-3 flex justify-end gap-2 text-muted-foreground">
                  <button onClick={() => openForm(item)} className="p-1.5 hover:text-primary hover:bg-muted rounded-md transition-colors"><Edit size={16} /></button>
                  <button onClick={() => { if(confirm('Are you sure?')) mutate('DELETE', null, `/${item.id}`) }} className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Experience" : "Add Experience"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Company</label>
              <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Role / Title</label>
              <input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Start Date</label>
              <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">End Date (Leave empty for Present)</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block [color-scheme:dark]" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">Cancel</button>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Save Experience</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
