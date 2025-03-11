"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
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
import { personInputSchema, personTypeLabels } from '../data/schema'
import { useCreatePerson } from '../data/api'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IconChevronLeft } from '@tabler/icons-react'

type PersonForm = z.infer<typeof personInputSchema>

export function CreatePersonPage() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const createPersonMutation = useCreatePerson()

  const form = useForm<PersonForm>({
    resolver: zodResolver(personInputSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      address: '',
      emailId: undefined,
      phoneNumber: undefined,
      yearOfBirth: undefined,
      photo: undefined,
      gender: undefined,
      refugee: false,
      center: 'Nepal',
      type: 'interested',
    },
  })

  const onSubmit = (vals: PersonForm) => {
    createPersonMutation.mutate(vals, {
      onSuccess: () => {
        toast({ title: 'Person created successfully' })
        form.reset()
        navigate({ to: '/persons' })
      },
      onError: (err: unknown) => {
        toast({ title: 'Creation failed', description: String(err) })
      }
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
          <Button 
            variant="outline" 
            className="mb-4" 
            onClick={() => navigate({ to: '/persons' })}
          >
            <IconChevronLeft className="mr-2 h-4 w-4" /> Back to Person List
          </Button>
          <h2 className='text-2xl font-bold tracking-tight'>Create Person</h2>
          <p className='text-muted-foreground'>
            Add a new person to the database.
          </p>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Person</CardTitle>
            <CardDescription>
              Enter the information for the new person.
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
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
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
                          type="number"
                          placeholder="Enter year of birth"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Photo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter photo URL" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="refugee"
                  render={({ field }) => (
                    <FormItem className="space-y-1 flex flex-row items-start space-x-3 space-y-0">
                      <FormLabel>Refugee</FormLabel>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              disabled={createPersonMutation.isPending}
            >
              Create Person
            </Button>
          </CardFooter>
        </Card>
      </Main>
    </>
  )
}