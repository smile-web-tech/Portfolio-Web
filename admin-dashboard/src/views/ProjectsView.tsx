import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Trash2, Edit, ExternalLink, Code } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/Modal';

export function ProjectsView() {
  const { data: projects, loading, error, mutate } = useApi<any[]>('/projects');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', techStack: '', liveDemoUrl: '', githubRepoUrl: '', thumbnailUrl: '', isFeatured: false
  });

  if (loading && !projects) return <div className="text-muted-foreground p-8">Loading projects...</div>;
  if (error && !projects) return <div className="text-destructive p-8">Error: {error}</div>;

  const openForm = (project?: any) => {
    if (project) {
      setEditingId(project.id);
      setFormData({
        title: project.title || '',
        description: project.description || '',
        techStack: project.techStack?.join(', ') || '',
        liveDemoUrl: project.liveDemoUrl || '',
        githubRepoUrl: project.githubRepoUrl || '',
        thumbnailUrl: project.thumbnailUrl || '',
        isFeatured: project.isFeatured || false,
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', description: '', techStack: '', liveDemoUrl: '', githubRepoUrl: '', thumbnailUrl: '', isFeatured: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      if (editingId) {
        await mutate('PUT', payload, `/${editingId}`);
      } else {
        await mutate('POST', payload);
      }
      setIsModalOpen(false);
    } catch (err: any) { alert(err.message || 'Validation Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">All Projects</h2>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Tech Stack</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Links</th>
              <th className="px-4 py-3 font-medium flex justify-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No projects found. Add one above.</td></tr>
            )}
            {projects?.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {item.techStack?.slice(0, 3).map((tech: string) => (
                      <span key={tech} className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{tech}</span>
                    ))}
                    {item.techStack?.length > 3 && <span className="text-xs text-muted-foreground">+{item.techStack.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-1 rounded-md", item.isFeatured ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground")}>
                    {item.isFeatured ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 text-muted-foreground">
                    {item.liveDemoUrl && <a href={item.liveDemoUrl} target="_blank" rel="noreferrer" className="hover:text-primary"><ExternalLink size={16} /></a>}
                    {item.githubRepoUrl && <a href={item.githubRepoUrl} target="_blank" rel="noreferrer" className="hover:text-primary"><Code size={16} /></a>}
                  </div>
                </td>
                <td className="px-4 py-3 flex justify-end gap-2 text-muted-foreground">
                  <button onClick={() => openForm(item)} className="p-1.5 hover:text-primary hover:bg-muted rounded-md transition-colors"><Edit size={16} /></button>
                  <button onClick={() => { if(confirm('Are you sure you want to delete this project?')) mutate('DELETE', null, `/${item.id}`) }} className="p-1.5 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Project" : "Add Project"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Project Title</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Tech Stack (comma separated)</label>
            <input required value={formData.techStack} onChange={e => setFormData({...formData, techStack: e.target.value})} placeholder="React, Node.js, PostgreSQL" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Live URL (optional)</label>
              <input type="url" value={formData.liveDemoUrl} onChange={e => setFormData({...formData, liveDemoUrl: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">GitHub URL (optional)</label>
              <input type="url" value={formData.githubRepoUrl} onChange={e => setFormData({...formData, githubRepoUrl: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>
          <div className="space-y-1 flex items-center gap-2 pt-2">
            <input type="checkbox" id="featured" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring" />
            <label htmlFor="featured" className="text-sm font-medium leading-none cursor-pointer">Mark as Featured Project</label>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">Cancel</button>
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Save Project</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
