import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Modal } from '../components/Modal';

export function EducationView() {
  const { data: edu, loading, error, mutate } = useApi<any[]>('/education');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    institution: '', degree: '', startDate: '', endDate: '', gpa: ''
  });

  if (loading && !edu) return <div className="text-muted-foreground p-8">Loading education...</div>;
  if (error && !edu) return <div className="text-destructive p-8">Error: {error}</div>;

  const openForm = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        institution: item.institution || '',
        degree: item.degree || '',
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        gpa: item.gpa || ''
      });
    } else {
      setEditingId(null);
      setFormData({ institution: '', degree: '', startDate: '', endDate: '', gpa: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      endDate: formData.endDate ? formData.endDate : null,
      gpa: formData.gpa || null
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
        <h2 className="text-lg font-semibold">Education</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Education
        </button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Degree</th>
              <th className="px-4 py-3 font-medium">Institution</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium flex justify-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {edu?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No education listed.</td></tr>
            )}
            {edu?.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.degree}</td>
                <td className="px-4 py-3">{item.institution}</td>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Education" : "Add Education"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Institution</label>
            <input required value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Degree</label>
            <input required value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Start Date</label>
              <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block [color-scheme:dark]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">End Date</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring block [color-scheme:dark]" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">GPA (Optional)</label>
            <input value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">Cancel</button>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Save Education</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
