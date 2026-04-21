import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Save } from 'lucide-react';

export function SettingsView() {
  const { data: settings, loading, error, mutate, refresh } = useApi<any>('/settings');
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  if (loading) return <div className="text-muted-foreground p-8">Loading settings...</div>;
  if (error && !settings) return <div className="text-destructive p-8">Error: {error}</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mutate('PUT', formData);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">General Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your portfolio's core identity and links.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input 
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title</label>
            <input 
              value={formData.jobTitle || ''} 
              onChange={e => setFormData({...formData, jobTitle: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea 
            value={formData.bio || ''} 
            onChange={e => setFormData({...formData, bio: e.target.value})}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {['githubUrl', 'linkedinUrl', 'twitterUrl', 'email', 'profilePicUrl', 'resumeUrl'].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium capitalize">{field.replace('Url', ' URL')}</label>
              <input 
                value={formData[field] || ''} 
                onChange={e => setFormData({...formData, [field]: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
              />
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
