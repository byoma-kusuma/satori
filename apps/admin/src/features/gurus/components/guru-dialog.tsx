import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Guru {
  id: string
  guruName: string
}

interface GuruDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guru?: Guru | null
  onSave: (data: { guruName: string }) => void
}

export function GuruDialog({ open, onOpenChange, guru, onSave }: GuruDialogProps) {
  const [guruName, setGuruName] = useState('')
  const isEditing = !!guru

  useEffect(() => {
    if (open) {
      setGuruName(guru?.guruName || '')
    }
  }, [open, guru])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guruName.trim()) return

    onSave({ guruName })
    onOpenChange(false)
    setGuruName('')
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
            <Label htmlFor="guruName">Guru Name</Label>
            <Input
              id="guruName"
              placeholder="Enter guru name"
              value={guruName}
              onChange={(e) => setGuruName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!guruName.trim()}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}