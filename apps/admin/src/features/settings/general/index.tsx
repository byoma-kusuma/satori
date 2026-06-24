import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { IconPlus, IconTrash, IconPencil } from '@tabler/icons-react'
import {
  personTypeConfigQueryOptions,
  useCreatePersonTypeConfig,
  useUpdatePersonTypeConfig,
  useDeletePersonTypeConfig,
  type PersonTypeConfig,
} from '@/api/person-type-config'

export function GeneralSettingsPage() {
  const { data: types = [], isLoading } = useQuery(personTypeConfigQueryOptions)
  const createMutation = useCreatePersonTypeConfig()
  const updateMutation = useUpdatePersonTypeConfig()
  const deleteMutation = useDeletePersonTypeConfig()

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<PersonTypeConfig | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editSortOrder, setEditSortOrder] = useState(0)

  const handleAdd = async () => {
    if (!newCode.trim() || !newLabel.trim()) return
    try {
      await createMutation.mutateAsync({ code: newCode.trim(), label: newLabel.trim(), sort_order: types.length })
      setNewCode('')
      setNewLabel('')
      setAddOpen(false)
      toast({ title: 'Person type created' })
    } catch (e) {
      toast({ title: 'Failed to create', description: e instanceof Error ? e.message : String(e), variant: 'destructive' })
    }
  }

  const handleEdit = async () => {
    if (!editItem || !editLabel.trim()) return
    try {
      await updateMutation.mutateAsync({ id: editItem.id, data: { label: editLabel.trim(), sort_order: editSortOrder } })
      setEditItem(null)
      toast({ title: 'Person type updated' })
    } catch (e) {
      toast({ title: 'Failed to update', description: e instanceof Error ? e.message : String(e), variant: 'destructive' })
    }
  }

  const handleToggleActive = async (item: PersonTypeConfig) => {
    try {
      await updateMutation.mutateAsync({ id: item.id, data: { is_active: !item.is_active } })
    } catch (e) {
      toast({ title: 'Failed to update', description: e instanceof Error ? e.message : String(e), variant: 'destructive' })
    }
  }

  const handleDelete = async (item: PersonTypeConfig) => {
    try {
      await deleteMutation.mutateAsync(item.id)
      toast({ title: 'Person type deleted' })
    } catch (e) {
      toast({ title: 'Cannot delete', description: e instanceof Error ? e.message : String(e), variant: 'destructive' })
    }
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Person Types</CardTitle>
            <CardDescription>Configure the person types available when creating or editing a person.</CardDescription>
          </div>
          <Button size='sm' onClick={() => setAddOpen(true)}>
            <IconPlus className='mr-2 h-4 w-4' /> Add Type
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <Badge variant='outline' className='font-mono text-xs'>{type.code}</Badge>
                    </TableCell>
                    <TableCell>{type.label}</TableCell>
                    <TableCell>{type.sort_order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type)}
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => {
                            setEditItem(type)
                            setEditLabel(type.label)
                            setEditSortOrder(type.sort_order)
                          }}
                        >
                          <IconPencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-destructive hover:text-destructive'
                          onClick={() => handleDelete(type)}
                          disabled={deleteMutation.isPending}
                        >
                          <IconTrash className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Person Type</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-1'>
              <Label>Code <span className='text-xs text-muted-foreground'>(lowercase, underscores only — cannot be changed later)</span></Label>
              <Input
                placeholder='e.g. lay_practitioner'
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              />
            </div>
            <div className='space-y-1'>
              <Label>Label</Label>
              <Input placeholder='e.g. Lay Practitioner' value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending || !newCode || !newLabel}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Person Type</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-1'>
              <Label>Code <span className='text-xs text-muted-foreground'>(read-only)</span></Label>
              <Input value={editItem?.code ?? ''} disabled />
            </div>
            <div className='space-y-1'>
              <Label>Label</Label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
            </div>
            <div className='space-y-1'>
              <Label>Sort Order</Label>
              <Input type='number' value={editSortOrder} onChange={(e) => setEditSortOrder(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending || !editLabel}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
