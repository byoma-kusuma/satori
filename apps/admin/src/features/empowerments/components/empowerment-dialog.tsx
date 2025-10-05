import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import {
  empowermentInputSchema,
  empowermentClassLabels,
  empowermentTypeOptions,
  empowermentFormOptions,
  EmpowermentInput,
} from '../data/schema'
import { useCreateEmpowerment, useUpdateEmpowerment, getEmpowermentQueryOptions } from '../data/api'
import React from 'react'

const NO_CLASS_VALUE = '__none'

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
      class: undefined,
      description: '',
      prerequisites: '',
      type: 'Sutra',
      form: 'Wang - empowerment',
      major_empowerment: false,
    },
  })

  // Reset form when empowerment data is loaded or dialog opens/closes
  React.useEffect(() => {
    if (isEditing && empowerment) {
      form.reset({
        name: empowerment.name,
        class: empowerment.class ?? undefined,
        description: empowerment.description || '',
        prerequisites: empowerment.prerequisites || '',
        type: empowerment.type ?? 'Sutra',
        form: empowerment.form ?? 'Wang - empowerment',
        major_empowerment: empowerment.major_empowerment ?? false,
      })
    } else if (!isEditing) {
      form.reset({
        name: '',
        class: undefined,
        description: '',
        prerequisites: '',
        type: 'Sutra',
        form: 'Wang - empowerment',
        major_empowerment: false,
      })
    }
  }, [empowerment, isEditing, form])

  const onSubmit = (data: EmpowermentInput) => {
    const payload: EmpowermentInput = {
      ...data,
      class: data.class && data.class.length > 0 ? data.class : undefined,
      major_empowerment: data.major_empowerment ?? false,
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: empowermentId, updateData: payload },
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
      createMutation.mutate(payload, {
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
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select type' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empowermentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
              name='form'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select form' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empowermentFormOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name='major_empowerment'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Major Empowerment</FormLabel>
                  <FormDescription>Mark this empowerment as major.</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='class'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NO_CLASS_VALUE ? undefined : value)
                    }
                    value={field.value ?? NO_CLASS_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select class' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CLASS_VALUE}>No class</SelectItem>
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
