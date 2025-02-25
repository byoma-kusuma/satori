"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
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
import { User } from '../data/schema'
import { useUsers } from '../context/users-context'
import { useCreateUser, useUpdateUser } from '@/api/users'

// Admin user update schema
const formSchema = z.object({
  name: z.string().nonempty("Name is required."),
})

type UserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const { setCurrentRow } = useUsers()

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name || '',
    },
  })

  const onSubmit = (vals: UserForm) => {
    if (isEdit && currentRow) {
      updateUserMutation.mutate(
        { id: currentRow.id, userData: vals },
        {
          onSuccess: () => {
            toast({ title: 'User updated successfully' })
            form.reset()
            onOpenChange(false)
            setCurrentRow(null)
          },
          onError: (err: unknown) => {
            toast({ title: 'Update failed', description: String(err) })
          },
        }
      )
    } else {
      createUserMutation.mutate(vals, {
        onSuccess: () => {
          toast({ title: 'User created successfully' })
          form.reset()
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          toast({ title: 'Creation failed', description: String(err) })
        },
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
          setCurrentRow(null)
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>{isEdit ? 'Update User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Use this form to update the user's information."
              : "Use this form to create a new user."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mr-4 h-[26.25rem] w-full py-1 pr-4">
          <Form {...form}>
            <form
              id="user-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-0.5"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
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
            form="user-form"
            disabled={updateUserMutation.isPending}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}