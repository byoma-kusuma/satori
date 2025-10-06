import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconLoader } from '@tabler/icons-react'
import { getPersonsQueryOptions } from './data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/persons-columns'
import { PersonsDialogs } from './components/persons-dialogs'
import { PersonsPrimaryButtons } from './components/persons-primary-buttons'
import { PersonsTable } from './components/persons-table'
import PersonsProvider from './context/persons-context'

function PersonsList() {
  const { data: personList } = useSuspenseQuery(getPersonsQueryOptions())

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
            <h2 className='text-2xl font-bold tracking-tight'>Persons</h2>
            <p className='text-muted-foreground'>
              Manage your persons here.
            </p>
          </div>
          <PersonsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <PersonsTable data={personList} columns={columns} />
        </div>
      </Main>
    </>
  )
}

export default function Persons() {
  return (
    <PersonsProvider>
      <Suspense
        fallback={
          <div className='flex h-screen items-center justify-center'>
            <IconLoader className='h-8 w-8 animate-spin' />
          </div>
        }
      >
        <PersonsList />
      </Suspense>
      <PersonsDialogs />
    </PersonsProvider>
  )
}