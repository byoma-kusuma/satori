import {
  IconBuilding,
  IconCalendar,
  IconHelp,
  IconLayoutDashboard,
  IconPalette,
  IconSettings,
  IconSettings2,
  IconUsers,
  IconUsersGroup,
  IconCertificate,
  IconUser,
  IconTimeline,
  IconClipboardList,
  IconBell,
  IconTool,
} from '@tabler/icons-react'
import { AudioWaveform, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'
import { type User } from '@/hooks/use-auth'
import { type UserRole } from '@/types/user-roles'
import { ByomaKusumaIcon } from '@/components/byoma-kusuma-icon'

const baseSidebarData = {
  user: {
    name: 'Byoma Kusuma',
    email: 'placeholder@byomakusuma.com',
    avatar: '/avatars/byoma-kusuma.jpg',
  },
  teams: [
    {
      name: 'Byoma Kusuma',
      logo: ByomaKusumaIcon,
      plan: 'ByomaKusuma UI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Persons',
          url: '/persons',
          icon: IconUsers,
        },
        {
          title: 'Centers',
          url: '/centers',
          icon: IconBuilding,
        },
        {
          title: 'Groups',
          url: '/groups',
          icon: IconUsersGroup,
        },
        {
          title: 'Events',
          url: '/events',
          icon: IconCalendar,
        },
        {
          title: 'Notifications',
          url: '/notifications',
          icon: IconBell,
        },
      ],
    },
    {
      title: 'System Setup',
      items: [
        {
          title: 'System Setup',
          icon: IconTool,
          items: [
            {
              title: 'General',
              url: '/system-setup/general',
              icon: IconSettings2,
            },
            {
              title: 'Mahakrama',
              url: '/mahakrama',
              icon: IconTimeline,
            },
            {
              title: 'Empowerments',
              url: '/empowerments',
              icon: IconCertificate,
            },
            {
              title: 'Gurus',
              url: '/gurus',
              icon: IconUser,
            },
            {
              title: 'Users',
              url: '/users',
              icon: IconUsers,
            },
            {
              title: 'Import',
              url: '/registrations',
              icon: IconClipboardList,
            },
          ],
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}

export const getSidebarData = (
  user: User | null,
  userRole: UserRole | null,
  viewerProfileUrl?: string
): SidebarData => {
  // For viewers, only show Dashboard, Profile, and Events
  if (userRole === 'viewer') {
    const viewerNav: SidebarData = {
      ...baseSidebarData,
      navGroups: [
        {
          title: 'General',
          items: [
            {
              title: 'Dashboard',
              url: '/',
              icon: IconLayoutDashboard,
            },
            {
              title: 'Profile',
              url: viewerProfileUrl ?? '/persons',
              icon: IconUser,
            },
            {
              title: 'Events',
              url: '/events',
              icon: IconCalendar,
            },
            {
              title: 'Notifications',
              url: '/notifications',
              icon: IconBell,
            },
          ],
        },
      ],
      user: user
        ? {
            name: user.name,
            email: user.email,
            avatar: baseSidebarData.user.avatar,
          }
        : baseSidebarData.user,
    } as SidebarData

    return viewerNav
  }

  if (userRole === 'center_admin' || userRole === 'group_admin') {
    const scopedNav: SidebarData = {
      ...baseSidebarData,
      navGroups: [
        {
          title: 'General',
          items: [
            { title: 'Dashboard', url: '/', icon: IconLayoutDashboard },
            { title: 'Persons', url: '/persons', icon: IconUsers },
            ...(userRole === 'center_admin' ? [{ title: 'Centers', url: '/centers', icon: IconBuilding }] : []),
            { title: 'Events', url: '/events', icon: IconCalendar },
            { title: 'Notifications', url: '/notifications', icon: IconBell },
          ],
        },
      ],
      user: user
        ? { name: user.name, email: user.email, avatar: baseSidebarData.user.avatar }
        : baseSidebarData.user,
    } as SidebarData
    return scopedNav
  }

  // Filter nav items based on user role for non-viewers
  const filteredNavGroups = baseSidebarData.navGroups
    .filter((group) => {
      // Hide System Setup entirely from krama_instructor
      if (group.title === 'System Setup' && userRole === 'krama_instructor') return false
      return true
    })
    .map((group) => {
      if (group.title !== 'System Setup') return group

      // For admin: filter out Mahakrama and Import from System Setup sub-items
      return {
        ...group,
        items: group.items.map((item) => {
          if (!('items' in item) || !item.items) return item
          return {
            ...item,
            items: item.items.filter((sub) => {
              if (userRole === 'admin' && (sub.title === 'Mahakrama' || sub.title === 'Import')) return false
              return true
            }),
          }
        }),
      }
    })

  return {
    ...baseSidebarData,
    navGroups: filteredNavGroups,
    user: user
      ? {
          name: user.name,
          email: user.email,
          avatar: baseSidebarData.user.avatar,
        }
      : baseSidebarData.user,
  } as SidebarData
}

export const sidebarData: SidebarData = baseSidebarData as SidebarData
