import {
  IconBuilding,
  IconCalendar,
  IconHelp,
  IconPalette,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconCertificate,
  IconUser,
  IconTimeline,
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

export const getSidebarData = (user: User | null, userRole: UserRole | null): SidebarData => {
  // Filter nav items based on user role
  const filteredNavGroups = baseSidebarData.navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Hide Users menu item for non-sysadmin users
      if (item.title === 'Users' && userRole !== 'sysadmin') {
        return false
      }
      return true
    })
  }))

  return {
    ...baseSidebarData,
    navGroups: filteredNavGroups,
    user: user ? {
      name: user.name,
      email: user.email,
      avatar: baseSidebarData.user.avatar
    } : baseSidebarData.user
  } as SidebarData
}

export const sidebarData: SidebarData = baseSidebarData as SidebarData
