import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import * as React from 'react'
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
import { useState } from 'react'
import { useCreatePerson } from '@/api/persons'
import { useToast } from '@/hooks/use-toast'
import { personTypeLabels } from '@/features/persons/data/schema'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const createPersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.union([
    z.string().min(1),
    z.string().length(0)
  ]).optional(),
  emailId: z.union([
    z.string().email(),
    z.string().length(0)
  ]).optional(),
  phoneNumber: z.string().optional(),
  center: z.enum(['Nepal', 'USA', 'Australia', 'UK']),
  type: z.enum(['interested', 'contact', 'sangha_member']),
})

type CreatePersonFormValues = z.infer<typeof createPersonSchema>

type CreatePersonDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: (createdPerson: { id: string; firstName: string; lastName: string }) => void
  initialName?: string // Name from the creatable select
}

export function CreatePersonDialog({ open, onClose, onSuccess, initialName = '' }: CreatePersonDialogProps) {
  const { toast } = useToast()
  const createPersonMutation = useCreatePerson()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Parse the initial name into first and last name
  const getNameParts = (fullName: string): { firstName: string, lastName: string } => {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' }
    } else {
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ')
      return { firstName, lastName }
    }
  }
  
  const { firstName: parsedFirstName, lastName: parsedLastName } = getNameParts(initialName)
  
  const defaultValues = {
    firstName: parsedFirstName,
    lastName: parsedLastName,
    address: '',
    emailId: '',
    phoneNumber: '',
    center: 'Nepal',
    type: 'interested',
  }
  
  const form = useForm<CreatePersonFormValues>({
    resolver: zodResolver(createPersonSchema),
    defaultValues,
  })
  
  // Update form values when initialName changes
  React.useEffect(() => {
    if (open && initialName) {
      const { firstName, lastName } = getNameParts(initialName)
      form.setValue('firstName', firstName)
      form.setValue('lastName', lastName)
    }
  }, [form, initialName, open])

  const onSubmit = async (values: CreatePersonFormValues) => {
    setIsSubmitting(true)
    try {
      // Ensure empty fields are sent as null or undefined
      const emailId = values.emailId === '' ? undefined : values.emailId
      const address = values.address === '' ? undefined : values.address
      
      const response = await createPersonMutation.mutateAsync({
        ...values,
        emailId,
        address,
        yearOfBirth: undefined,
        photo: undefined,
        gender: undefined,
        refugee: false,
      })
      
      toast({
        title: 'Success',
        description: 'Person created successfully',
      })
      
      // Pass the created person back to the parent component
      onSuccess({
        id: response.id,
        firstName: response.firstName,
        lastName: response.lastName,
      })
      
      form.reset()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to create person. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Person</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Address
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emailId"
                render={({ field }) => (
                  <FormItem>
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
                  <FormItem>
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
                          className="phone-input h-10 w-full"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="center"
                render={({ field }) => (
                  <FormItem>
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
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                Create Person
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
