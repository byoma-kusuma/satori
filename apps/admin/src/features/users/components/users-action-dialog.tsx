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

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name || '',
    },
  })

  const onSubmit = () => {
    // Create/update functionality removed
    toast({ 
      title: isEdit ? 'User update functionality removed' : 'User creation functionality removed', 
      description: 'This feature has been disabled'
    })
    form.reset()
    onOpenChange(false)
    if (isEdit) {
      setCurrentRow(null)
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
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}