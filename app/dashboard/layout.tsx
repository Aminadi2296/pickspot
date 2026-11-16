'use client'

import {
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  ContentCut as ServiceIcon,
  People as StaffIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Apartment as AdminIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import type { UserRoleType } from '@/types/database'

const DRAWER_WIDTH = 240

type NavItem = {
  label: string
  href: string
  icon: ReactNode
  roles: UserRoleType[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard/business',
    icon: <DashboardIcon />,
    roles: ['owner'],
  },
  {
    label: 'Locations',
    href: '/dashboard/business/locations',
    icon: <LocationIcon />,
    roles: ['owner'],
  },
  {
    label: 'Services',
    href: '/dashboard/business/services',
    icon: <ServiceIcon />,
    roles: ['owner'],
  },
  {
    label: 'Staff',
    href: '/dashboard/business/staff',
    icon: <StaffIcon />,
    roles: ['owner'],
  },
  {
    label: 'Calendar',
    href: '/dashboard/business/calendar',
    icon: <CalendarIcon />,
    roles: ['owner'],
  },
  {
    label: 'My Schedule',
    href: '/dashboard/employee/schedule',
    icon: <ScheduleIcon />,
    roles: ['employee'],
  },
  {
    label: 'Appointments',
    href: '/dashboard/employee',
    icon: <CalendarIcon />,
    roles: ['employee'],
  },
  {
    label: 'Tenants',
    href: '/admin/tenants',
    icon: <AdminIcon />,
    roles: ['super_admin'],
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [role, setRole] = useState<UserRoleType | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setRole(data.role as UserRoleType)
      })
  }, [user, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: -0.5 }}
        >
          Pickspot
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  router.push(item.href)
                  if (isMobile) setMobileOpen(false)
                }}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider />

      {/* User + logout */}
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
          {user?.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" noWrap display="block" color="text.secondary">
            {user?.email}
          </Typography>
          <Typography variant="caption" noWrap display="block" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
            {role?.replace('_', ' ')}
          </Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton onClick={handleLogout} size="small" color="error">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile hamburger */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: theme.zIndex.drawer + 2,
          }}
        >
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Drawer */}
      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 7, md: 3 },
          minWidth: 0,
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
