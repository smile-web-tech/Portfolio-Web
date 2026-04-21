import React, { useState } from 'react';
import { LayoutDashboard, FolderKanban, Briefcase, GraduationCap, Code2, Settings as SettingsIcon, Menu, Bell, UserCircle } from 'lucide-react';
import { cn } from './lib/utils';

// Import Views
import { ProjectsView } from './views/ProjectsView';
import { ExperienceView } from './views/ExperienceView';
import { EducationView } from './views/EducationView';
import { SkillsView } from './views/SkillsView';
import { SettingsView } from './views/SettingsView';

function OverviewPlaceholder() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Total Views', 'Interactions', 'Messages'].map((stat, i) => (
          <div key={stat} className="p-6 rounded-lg border border-border bg-card relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-sm text-muted-foreground font-medium">{stat}</p>
            <p className="text-3xl font-bold mt-2 text-foreground">{[124, 45, 12][i]}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Welcome to Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">Select a section from the sidebar to manage your portfolio data. Real-time updates automatically sync with your database.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Projects', icon: FolderKanban },
    { name: 'Experience', icon: Briefcase },
    { name: 'Education', icon: GraduationCap },
    { name: 'Skills', icon: Code2 },
    { name: 'Settings', icon: SettingsIcon },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Projects': return <ProjectsView />;
      case 'Experience': return <ExperienceView />;
      case 'Education': return <EducationView />;
      case 'Skills': return <SkillsView />;
      case 'Settings': return <SettingsView />;
      default: return <OverviewPlaceholder />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden dark">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {sidebarOpen && <span className="font-bold text-lg text-primary truncate">Admin CMS</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors mx-auto">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !sidebarOpen && "justify-center"
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <UserCircle size={20} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {renderActiveView()}
          </div>
        </div>
      </main>
    </div>
  );
}
