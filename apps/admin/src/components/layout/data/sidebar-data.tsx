import React from 'react'
import { IconUsers, IconUsersGroup, IconCalendarEvent, IconCertificate, IconUser } from '@tabler/icons-react'
import { IconClipboardList } from '@tabler/icons-react'

export const sidebarData = [
  {
    title: 'Persons',
    url: '/persons',
    icon: IconUsers,
  },
  {
    title: 'Registrations',
    url: '/registrations',
    icon: IconClipboardList,
  },
  {
    title: 'Groups',
    url: '/groups',
    icon: IconUsersGroup,
  },
  {
    title: 'Events',
    url: '/events',
    icon: IconCalendarEvent,
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
]
export type UserRole = 'sysadmin' | 'admin' | 'krama_instructor' | 'viewer'
export type User = { id: string }
export type SidebarData = { user: { name: string; email: string }; teams: any[]; navGroups: { title: string; items: { title: string; url: string; icon: React.ReactNode }[] }[] }
export const getSidebarData = (user: User | null, userRole: UserRole | null): SidebarData => {
  return {
    user: { name: 'User', email: '' },
    teams: [],
    navGroups: [
      {
        title: 'Main',
        items: sidebarData,
      },
    ],
  }
}

