import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconLoader } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
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
import { getCurrentUserQueryOptions } from '@/api/users'
import type { Person } from './data/schema'

function PersonsList() {
  const navigate = useNavigate()
  const { data: personList } = useSuspenseQuery(getPersonsQueryOptions())
  const { data: currentUser } = useSuspenseQuery(getCurrentUserQueryOptions())

  const isKramaInstructor = currentUser?.role === 'krama_instructor'
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'sysadmin'
  const [studentView, setStudentView] = useState<'mine' | 'all'>('mine')
  const [instructorFilter, setInstructorFilter] = useState<string | null>(null)

  // Redirect viewers to their own person edit page
  useEffect(() => {
    if (currentUser?.role === 'viewer' && currentUser.personId) {
      navigate({ to: '/persons/$personId/edit', params: { personId: currentUser.personId } })
    }
  }, [currentUser, navigate])

  const instructorOptions = useMemo(
    () =>
      (personList as Person[])
        .filter((p) => p.is_krama_instructor)
        .map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}` }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [personList]
  )

  const filteredPersonList = useMemo(() => {
    let list = personList as Person[]

    if (isKramaInstructor && studentView === 'mine') {
      if (!currentUser?.personId) return []
      list = list.filter((p) => p.krama_instructor_person_id === currentUser.personId)
    }

    if (isAdmin && instructorFilter === '__none__') {
      list = list.filter((p) => p.krama_instructor_person_id == null)
    } else if (isAdmin && instructorFilter != null) {
      list = list.filter((p) => p.krama_instructor_person_id === instructorFilter)
    }

    return list
  }, [personList, isKramaInstructor, studentView, currentUser?.personId, isAdmin, instructorFilter])

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
          <PersonsTable
            data={filteredPersonList}
            columns={columns}
            showStudentFilter={isKramaInstructor}
            studentView={studentView}
            onStudentViewChange={setStudentView}
            showInstructorFilter={isAdmin}
            instructorOptions={instructorOptions}
            instructorFilter={instructorFilter}
            onInstructorFilterChange={setInstructorFilter}
          />
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