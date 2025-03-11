"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Person, personInputSchema } from '../data/schema'
import { usePersons } from '../context/persons-context'
import { useCreatePerson, useUpdatePerson } from '../data/api'

type PersonForm = z.infer<typeof personInputSchema>

interface Props {
  currentRow?: Person
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonsActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const { setCurrentRow } = usePersons()
  const formRef = useRef<HTMLFormElement>(null)
  
  const createPersonMutation = useCreatePerson()
  const updatePersonMutation = useUpdatePerson()
  
  // Handle keyboard focus to prevent dialog selection during form navigation
  useEffect(() => {
    if (open && formRef.current) {
      // Focus the first input when dialog opens
      const firstInput = formRef.current.querySelector('input, select, textarea') as HTMLElement
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    }
  }, [open])

  const form = useForm<PersonForm>({
    resolver: zodResolver(personInputSchema),
    defaultValues: currentRow ? {
      firstName: currentRow.firstName,
      lastName: currentRow.lastName,
      address: currentRow.address,
      emailId: currentRow.emailId || undefined,
      phoneNumber: currentRow.phoneNumber || undefined,
      yearOfBirth: currentRow.yearOfBirth || undefined,
      photo: currentRow.photo || undefined,
      gender: currentRow.gender || undefined,
      refugee: currentRow.refugee,
      center: currentRow.center,
    } : {
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
    },
  })

  const onSubmit = (vals: PersonForm) => {
    if (isEdit && currentRow) {
      updatePersonMutation.mutate({
        id: currentRow.id,
        updateData: vals
      }, {
        onSuccess: () => {
          toast({ title: 'Person updated successfully' })
          form.reset()
          onOpenChange(false)
          setCurrentRow(null)
        },
        onError: (err: unknown) => {
          toast({ title: 'Update failed', description: String(err) })
        }
      })
    } else {
      createPersonMutation.mutate(vals, {
        onSuccess: () => {
          toast({ title: 'Person created successfully' })
          form.reset()
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          toast({ title: 'Creation failed', description: String(err) })
        }
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
          if (isEdit) setCurrentRow(null)
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>{isEdit ? 'Update Person' : 'Create Person'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Use this form to update the person's information."
              : "Use this form to create a new person."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mr-4 h-[26.25rem] w-full py-1 pr-4">
          <Form {...form}>
            <form
              id="person-form"
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-0.5"
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
        </ScrollArea>
        <DialogFooter>
          <Button
            type="submit"
            form="person-form"
            disabled={createPersonMutation.isPending || updatePersonMutation.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}