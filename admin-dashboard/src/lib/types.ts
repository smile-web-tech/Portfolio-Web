export type LinkKind = 'button' | 'highlight' | 'github'

export interface ProjectLink {
  label: string
  url: string
  kind: LinkKind
}

export interface Project {
  id: string
  title: string
  description: string
  techStack: string[]
  thumbnailUrl: string | null
  links: ProjectLink[]
  isPublished: boolean
  sortOrder: number
}

export interface ExperienceDetail {
  title: string | null
  url: string | null
  bullets: string[]
}

export interface Experience {
  id: string
  company: string
  role: string
  location: string | null
  logoUrl: string | null
  startDate: string
  endDate: string | null
  details: ExperienceDetail[]
  showProgress: boolean
  isPublished: boolean
  sortOrder: number
}

export interface Education {
  id: string
  institution: string
  degree: string | null
  location: string | null
  logoUrl: string | null
  startDate: string
  endDate: string | null
  gpa: string | null
  bullets: string[]
  isPublished: boolean
  sortOrder: number
}

export interface Skill {
  id: string
  category: string
  name: string
  proficiency: string | null
  iconUrl: string | null
  isPublished: boolean
  sortOrder: number
}

export interface Settings {
  name: string
  jobTitle: string
  bio: string | null
  email: string | null
  phone: string | null
  profilePicUrl: string | null
  heroBackgroundUrl: string | null
  aboutImageUrl: string | null
  resumeUrl: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  footerCredit: string | null
}

export interface MediaItem {
  id: string
  url: string
  originalName: string
  mime: string
  size: number
  width: number | null
  height: number | null
  createdAt: string
}

export interface AuditEntry {
  id: string
  action: string
  entity: string | null
  detail: string | null
  ip: string | null
  createdAt: string
}

export interface SessionInfo {
  id: string
  ip: string | null
  userAgent: string | null
  createdAt: string
  lastSeenAt: string
  current: boolean
}

export interface User {
  id: string
  email: string
  totpEnabled: boolean
  lastLoginAt: string | null
}

export interface Overview {
  counts: { projects: number; experience: number; education: number; skills: number; media: number }
  drafts: number
  visits: { last24h: number; last7d: number }
  recent: AuditEntry[]
}

export interface Tally {
  /** null = unknown / direct */
  name: string | null
  visits: number
  visitors: number
}

export interface SeriesPoint {
  start: string
  visits: number
  visitors: number
  pageViews: number
}

export interface Totals {
  visits: number
  visitors: number
  pageViews: number
}

export interface Analytics {
  range: '24h' | '7d' | '30d' | '90d'
  unit: 'hour' | 'day'
  includeBots: boolean
  since: string
  until: string
  retentionDays: number
  totals: Totals & { bots: number }
  previous: Totals
  series: SeriesPoint[]
  countries: Tally[]
  devices: Tally[]
  browsers: Tally[]
  systems: Tally[]
  referrers: Tally[]
}

export interface Visit {
  id: string
  ip: string
  country: string | null
  region: string | null
  city: string | null
  deviceType: string
  browser: string | null
  os: string | null
  referrerHost: string | null
  path: string | null
  language: string | null
  isBot: boolean
  pageViews: number
  createdAt: string
  lastSeenAt: string
}

export interface VisitsPage {
  items: Visit[]
  nextBefore: string | null
}
