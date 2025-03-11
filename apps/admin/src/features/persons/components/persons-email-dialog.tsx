import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Person } from '../data/schema'
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
import { Textarea } from '@/components/ui/textarea'

interface PersonsEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPersons: Person[]
}

const emailFormSchema = z.object({
  to: z.string().min(1, "Recipients are required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
})

type EmailFormValues = z.infer<typeof emailFormSchema>

export function PersonsEmailDialog({ 
  open, 
  onOpenChange, 
  selectedPersons 
}: PersonsEmailDialogProps) {
  const [isSending, setIsSending] = useState(false)
  
  // Extract email addresses from selected persons
  const emailAddresses = selectedPersons
    .filter(person => person.emailId) // Only include persons with email
    .map(person => person.emailId)
    .join(', ')
  
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: emailAddresses,
      subject: '',
      message: '',
    },
  })

  // Update 'to' field when selectedPersons changes
  useEffect(() => {
    form.setValue('to', emailAddresses)
  }, [selectedPersons, emailAddresses, form])

  const onSubmit = async (data: EmailFormValues) => {
    setIsSending(true)
    
    try {
      // In a real app, this would call an API to send the email
      // For now, we'll just simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Email sent successfully",
        description: `Email sent to ${selectedPersons.length} recipients.`,
      })
      
      // Reset form and close dialog
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Email to Selected Persons</DialogTitle>
          <DialogDescription>
            {selectedPersons.length === 0 
              ? "No persons selected. Please select at least one person with an email address."
              : `Sending email to ${selectedPersons.length} persons.`}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input {...field} disabled readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your email message here" 
                      className="h-32 resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSending || selectedPersons.length === 0}
              >
                {isSending ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}