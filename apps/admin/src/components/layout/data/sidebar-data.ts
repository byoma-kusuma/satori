import {
  IconBrowserCheck,
  IconCalendar,
  IconHelp,
  IconLayoutDashboard,
  IconNotification,
  IconPalette,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'
import { type User } from '@/hooks/use-auth'

const baseSidebarData = {
  user: {
    name: 'Byoma Kusuma',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/byoma-kusuma.jpg',
  },
  teams: [
    {
      name: 'Byoma Kusuma',
      logo: Command,
      plan: 'Vite + Byoma Kusuma UI',
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
          title: 'Users',
          url: '/users',
          icon: IconUsers,
        },
        {
          title: 'Persons',
          url: '/persons',
          icon: IconUsers,
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
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: IconBrowserCheck,
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

export const getSidebarData = (user: User | null): SidebarData => ({
  ...baseSidebarData,
  user: user ? {
    name: user.name,
    email: user.email,
    avatar: baseSidebarData.user.avatar
  } : baseSidebarData.user
} as SidebarData)

export const sidebarData: SidebarData = baseSidebarData as SidebarData