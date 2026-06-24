"use client"

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { User } from '../data/schema'
import { useUsers } from '../context/users-context'
import {
  AvailablePerson,
  getAvailablePersonsQueryOptions,
  useCreateUser,
  useUpdateUser,
  useUpdateUserCenterAssignments,
  useUpdateUserGroupAssignments,
} from '@/api/users'
import { getCentersQueryOptions } from '@/api/centers'
import { getGroupsQueryOptions } from '@/api/groups'
import { PersonSelect, type PersonOption } from '@/components/ui/person-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { userRoleEnum, userRoleLabels, type UserRole } from '@/types/user-roles'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(userRoleEnum).optional(),
  personId: z.string().uuid().optional(),
}).superRefine((data, ctx) => {
  if ((data.role === 'krama_instructor' || data.role === 'viewer') && !data.personId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Person link is required for Krama Instructor and Viewer roles',
      path: ['personId'],
    })
  }
})

type UserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = Boolean(currentRow)
  const { setCurrentRow } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending

  const updateCenterAssignments = useUpdateUserCenterAssignments()
  const updateGroupAssignments = useUpdateUserGroupAssignments()

  const [selectedCenterIds, setSelectedCenterIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  const { data: allCenters = [] } = useQuery({ ...getCentersQueryOptions, enabled: open })
  const { data: allGroups = [] } = useQuery({ ...getGroupsQueryOptions, enabled: open })

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name ?? '',
      email: currentRow?.email ?? '',
      password: undefined,
      role: (currentRow?.role as UserRole) ?? 'viewer',
      personId: currentRow?.personId ?? undefined,
    },
  })

  const watchPersonId = form.watch('personId')
  const watchRole = form.watch('role')

  const { data: availablePersons = [], refetch, isLoading: personsLoading } = useQuery({
    ...getAvailablePersonsQueryOptions(),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: currentRow?.name ?? '',
        email: currentRow?.email ?? '',
        password: undefined,
        role: (currentRow?.role as UserRole) ?? 'viewer',
        personId: currentRow?.personId ?? undefined,
      })
      setSelectedCenterIds([])
      setSelectedGroupIds([])
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentRow])

  const currentPersonOption = useMemo<PersonOption | null>(() => {
    if (!currentRow?.personId) return null
    return {
      id: currentRow.personId,
      firstName: currentRow.personFirstName ?? '',
      lastName: currentRow.personLastName ?? '',
      personCode: currentRow.personEmail ?? undefined,
      type: null,
      primaryPhone: null,
    }
  }, [currentRow])

  const personOptions = useMemo<PersonOption[]>(() => {
    const list: PersonOption[] = Array.isArray(availablePersons)
      ? (availablePersons as AvailablePerson[]).map((person) => ({
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName ?? '',
          personCode: person.emailId ?? undefined,
          type: null,
          primaryPhone: null,
        }))
      : []

    if (currentPersonOption && !list.some((option) => option.id === currentPersonOption.id)) {
      list.push(currentPersonOption)
    }

    return list
      .slice()
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }, [availablePersons, currentPersonOption])

  useEffect(() => {
    if (isEdit || !watchPersonId) return

    const selected = (availablePersons as AvailablePerson[]).find((person) => person.id === watchPersonId)

    if (selected) {
      form.setValue('name', `${selected.firstName} ${selected.lastName ?? ''}`.trim(), {
        shouldDirty: true,
      })
      if (selected.emailId) {
        form.setValue('email', selected.emailId, { shouldDirty: true })
      }
    }
  }, [watchPersonId, availablePersons, form, isEdit])

  const handleSubmit = (values: UserForm) => {
    if (isEdit && currentRow) {
      updateUserMutation.mutate(
        {
          id: currentRow.id,
          updateData: {
            personId: values.personId ?? null,
            role: values.role,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'User updated successfully' })
            setCurrentRow(null)
            onOpenChange(false)
          },
          onError: (error) => {
            toast({
              title: 'Failed to update user',
              description: error instanceof Error ? error.message : 'Unknown error',
              variant: 'destructive',
            })
          },
        },
      )
      return
    }

    if (!values.password || values.password.length < 8) {
      toast({
        title: 'Password required',
        description: 'Password must be at least 8 characters when creating a user.',
        variant: 'destructive',
      })
      return
    }

    createUserMutation.mutate(
      {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
        personId: values.personId ?? null,
      },
      {
        onSuccess: async (newUser) => {
          // Assign scope for center_admin / group_admin
          if (values.role === 'center_admin' && selectedCenterIds.length > 0) {
            await updateCenterAssignments.mutateAsync({ userId: newUser.id, centerIds: selectedCenterIds })
          } else if (values.role === 'group_admin' && selectedGroupIds.length > 0) {
            await updateGroupAssignments.mutateAsync({ userId: newUser.id, groupIds: selectedGroupIds })
          }
          toast({
            title: 'User created successfully',
            description: `User ${values.name} has been created with ${values.role || 'viewer'} role.`,
          })
          form.reset()
          setCurrentRow(null)
          onOpenChange(false)
        },
        onError: (error) => {
          toast({
            title: 'Failed to create user',
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          setCurrentRow(null)
          form.reset()
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Update User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Link or unlink this user to a person in the directory."
              : 'Use this form to create a new user linked to an existing person if desired.'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[32rem] overflow-y-auto py-1 pr-1'>
          <Form {...form}>
            <form id='user-form' onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4 p-0.5'>
              <FormField
                control={form.control}
                name='personId'
                render={({ field }) => {
                  const isRequired = watchRole === 'krama_instructor' || watchRole === 'viewer'
                  return (
                    <FormItem className='space-y-1'>
                      <FormLabel>
                        Link Person {isRequired ? '' : '(optional)'}
                      </FormLabel>
                      <div className='flex items-center gap-2'>
                        <div className='flex-1'>
                          <PersonSelect
                            persons={personOptions}
                            value={field.value ?? undefined}
                            onValueChange={(value) => field.onChange(value ?? undefined)}
                            placeholder={personsLoading ? 'Loading persons…' : 'Select person'}
                            disabled={personsLoading || isSubmitting}
                            emptyMessage='No available persons'
                          />
                        </div>
                        {field.value && !isRequired && (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => field.onChange(undefined)}
                            disabled={isSubmitting}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter name'
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={isEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Enter email'
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={isEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Enter password (min 8 characters)'
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting || isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select a role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(userRoleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && watchRole === 'center_admin' && (
                <div className='space-y-2'>
                  <FormLabel>Assigned Centers</FormLabel>
                  <div className='rounded-md border p-3 space-y-2'>
                    {allCenters.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>No centers available</p>
                    ) : (
                      allCenters.map((center) => (
                        <label key={center.id} className='flex items-center gap-2 cursor-pointer'>
                          <Checkbox
                            checked={selectedCenterIds.includes(center.id)}
                            onCheckedChange={(checked) =>
                              setSelectedCenterIds((prev) =>
                                checked ? [...prev, center.id] : prev.filter((id) => id !== center.id)
                              )
                            }
                          />
                          <span className='text-sm'>{center.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
              {!isEdit && watchRole === 'group_admin' && (
                <div className='space-y-2'>
                  <FormLabel>Assigned Groups</FormLabel>
                  <div className='rounded-md border p-3 space-y-2'>
                    {allGroups.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>No groups available</p>
                    ) : (
                      allGroups.map((group) => (
                        <label key={group.id} className='flex items-center gap-2 cursor-pointer'>
                          <Checkbox
                            checked={selectedGroupIds.includes(group.id)}
                            onCheckedChange={(checked) =>
                              setSelectedGroupIds((prev) =>
                                checked ? [...prev, group.id] : prev.filter((id) => id !== group.id)
                              )
                            }
                          />
                          <span className='text-sm'>{group.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form' disabled={isSubmitting}>
            {isSubmitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
