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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { personEmpowermentInputSchema, PersonEmpowermentInput } from '../../person-empowerments/data/schema'
import { useCreatePersonEmpowerment, useUpdatePersonEmpowerment } from '../../person-empowerments/data/api'
import { useEffect } from 'react'

interface PersonEmpowermentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  empowerment?: any
  empowerments: any[]
  gurus: any[]
}

export function PersonEmpowermentDialog({
  open,
  onOpenChange,
  personId,
  empowerment,
  empowerments = [],
  gurus = []
}: PersonEmpowermentDialogProps) {
  const isEditing = !!empowerment
  const createMutation = useCreatePersonEmpowerment()
  const updateMutation = useUpdatePersonEmpowerment()


  const form = useForm<PersonEmpowermentInput>({
    resolver: zodResolver(personEmpowermentInputSchema),
    defaultValues: {
      person_id: personId,
      empowerment_id: '',
      guru_id: '',
      type: 'Wang',
      start_date: '',
      end_date: '',
    },
  })

  // Reset form when dialog opens/closes or empowerment changes
  useEffect(() => {
    if (open) {
      if (isEditing && empowerment) {
        form.reset({
          person_id: personId,
          empowerment_id: empowerment.empowerment_id,
          guru_id: empowerment.guru_id,
          type: empowerment.type,
          start_date: empowerment.start_date ? empowerment.start_date.split('T')[0] : '',
          end_date: empowerment.end_date ? empowerment.end_date.split('T')[0] : '',
        })
      } else {
        form.reset({
          person_id: personId,
          empowerment_id: '',
          guru_id: '',
          type: 'Wang',
          start_date: '',
          end_date: '',
        })
      }
    }
  }, [open, isEditing, empowerment, personId])

  const onSubmit = (data: PersonEmpowermentInput) => {
    const processedData: any = {
      ...data,
      start_date: new Date(data.start_date + 'T00:00:00Z').toISOString(),
    }

    // Only include end_date if it has a valid value
    if (data.end_date && data.end_date.trim() !== '') {
      processedData.end_date = new Date(data.end_date + 'T23:59:59Z').toISOString()
    } else {
      // Remove end_date from the object if it's empty
      delete processedData.end_date
    }

    if (isEditing) {
      updateMutation.mutate({
        id: empowerment.id,
        updateData: processedData
      }, {
        onSuccess: () => {
          toast({ title: 'Person empowerment updated successfully' })
          onOpenChange(false)
        },
        onError: (error) => {
          toast({ 
            title: 'Failed to update person empowerment', 
            description: String(error),
            variant: 'destructive' 
          })
        }
      })
    } else {
      createMutation.mutate(processedData, {
        onSuccess: () => {
          toast({ title: 'Person empowerment created successfully' })
          onOpenChange(false)
        },
        onError: (error) => {
          toast({ 
            title: 'Failed to create person empowerment', 
            description: String(error),
            variant: 'destructive' 
          })
        }
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Person Empowerment' : 'Add Person Empowerment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the person empowerment details.' : 'Add a new empowerment for this person.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="empowerment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empowerment</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select empowerment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empowerments.length > 0 ? (
                        empowerments.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No empowerments available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Wang">Wang</SelectItem>
                      <SelectItem value="Lung">Lung</SelectItem>
                      <SelectItem value="Tri">Tri</SelectItem>
                      <SelectItem value="Jenang">Jenang</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guru_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guru</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select guru" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gurus.length > 0 ? (
                        gurus.map((guru: any) => (
                          <SelectItem key={guru.id} value={guru.id}>
                            {guru.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          No gurus available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}