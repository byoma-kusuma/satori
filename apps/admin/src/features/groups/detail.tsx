import { useMemo, useState, Suspense } from 'react'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Mail } from 'lucide-react'
import { format } from 'date-fns'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useToast } from '@/hooks/use-toast'
import {
  getGroupQueryOptions,
  getGroupMembersQueryOptions,
  useBulkAddPersonsToGroups,
  useRemovePersonFromGroup,
  useSendGroupEmail,
} from '@/api/groups'
import { getPersonsQueryOptions } from '@/api/persons'

type GroupMember = {
  id: string
  firstName: string
  lastName: string
  joinedAt: Date | null
  addedBy: string
  addedByName: string | null
}

function AssignMemberDialog({
  groupId,
  assignedPersonIds,
  open,
  onOpenChange,
}: {
  groupId: string
  assignedPersonIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: persons = [], isLoading } = useQuery({
    ...getPersonsQueryOptions(),
    enabled: open,
  })

  const bulkAddMutation = useBulkAddPersonsToGroups()

  const eligiblePersons = useMemo(
    () => (persons as { id: string; firstName: string; lastName: string; center: string }[]).filter(
      (p) => !assignedPersonIds.includes(p.id)
    ),
    [persons, assignedPersonIds]
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    if (!selectedIds.size) return
    bulkAddMutation.mutate(
      { groupIds: [groupId], personIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          toast({ description: `${selectedIds.size} member${selectedIds.size > 1 ? 's' : ''} added.` })
          setSelectedIds(new Set())
          onOpenChange(false)
        },
        onError: (error: Error) => {
          toast({ description: error.message, variant: 'destructive' })
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedIds(new Set())
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className='py-4 text-center text-sm text-muted-foreground'>Loading persons…</p>
        ) : (
          <Command className='rounded-md border'>
            <CommandInput placeholder='Search person…' />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className='h-64'>
                  {eligiblePersons.map((person) => {
                    const checked = selectedIds.has(person.id)
                    return (
                      <CommandItem
                        key={person.id}
                        value={`${person.firstName} ${person.lastName}`}
                        onSelect={() => toggle(person.id)}
                        className='flex items-center gap-2'
                      >
                        <Checkbox checked={checked} className='pointer-events-none' />
                        <span>
                          {person.firstName} {person.lastName}
                          {person.center ? ` — ${person.center}` : ''}
                        </span>
                      </CommandItem>
                    )
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
        <DialogFooter className='items-center'>
          {selectedIds.size > 0 && (
            <span className='mr-auto text-sm text-muted-foreground'>
              {selectedIds.size} selected
            </span>
          )}
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedIds.size || bulkAddMutation.isPending}>
            {bulkAddMutation.isPending ? 'Adding…' : 'Add members'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RemoveMemberDialog({
  groupId,
  member,
  open,
  onOpenChange,
}: {
  groupId: string
  member: GroupMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const removeMutation = useRemovePersonFromGroup()

  const handleConfirm = () => {
    if (!member) return
    removeMutation.mutate(
      { groupId, personId: member.id },
      {
        onSuccess: () => {
          toast({ description: 'Person removed from group.' })
          onOpenChange(false)
        },
        onError: (error: Error) => {
          toast({ description: error.message, variant: 'destructive' })
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove{' '}
            {member ? `${member.firstName} ${member.lastName}` : 'this person'} from the group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={removeMutation.isPending}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SendEmailDialog({
  groupId,
  memberCount,
  open,
  onOpenChange,
}: {
  groupId: string
  memberCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const sendMutation = useSendGroupEmail()

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return
    sendMutation.mutate(
      { groupId, subject: subject.trim(), message: message.trim() },
      {
        onSuccess: ({ sent, skipped, failed }) => {
          toast({
            description: `Email sent to ${sent} member${sent !== 1 ? 's' : ''}${skipped ? `, ${skipped} skipped (no email)` : ''}${failed ? `, ${failed} failed` : ''}.`,
          })
          setSubject('')
          setMessage('')
          onOpenChange(false)
        },
        onError: (error: Error) => {
          toast({ description: error.message, variant: 'destructive' })
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) { setSubject(''); setMessage('') }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Email group</DialogTitle>
        </DialogHeader>
        <p className='text-sm text-muted-foreground'>
          Send an email to all {memberCount} member{memberCount !== 1 ? 's' : ''} in this group who have an email address on file.
        </p>
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='email-subject'>Subject</Label>
            <Input
              id='email-subject'
              placeholder='Email subject…'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='email-message'>Message</Label>
            <Textarea
              id='email-message'
              placeholder='Write your message here…'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!subject.trim() || !message.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? 'Sending…' : 'Send email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GroupDetailContent({ groupId }: { groupId: string }) {
  const { data: group } = useSuspenseQuery(getGroupQueryOptions(groupId))
  const { data: members = [] } = useSuspenseQuery(getGroupMembersQueryOptions(groupId))

  const [assignOpen, setAssignOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null)
  const [filter, setFilter] = useState('')

  const assignedIds = useMemo(() => (members as GroupMember[]).map((m) => m.id), [members])

  const filteredMembers = useMemo(() => {
    const q = filter.toLowerCase()
    return (members as GroupMember[]).filter(
      (m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    )
  }, [members, filter])

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : format(d, 'PP')
  }

  const handleRemoveClick = (member: GroupMember) => {
    setSelectedMember(member)
    setRemoveOpen(true)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className='space-y-6'>
        <div className='space-y-4 pt-4 md:pt-6'>
          <Button
            variant='ghost'
            size='sm'
            className='h-auto w-fit px-0 text-muted-foreground hover:text-foreground'
            asChild
          >
            <Link to='/groups'>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back to groups
            </Link>
          </Button>

          <Card>
            <CardHeader className='space-y-4'>
              <div className='space-y-2'>
                <Badge variant='secondary' className='w-fit'>Group</Badge>
                <CardTitle className='text-3xl font-bold tracking-tight'>{group.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {group.description ? (
                <p className='max-w-3xl text-sm text-muted-foreground whitespace-pre-wrap'>
                  {group.description}
                </p>
              ) : (
                <p className='text-sm italic text-muted-foreground'>No description provided.</p>
              )}
              <div className='grid gap-4 sm:grid-cols-3'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Members</p>
                  <p className='mt-1 text-base font-medium text-foreground'>
                    {(members as GroupMember[]).length}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Created</p>
                  <p className='mt-1 text-base font-medium text-foreground'>
                    {formatDate(group.createdAt) ?? '—'}
                  </p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Last Updated</p>
                  <p className='mt-1 text-base font-medium text-foreground'>
                    {formatDate(group.updatedAt) ?? '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members table */}
        <div className='space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <Input
              placeholder='Filter by name…'
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className='h-8 w-full max-w-[250px]'
            />
            <div className='flex gap-2'>
              <Button variant='outline' className='h-8' onClick={() => setEmailOpen(true)}>
                <Mail className='mr-2 h-4 w-4' />
                Email group
              </Button>
              <Button className='h-8' onClick={() => setAssignOpen(true)}>
                Add member
              </Button>
            </div>
          </div>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead className='hidden md:table-cell'>Joined</TableHead>
                  <TableHead className='hidden md:table-cell'>Added By</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length ? (
                  filteredMembers.map((member) => {
                    const initials = `${member.firstName?.[0] ?? ''}${member.lastName?.[0] ?? ''}`.toUpperCase() || 'P'
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className='flex gap-3'>
                            <Avatar className='h-10 w-10'>
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col justify-center'>
                              <Link
                                to='/persons/$personId/edit'
                                params={{ personId: member.id }}
                                className='font-medium text-primary hover:underline'
                              >
                                {member.firstName} {member.lastName}
                              </Link>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell text-sm text-muted-foreground'>
                          {member.joinedAt ? format(new Date(member.joinedAt), 'PP') : '—'}
                        </TableCell>
                        <TableCell className='hidden md:table-cell text-sm text-muted-foreground'>
                          {member.addedByName ?? '—'}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleRemoveClick(member)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className='h-24 text-center'>
                      {filter ? 'No members match the filter.' : 'No members yet.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Main>

      <AssignMemberDialog
        groupId={groupId}
        assignedPersonIds={assignedIds}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
      <RemoveMemberDialog
        groupId={groupId}
        member={selectedMember}
        open={removeOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedMember(null)
          setRemoveOpen(isOpen)
        }}
      />
      <SendEmailDialog
        groupId={groupId}
        memberCount={(members as GroupMember[]).length}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
    </>
  )
}

function GroupDetailLoader() {
  const params = useParams({ from: '/_authenticated/groups/$groupId/' })
  return <GroupDetailContent groupId={params.groupId} />
}

export default function GroupDetailPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>Loading group…</div>
      }
    >
      <GroupDetailLoader />
    </Suspense>
  )
}
