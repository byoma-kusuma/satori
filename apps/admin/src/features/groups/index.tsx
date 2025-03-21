import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getGroupsQueryOptions } from './data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/groups-columns'
import { GroupsDialogs } from './components/groups-dialogs'
import { GroupsPrimaryButtons } from './components/groups-primary-buttons'
import { GroupsTable } from './components/groups-table'
import GroupsProvider from './context/groups-context'

function GroupsList() {
  const { data: groupList } = useSuspenseQuery(getGroupsQueryOptions)

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Group List</h2>
            <p className='text-muted-foreground'>
              Manage your groups here.
            </p>
          </div>
          <GroupsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <GroupsTable data={groupList} columns={columns} />
        </div>
      </Main>
    </>
  )
}

export default function Groups() {
  return (
    <GroupsProvider>
      <Suspense
        fallback={<div className='p-4 text-center'>Loading groups...</div>}
      >
        <GroupsList />
      </Suspense>
      <GroupsDialogs />
    </GroupsProvider>
  )
}