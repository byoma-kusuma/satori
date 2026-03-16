import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RichTextEditor } from './rich-text-editor'
import { getGroupsQueryOptions } from '@/api/groups'
import { getCentersQueryOptions } from '@/api/centers'
import { getUsersQueryOptions } from '@/api/users'
import type { Notification, NotificationInput, NotificationTargetType } from '@/api/notifications'

interface NotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notification?: Notification | null
  onSave: (data: NotificationInput) => void
  isSaving?: boolean
}

const defaultForm: NotificationInput = {
  title: '',
  message: '',
  target_type: 'all',
  is_active: true,
  expires_at: null,
  group_ids: [],
  center_ids: [],
  user_ids: [],
  send_email: false,
}

export function NotificationDialog({
  open,
  onOpenChange,
  notification,
  onSave,
  isSaving,
}: NotificationDialogProps) {
  const [form, setForm] = useState<NotificationInput>(defaultForm)

  const { data: groups = [] } = useQuery(getGroupsQueryOptions)
  const { data: centers = [] } = useQuery(getCentersQueryOptions)
  const { data: users = [] } = useQuery(getUsersQueryOptions())

  useEffect(() => {
    if (open) {
      setForm(
        notification
          ? {
              title: notification.title,
              message: notification.message,
              target_type: notification.target_type,
              is_active: notification.is_active,
              expires_at: notification.expires_at,
              group_ids: notification.group_ids ?? [],
              center_ids: notification.center_ids ?? [],
              user_ids: notification.user_ids ?? [],
              send_email: false,
            }
          : defaultForm
      )
    }
  }, [open, notification])

  const toggleId = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{notification ? 'Edit Notification' : 'Create Notification'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-2">
          <div className="space-y-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Message</Label>
            <RichTextEditor
              value={form.message}
              onChange={(val) => setForm({ ...form, message: val })}
              placeholder="Enter notification message..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Target</Label>
              <Select
                value={form.target_type}
                onValueChange={(val) =>
                  setForm({ ...form, target_type: val as NotificationTargetType, group_ids: [], center_ids: [], user_ids: [] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="groups">Specific groups</SelectItem>
                  <SelectItem value="centers">Specific centers</SelectItem>
                  <SelectItem value="users">Specific users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="expires_at">Expires at (optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={form.expires_at ? form.expires_at.slice(0, 16) : ''}
                onChange={(e) =>
                  setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
              />
            </div>
          </div>

          {form.target_type === 'groups' && (
            <div className="space-y-1">
              <Label>Groups</Label>
              <div className="rounded-md border p-2 space-y-2">
                {groups.map((group: { id: string; name: string }) => (
                  <div key={group.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={(form.group_ids ?? []).includes(group.id)}
                      onCheckedChange={() =>
                        setForm({ ...form, group_ids: toggleId(form.group_ids ?? [], group.id) })
                      }
                    />
                    <Label htmlFor={`group-${group.id}`} className="font-normal cursor-pointer">
                      {group.name}
                    </Label>
                  </div>
                ))}
                {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups available</p>}
              </div>
            </div>
          )}

          {form.target_type === 'centers' && (
            <div className="space-y-1">
              <Label>Centers</Label>
              <div className="rounded-md border p-2 space-y-2">
                {centers.map((center: { id: string; name: string }) => (
                  <div key={center.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`center-${center.id}`}
                      checked={(form.center_ids ?? []).includes(center.id)}
                      onCheckedChange={() =>
                        setForm({ ...form, center_ids: toggleId(form.center_ids ?? [], center.id) })
                      }
                    />
                    <Label htmlFor={`center-${center.id}`} className="font-normal cursor-pointer">
                      {center.name}
                    </Label>
                  </div>
                ))}
                {centers.length === 0 && <p className="text-sm text-muted-foreground">No centers available</p>}
              </div>
            </div>
          )}

          {form.target_type === 'users' && (
            <div className="space-y-1">
              <Label>Users</Label>
              <div className="rounded-md border p-2 space-y-2">
                {users.map((user: { id: string; name: string; email: string; role: string }) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={(form.user_ids ?? []).includes(user.id)}
                      onCheckedChange={() =>
                        setForm({ ...form, user_ids: toggleId(form.user_ids ?? [], user.id) })
                      }
                    />
                    <Label htmlFor={`user-${user.id}`} className="font-normal cursor-pointer flex-1">
                      {user.name}
                      <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({user.role})</span>
                    </Label>
                  </div>
                ))}
                {users.length === 0 && <p className="text-sm text-muted-foreground">No users available</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={form.is_active ?? true}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="send_email"
              checked={form.send_email ?? false}
              onCheckedChange={(checked) => setForm({ ...form, send_email: !!checked })}
            />
            <Label htmlFor="send_email" className="cursor-pointer font-normal">
              Also send as email to recipients
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : notification ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
