"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { personInputSchema } from '../data/schema'
import { useCreatePerson } from '../data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { GeneralInfoTab } from './general-info-tab'

type PersonForm = z.infer<typeof personInputSchema>

export function CreatePersonPage() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const createPersonMutation = useCreatePerson()

  const form = useForm<PersonForm>({
    resolver: zodResolver(personInputSchema),
    defaultValues: {
      firstName: '',
      middleName: undefined,
      lastName: '',
      address: '',
      emailId: undefined,
      primaryPhone: undefined,
      secondaryPhone: undefined,
      yearOfBirth: undefined,
      photo: undefined,
      gender: undefined,
      centerId: undefined,
      type: 'interested',
      country: undefined,
      nationality: undefined,
      languagePreference: undefined,
      occupation: undefined,
      notes: undefined,
      refugeName: undefined,
      yearOfRefuge: undefined,
      title: undefined,
      membershipType: undefined,
      hasMembershipCard: undefined,
      membershipCardNumber: undefined,
      emergencyContactName: undefined,
      emergencyContactRelationship: undefined,
      emergencyContactPhone: undefined,
      yearOfRefugeCalendarType: 'AD',
      is_krama_instructor: false,
      krama_instructor_person_id: undefined,
      referredBy: undefined,
    },
  })

  const onSubmit = (vals: PersonForm) => {
    const processedVals: any = {
      firstName: vals.firstName,
      middleName: vals.middleName || null,
      lastName: vals.lastName,
      address: vals.address,
      centerId: vals.centerId === undefined || vals.centerId === '' ? null : vals.centerId,
      type: vals.type,
      emailId: vals.emailId || null,
      primaryPhone: vals.primaryPhone || null,
      secondaryPhone: vals.secondaryPhone || null,
      yearOfBirth: vals.yearOfBirth || null,
      gender: vals.gender || null,
      country: vals.country || null,
      nationality: vals.nationality || null,
      languagePreference: vals.languagePreference || null,
      occupation: vals.occupation || null,
      notes: vals.notes || null,
      refugeName: vals.refugeName || null,
      yearOfRefuge: vals.yearOfRefuge || null,
      title: vals.title || null,
      membershipType: vals.membershipType || null,
      hasMembershipCard: vals.hasMembershipCard || null,
      membershipCardNumber: vals.membershipCardNumber || null,
      emergencyContactName: vals.emergencyContactName || null,
      emergencyContactRelationship: vals.emergencyContactRelationship || null,
      emergencyContactPhone: vals.emergencyContactPhone || null,
      yearOfRefugeCalendarType: vals.yearOfRefugeCalendarType || null,
      is_krama_instructor: vals.is_krama_instructor || false,
      krama_instructor_person_id: vals.krama_instructor_person_id === 'none' ? null : vals.krama_instructor_person_id || null,
      referredBy: vals.referredBy || null,
    }

    createPersonMutation.mutate(processedVals, {
      onSuccess: () => {
        toast({ title: 'Person created successfully' })
        form.reset()
        navigate({ to: '/persons' })
      },
      onError: (err: unknown) => {
        toast({ title: 'Creation failed', description: String(err), variant: 'destructive' })
      },
    })
  }

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
          <h2 className='text-2xl font-bold tracking-tight'>Create Person</h2>
          <p className='text-muted-foreground'>Add a new person to the database.</p>
        </div>
        <Card className='w-full'>
          <CardHeader>
            <CardTitle>Create Person</CardTitle>
            <CardDescription>Enter the information for the new person.</CardDescription>
          </CardHeader>
          <CardContent>
            <GeneralInfoTab
              form={form}
              person={{ hasMajorEmpowerment: false, membershipCardNumber: null, country: undefined }}
              formRef={formRef}
              onSubmit={onSubmit}
            />
            <div className='flex justify-end gap-2 mt-6 pt-6 border-t'>
              <Button variant='outline' onClick={() => navigate({ to: '/persons' })}>Cancel</Button>
              <Button type='submit' form='person-form' disabled={createPersonMutation.isPending}>
                {createPersonMutation.isPending ? 'Creating...' : 'Create Person'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}

