import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { empowermentInputSchema, empowermentClassLabels, EmpowermentInput } from '../data/schema'
import { useCreateEmpowerment, useUpdateEmpowerment, getEmpowermentQueryOptions } from '../data/api'
import React from 'react'

interface EmpowermentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  empowermentId?: string | null
}

export function EmpowermentDialog({ open, onOpenChange, empowermentId }: EmpowermentDialogProps) {
  const isEditing = !!empowermentId
  
  const { data: empowerment } = useQuery({
    ...getEmpowermentQueryOptions(empowermentId!),
    enabled: isEditing,
  })

  const createMutation = useCreateEmpowerment()
  const updateMutation = useUpdateEmpowerment()

  const form = useForm<EmpowermentInput>({
    resolver: zodResolver(empowermentInputSchema),
    defaultValues: {
      name: '',
      class: 'Kriyā Tantra',
      description: '',
      prerequisites: '',
    },
  })

  // Reset form when empowerment data is loaded or dialog opens/closes
  React.useEffect(() => {
    if (isEditing && empowerment) {
      form.reset({
        name: empowerment.name,
        class: empowerment.class,
        description: empowerment.description || '',
        prerequisites: empowerment.prerequisites || '',
      })
    } else if (!isEditing) {
      form.reset({
        name: '',
        class: 'Kriyā Tantra',
        description: '',
        prerequisites: '',
      })
    }
  }, [empowerment, isEditing, form])

  const onSubmit = (data: EmpowermentInput) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: empowermentId, updateData: data },
        {
          onSuccess: () => {
            toast({ title: 'Empowerment updated successfully' })
            onOpenChange(false)
          },
          onError: () => {
            toast({ title: 'Failed to update empowerment', variant: 'destructive' })
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast({ title: 'Empowerment created successfully' })
          onOpenChange(false)
        },
        onError: () => {
          toast({ title: 'Failed to create empowerment', variant: 'destructive' })
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Empowerment' : 'Create Empowerment'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter empowerment name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(empowermentClassLabels).map(([value, label]) => (
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prerequisites"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prerequisites</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter prerequisites"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}