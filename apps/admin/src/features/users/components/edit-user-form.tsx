"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
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
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IconChevronLeft } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import { userRoleEnum, userRoleLabels } from '@/types/user-roles'
import { useUpdateUserRole, getUserQueryOptions } from '@/api/users'

const userEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(userRoleEnum),
})

type UserEditForm = z.infer<typeof userEditSchema>

function EditUserForm({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const updateUserRoleMutation = useUpdateUserRole()
  
  // Fetch the user data
  const { data: user } = useSuspenseQuery(getUserQueryOptions(userId))
  
  const form = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })

  const onSubmit = (vals: UserEditForm) => {
    // For now, we only support updating the role
    updateUserRoleMutation.mutate({
      id: userId,
      updateData: { role: vals.role }
    }, {
      onSuccess: () => {
        toast({ title: 'User updated successfully' })
        navigate({ to: '/users' })
      },
      onError: (err: unknown) => {
        toast({ title: 'Update failed', description: String(err) })
      }
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Edit User</CardTitle>
        <CardDescription>
          Update the user's information and role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="user-form"
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoleEnum.map((role) => (
                          <SelectItem key={role} value={role}>
                            {userRoleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate({ to: '/users' })}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="user-form"
          disabled={updateUserRoleMutation.isPending}
        >
          Update User
        </Button>
      </CardFooter>
    </Card>
  )
}

function EditUserSkeleton() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </CardFooter>
    </Card>
  )
}

export function EditUserPage() {
  const navigate = useNavigate()
  const { userId } = useParams({ from: '/_authenticated/users/$userId/edit' })
  
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
            onClick={() => navigate({ to: '/users' })}
          >
            <IconChevronLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <h2 className='text-2xl font-bold tracking-tight'>Edit User</h2>
          <p className='text-muted-foreground'>
            Update the user's role and information.
          </p>
        </div>
        <Suspense fallback={<EditUserSkeleton />}>
          <EditUserForm userId={userId} />
        </Suspense>
      </Main>
    </>
  )
}