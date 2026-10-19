import { useEffect, useState, type ComponentType } from 'react'
import { Briefcase, Code2, ExternalLink, FolderKanban, Globe, GraduationCap, Image as ImageIcon, LayoutDashboard, LogOut, Menu, ShieldCheck, User as UserIcon, X } from 'lucide-react'
import { useAuth } from './lib/auth'
import { cn } from './lib/utils'
import { Spinner } from './components/ui'
import { LoginView } from './views/LoginView'
import { OverviewView } from './views/OverviewView'
import { ProjectsView } from './views/ProjectsView'
import { ExperienceView } from './views/ExperienceView'
import { EducationView } from './views/EducationView'
import { SkillsView } from './views/SkillsView'
import { SettingsView } from './views/SettingsView'
import { MediaView } from './views/MediaView'
import { SecurityView } from './views/SecurityView'
import { VisitorsView } from './views/VisitorsView'

interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'settings', label: 'Profile', icon: UserIcon },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'visitors', label: 'Visitors', icon: Globe },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

const tabFromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '')
  return NAV.some((n) => n.id === id) ? id : 'overview'
}

export default function App() {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Spinner label="Checking session" />
      </div>
    )
  }
  return status === 'authenticated' ? <Shell /> : <LoginView />
}

function Shell() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState(tabFromHash)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (id: string) => {
    window.location.hash = `/${id}`
    setMenuOpen(false)
  }

  const view = (() => {
    switch (tab) {
      case 'projects': return <ProjectsView />
      case 'experience': return <ExperienceView />
      case 'education': return <EducationView />
      case 'skills': return <SkillsView />
      case 'settings': return <SettingsView />
      case 'media': return <MediaView />
      case 'visitors': return <VisitorsView />
      case 'security': return <SecurityView />
      default: return <OverviewView go={go} />
    }
  })()

  return (
    <div className="flex h-full">
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden />}

      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform md:static md:translate-x-0', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <span className="font-semibold tracking-tight">
            Portfolio <span className="text-accent">Admin</span>
          </span>
          <button type="button" aria-label="Close menu" className="text-muted md:hidden" onClick={() => setMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Sections">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => go(id)}
              className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', tab === id ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-surface-2 hover:text-text')}
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text">
            <ExternalLink size={18} /> View site
          </a>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-bg px-3 py-2">
            <span className="min-w-0 truncate text-xs text-muted" title={user?.email}>{user?.email}</span>
            <button type="button" aria-label="Sign out" title="Sign out" onClick={() => void logout()} className="text-muted transition-colors hover:text-danger">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:hidden">
          <button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="text-muted">
            <Menu size={22} />
          </button>
          <span className="font-semibold">{NAV.find((n) => n.id === tab)?.label}</span>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">{view}</div>
        </main>
      </div>
    </div>
  )
}
