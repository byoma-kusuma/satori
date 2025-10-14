import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconLoader } from '@tabler/icons-react'
import { getUsersQueryOptions, getDeletedUsersQueryOptions } from '@/api/users'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider, { useUsers } from './context/users-context'

function UsersList() {
  const { showDeleted } = useUsers()

  // fetch user data with react query (suspense = true)
  const { data: userList } = useSuspenseQuery(
    showDeleted ? getDeletedUsersQueryOptions() : getUsersQueryOptions()
  )

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
            <h2 className='text-2xl font-bold tracking-tight'>
              {showDeleted ? 'Deleted Users' : 'User List'}
            </h2>
            <p className='text-muted-foreground'>
              {showDeleted
                ? 'View and restore deleted users here.'
                : 'Manage your users and their roles here.'}
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <UsersTable data={userList} columns={columns} />
        </div>
      </Main>
    </>
  )
}

export default function Users() {
  return (
    <UsersProvider>
      {/*
        Suspense will display a fallback until the query resolves.
        Provide an ErrorBoundary around it in the parent or near root
        for real production usage
      */}
      <Suspense
        fallback={
          <div className='flex h-screen items-center justify-center'>
            <IconLoader className='h-8 w-8 animate-spin' />
          </div>
        }
      >
        <UsersList />
      </Suspense>

      <UsersDialogs />
    </UsersProvider>
  )
}
