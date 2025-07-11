"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { personInputSchema, personTypeLabels, titleLabels } from '../data/schema'
import { useUpdatePerson, getPersonQueryOptions } from '../data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IconChevronLeft } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

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
      lastName: person.lastName,
      address: person.address,
      emailId: person.emailId || undefined,
      phoneNumber: person.phoneNumber || undefined,
      yearOfBirth: person.yearOfBirth || undefined,
      photo: person.photo || undefined,
      gender: person.gender || undefined,
      refugee: person.refugee,
      center: person.center,
      type: person.type,
      country: person.country || undefined,
      nationality: person.nationality || undefined,
      languagePreference: person.languagePreference || undefined,
      refugeName: person.refugeName || undefined,
      yearOfRefuge: person.yearOfRefuge || undefined,
      title: person.title || undefined,
      membershipStatus: person.membershipStatus || undefined,
      hasMembershipCard: person.hasMembershipCard || undefined,
    },
  })

  const personType = form.watch('type')
  
  useEffect(() => {
    if (personType === 'sangha_member') {
      form.setValue('refugee', true)
    }
  }, [personType, form])

  const onSubmit = (vals: PersonForm) => {
    updatePersonMutation.mutate({
      id: personId,
      updateData: vals
    }, {
      onSuccess: () => {
        toast({ title: 'Person updated successfully' })
        navigate({ to: '/persons' })
      },
      onError: (err: unknown) => {
        toast({ title: 'Update failed', description: String(err) })
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Person</CardTitle>
        <CardDescription>
          Update the person's information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="person-form"
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Person Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="interested">{personTypeLabels.interested}</SelectItem>
                        <SelectItem value="contact">{personTypeLabels.contact}</SelectItem>
                        <SelectItem value="sangha_member">{personTypeLabels.sangha_member}</SelectItem>
                        <SelectItem value="new_inquiry">{personTypeLabels.new_inquiry}</SelectItem>
                        <SelectItem value="attended_orientation">{personTypeLabels.attended_orientation}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="center"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Center</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nepal">Nepal</SelectItem>
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value as string | undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearOfBirth"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Year of Birth</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter year of birth"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value ? parseInt(value) : undefined)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailId"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <PhoneInput
                          international
                          countryCallingCodeEditable={true}
                          defaultCountry="NP"
                          placeholder="Enter phone number"
                          value={field.value || ''}
                          onChange={(value) => field.onChange(value || '')}
                          className="h-10 w-full"
                          inputClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="refugee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Has Refuge Taken
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter nationality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="languagePreference"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Language Preference</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter language preference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch('type') === 'sangha_member' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Sangha Member Information</h3>
                </div>
                <FormField
                  control={form.control}
                  name="refugeName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Refuge Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter refuge name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="yearOfRefuge"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Year of Refuge</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter year of refuge"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value ? parseInt(value) : undefined)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Title</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value as string | undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dharma_dhar">{titleLabels.dharma_dhar}</SelectItem>
                          <SelectItem value="sahayak_dharmacharya">{titleLabels.sahayak_dharmacharya}</SelectItem>
                          <SelectItem value="sahayak_samathacharya">{titleLabels.sahayak_samathacharya}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="membershipStatus"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Membership Status</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter membership status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasMembershipCard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Do you have a membership card?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
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
      </CardFooter>
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
        <div className='mb-6'>
          <Button 
            variant="outline" 
            className="mb-4" 
            onClick={() => navigate({ to: '/persons' })}
          >
            <IconChevronLeft className="mr-2 h-4 w-4" /> Back to Person List
          </Button>
          <h2 className='text-2xl font-bold tracking-tight'>Edit Person</h2>
          <p className='text-muted-foreground'>
            Update the person's information.
          </p>
        </div>
        <Suspense fallback={<EditPersonSkeleton />}>
          <EditPersonForm personId={personId} />
        </Suspense>
      </Main>
    </>
  )
}