import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Guru {
  id: string
  name: string
}

interface GuruDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guru?: Guru | null
  onSave: (data: { name: string }) => void
}

export function GuruDialog({ open, onOpenChange, guru, onSave }: GuruDialogProps) {
  const [name, setName] = useState('')
  const isEditing = !!guru

  useEffect(() => {
    if (open) {
      setName(guru?.name || '')
    }
  }, [open, guru])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({ name })
    onOpenChange(false)
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Guru' : 'Create Guru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Guru Name</Label>
            <Input
              id="name"
              placeholder="Enter guru name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}