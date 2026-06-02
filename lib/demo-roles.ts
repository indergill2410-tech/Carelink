export type DemoRoleKey = 'ADMIN' | 'FACILITY' | 'NURSE' | 'EN' | 'PCA'

export type DemoLoginConfig = {
  email: string
  destination: string
}

export type DemoRoleOption = DemoLoginConfig & {
  role: DemoRoleKey
  label: string
  subtitle: string
  icon: 'admin' | 'facility' | 'nurse' | 'en' | 'pca'
  gradient: string
  glow: string
}

export const DEMO_ROLE_OPTIONS: DemoRoleOption[] = [
  {
    role: 'ADMIN',
    email: 'admin@demo.carelink.app',
    destination: '/dashboard',
    label: 'Agency Admin',
    subtitle: 'Global dispatch, compliance, analytics',
    icon: 'admin',
    gradient: 'from-violet-600 to-indigo-700',
    glow: 'rgba(139,92,246,0.35)',
  },
  {
    role: 'FACILITY',
    email: 'facility@demo.carelink.app',
    destination: '/facility',
    label: 'Facility Manager',
    subtitle: 'Post shifts, roster, spend tracking',
    icon: 'facility',
    gradient: 'from-sky-500 to-blue-700',
    glow: 'rgba(14,165,233,0.35)',
  },
  {
    role: 'NURSE',
    email: 'nurse@demo.carelink.app',
    destination: '/worker',
    label: 'Registered Nurse',
    subtitle: 'Green compliance, ready to accept shifts',
    icon: 'nurse',
    gradient: 'from-teal to-electric-dim',
    glow: 'rgba(0,201,167,0.35)',
  },
  {
    role: 'EN',
    email: 'en@demo.carelink.app',
    destination: '/worker',
    label: 'Enrolled Nurse',
    subtitle: 'Amber compliance, document review flow',
    icon: 'en',
    gradient: 'from-violet-500 to-purple-700',
    glow: 'rgba(168,85,247,0.35)',
  },
  {
    role: 'PCA',
    email: 'pca@demo.carelink.app',
    destination: '/worker',
    label: 'Personal Care Assistant',
    subtitle: 'Red compliance, blocked accept state',
    icon: 'pca',
    gradient: 'from-rose-500 to-orange-600',
    glow: 'rgba(244,63,94,0.35)',
  },
]

export const DEMO_LOGIN_CONFIGS: Record<DemoRoleKey, DemoLoginConfig> =
  Object.fromEntries(
    DEMO_ROLE_OPTIONS.map(({ role, email, destination }) => [
      role,
      { email, destination },
    ]),
  ) as Record<DemoRoleKey, DemoLoginConfig>

export const DEMO_EMAILS = DEMO_ROLE_OPTIONS.map(role => role.email)
