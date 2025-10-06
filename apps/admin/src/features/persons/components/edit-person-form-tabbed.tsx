"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { personInputSchema } from '../data/schema'
import { useUpdatePerson, getPersonQueryOptions } from '../data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IconChevronLeft, IconUserCircle, IconUsers, IconSparkles, IconCalendarPlus, IconUsersGroup } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import { GeneralInfoTab } from './general-info-tab'
import { EmpowermentsTab } from './empowerments-tab'
import { FamilyRelationshipsTab } from './family-relationships-tab'
import { PersonsAddToEventsDialog } from './persons-add-to-events-dialog'
import { PersonsAddToGroupsDialog } from './persons-add-to-groups-dialog'

type PersonForm = z.infer<typeof personInputSchema>

function EditPersonForm({ personId }: { personId: string }) {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const updatePersonMutation = useUpdatePerson()
  const [addToEventsOpen, setAddToEventsOpen] = useState(false)
  const [addToGroupsOpen, setAddToGroupsOpen] = useState(false)
  
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
      centerId: person.center_id || undefined,
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
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddToGroupsOpen(true)}
            className="space-x-1"
          >
            <IconUsersGroup className="h-4 w-4" />
            <span>Add to Group</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setAddToEventsOpen(true)}
            className="space-x-1"
          >
            <IconCalendarPlus className="h-4 w-4" />
            <span>Add to Event</span>
          </Button>
        </div>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6 flex w-full items-center justify-start gap-2 rounded-2xl bg-muted/60 p-2 shadow-sm">
            <TabsTrigger
              value="general"
              className="group flex flex-1 items-center gap-2 rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground focus-visible:ring-offset-0 ring-2 ring-inset ring-primary data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:ring-primary data-[state=active]:shadow-md sm:flex-none"
            >
              <IconUserCircle className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-data-[state=active]:text-primary" />
              <span>General Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="relationships"
              className="group flex flex-1 items-center gap-2 rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground focus-visible:ring-offset-0 ring-2 ring-inset ring-primary data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:ring-primary data-[state=active]:shadow-md sm:flex-none"
            >
              <IconUsers className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-data-[state=active]:text-primary" />
              <span>Family / Relationships</span>
            </TabsTrigger>
            <TabsTrigger
              value="empowerments"
              disabled={personType !== 'sangha_member'}
              className="group flex flex-1 items-center gap-2 rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground focus-visible:ring-offset-0 ring-2 ring-inset ring-primary data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:ring-primary data-[state=active]:shadow-md disabled:opacity-60 sm:flex-none"
            >
              <IconSparkles className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-data-[state=active]:text-primary" />
              <span>Empowerments</span>
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

          <TabsContent value="relationships" className="mt-6">
            <FamilyRelationshipsTab personId={personId} />
          </TabsContent>

          <TabsContent value="empowerments" className="mt-6">
            <EmpowermentsTab personId={personId} />
          </TabsContent>
        </Tabs>
        <PersonsAddToEventsDialog
          open={addToEventsOpen}
          onOpenChange={setAddToEventsOpen}
          personIds={[personId]}
        />
        <PersonsAddToGroupsDialog
          open={addToGroupsOpen}
          onOpenChange={setAddToGroupsOpen}
          personIds={[personId]}
        />
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
