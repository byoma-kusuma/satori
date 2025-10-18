import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { RegistrationsTable } from './components/registrations-table'

export default function Registrations() {
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
        <div className='mb-4'>
          <h2 className='text-2xl font-bold tracking-tight'>Registrations</h2>
          <p className='text-muted-foreground'>Manage incoming registrations, import CSVs, and convert to Persons.</p>
        </div>
        <RegistrationsTable />
      </Main>
    </>
  )
}
