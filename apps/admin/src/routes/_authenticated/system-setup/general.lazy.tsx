import { createLazyFileRoute } from '@tanstack/react-router'
import { GeneralSettingsPage } from '@/features/settings/general'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export const Route = createLazyFileRoute('/_authenticated/system-setup/general')({
  component: GeneralSettings,
})

function GeneralSettings() {
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
        <div className='mb-6'>
          <h2 className='text-2xl font-bold tracking-tight'>General Settings</h2>
          <p className='text-muted-foreground'>Configure general application settings.</p>
        </div>
        <GeneralSettingsPage />
      </Main>
    </>
  )
}
