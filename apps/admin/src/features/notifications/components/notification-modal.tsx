import { useState } from 'react'
import DOMPurify from 'dompurify'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getNotificationsQueryOptions, useAcknowledgeNotification, type Notification, getNotificationAttachmentUrl } from '@/api/notifications'
import { IconPaperclip } from '@tabler/icons-react'

export function NotificationModal() {
  const { data: notifications = [] } = useQuery(getNotificationsQueryOptions)
  const acknowledgeMutation = useAcknowledgeNotification()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Active unacknowledged notifications (server already filters acknowledged ones for viewer)
  const pending = notifications.filter((n) => !dismissed.has(n.id))

  const current: Notification | undefined = pending[currentIndex]

  const handleAcknowledge = () => {
    if (!current) return
    acknowledgeMutation.mutate(current.id, {
      onSuccess: () => {
        setDismissed((prev) => new Set([...prev, current.id]))
        // Move to next or stay at current index (array shrinks)
      },
    })
  }

  if (!current) return null

  const safeHtml = DOMPurify.sanitize(current.message)
  const remaining = pending.length

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {remaining > 1 && (
              <span className="text-sm font-normal text-muted-foreground">
                {currentIndex + 1} of {remaining}
              </span>
            )}
            {current.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {current.attachments && current.attachments.length > 0 && (
            <div className="mt-4 space-y-1 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Attachments</p>
              {current.attachments.map((att) => (
                <a
                  key={att.id}
                  href={getNotificationAttachmentUrl(current.id, att.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <IconPaperclip className="h-3 w-3" />
                  {att.filename}
                </a>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {remaining > 1 && currentIndex < remaining - 1 && (
            <Button variant="outline" onClick={() => setCurrentIndex((i) => i + 1)}>
              Next
            </Button>
          )}
          <Button onClick={handleAcknowledge} disabled={acknowledgeMutation.isPending}>
            {acknowledgeMutation.isPending ? 'Dismissing...' : 'Dismiss'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
