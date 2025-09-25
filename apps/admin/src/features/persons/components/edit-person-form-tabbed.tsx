"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { personInputSchema } from '../data/schema'
import { useUpdatePerson, getPersonQueryOptions, getKramaInstructorsQueryOptions } from '../data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IconChevronLeft } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import React from 'react'
import { GeneralInfoTab } from './general-info-tab'
import { EmpowermentsTab } from './empowerments-tab'

type PersonForm = z.infer<typeof personInputSchema>

function EditPersonForm({ personId }: { personId: string }) {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const updatePersonMutation = useUpdatePerson()
  
  // Fetch the person data
  const { data: person } = useSuspenseQuery(getPersonQueryOptions(personId))
  
  const form = useForm<PersonForm>({
    resolver: zodResolver(personInputSchema),
    defaultValues: {
      firstName: person.firstName,
      middleName: person.middleName || undefined,
      lastName: person.lastName,
      address: person.address,
      emailId: person.emailId || undefined,
      primaryPhone: person.primaryPhone || undefined,
      secondaryPhone: person.secondaryPhone || undefined,
      yearOfBirth: person.yearOfBirth || undefined,
      photo: person.photo || undefined,
      gender: person.gender || undefined,
      center: person.center,
      type: person.type,
      country: person.country || undefined,
      nationality: person.nationality || undefined,
      languagePreference: person.languagePreference || undefined,
      occupation: person.occupation || undefined,
      notes: person.notes || undefined,
      refugeName: person.refugeName || undefined,
      yearOfRefuge: person.yearOfRefuge || undefined,
      title: person.title || undefined,
      membershipType: person.membershipType || undefined,
      hasMembershipCard: person.hasMembershipCard || undefined,
      membershipCardNumber: person.membershipCardNumber || undefined,
      emergencyContactName: person.emergencyContactName || undefined,
      emergencyContactRelationship: person.emergencyContactRelationship || undefined,
      emergencyContactPhone: person.emergencyContactPhone || undefined,
      yearOfRefugeCalendarType: person.yearOfRefugeCalendarType || 'AD',
      is_krama_instructor: person.is_krama_instructor || false,
      krama_instructor_person_id: person.krama_instructor_person_id || undefined,
      referredBy: person.referredBy || undefined,
    },
  })

  const personType = form.watch('type')

  const onSubmit = (vals: PersonForm) => {
    const processedVals: any = {
      firstName: vals.firstName,
      middleName: vals.middleName || null,
      lastName: vals.lastName,
      address: vals.address,
      center: vals.center,
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
      krama_instructor_person_id: vals.krama_instructor_person_id === "none" ? null : vals.krama_instructor_person_id || null,
      referredBy: vals.referredBy || null,
    };
    
    // Handle photo field
    if (vals.photo && vals.photo !== '' && vals.photo.startsWith('data:')) {
      processedVals.photo = vals.photo;
    } else if (person.photo && (!vals.photo || vals.photo === '')) {
      processedVals.photo = null;
    }

    updatePersonMutation.mutate({
      id: personId,
      updateData: processedVals
    }, {
      onSuccess: (data) => {
        console.log('Update success:', data)
        toast({ title: 'Person updated successfully' })
        navigate({ to: '/persons' })
      },
      onError: (err: unknown) => {
        console.error('Update error:', err)
        toast({ title: 'Update failed', description: String(err), variant: 'destructive' })
      }
    })
  }

  return (
    <Card className="w-full">
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="empowerments" disabled={personType !== 'sangha_member'}>
              Empowerments
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <GeneralInfoTab 
              form={form} 
              person={person} 
              formRef={formRef}
              onSubmit={onSubmit}
            />
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => navigate({ to: '/persons' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="person-form"
                disabled={updatePersonMutation.isPending}
              >
                Update Person
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="empowerments" className="mt-6">
            <EmpowermentsTab personId={personId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function EditPersonSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  )
}

function EditPersonHeader({ personId }: { personId: string }) {
  const { data: person } = useSuspenseQuery(getPersonQueryOptions(personId))
  const navigate = useNavigate()

  return (
    <div className='mb-6'>
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => navigate({ to: '/persons' })}
      >
        <IconChevronLeft className="mr-2 h-4 w-4" /> Back to Person List
      </Button>
      <div className='flex items-center gap-2'>
         <h3 className='text-2xl font-bold tracking-tight'>
          Edit Person -
        </h3>
        <span className='text-lg font-medium text-muted-foreground'>{person.firstName} {person.lastName} -</span>
       
        {person.personCode && (
          <span className='text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded'>
            {person.personCode}
          </span>
        )}
      </div>
      <p className='text-muted-foreground'>
        Update the person's information.
      </p>
    </div>
  )
}

export function EditPersonPage() {
  const navigate = useNavigate()
  const { personId } = useParams({ from: '/_authenticated/persons/$personId/edit' })

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
        <Suspense fallback={<EditPersonSkeleton />}>
          <EditPersonHeader personId={personId} />
          <EditPersonForm personId={personId} />
        </Suspense>
      </Main>
    </>
  )
}