import React from 'react'
import { IconUsers, IconUsersGroup, IconCalendarEvent } from '@tabler/icons-react'

export const sidebarData = [
  {
    title: 'Persons',
    url: '/persons',
    icon: <IconUsers size={18} />,
  },
  {
    title: 'Groups',
    url: '/groups',
    icon: <IconUsersGroup size={18} />,
  },
  {
    title: 'Events',
    url: '/events',
    icon: <IconCalendarEvent size={18} />,
  },
  {
    title: 'Users',
    url: '/users',
    icon: <IconUsers size={18} />,
  },
]