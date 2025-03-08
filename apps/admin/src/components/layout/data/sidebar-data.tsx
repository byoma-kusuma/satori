import React from 'react'
import { IconHome, IconSettings, IconUsers, IconUsersGroup } from '@tabler/icons-react'

export const sidebarData = [
  {
    title: 'Dashboard',
    url: '/',
    icon: <IconHome size={18} />,
  },
  {
    title: 'Users',
    url: '/users',
    icon: <IconUsers size={18} />,
  },
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
]