import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconDownload, IconFile, IconLoader, IconTrash, IconUpload } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  deleteStepDocument,
  downloadStepDocument,
  getStepDocumentsQueryOptions,
  replaceStepDocument,
  uploadStepDocument,
} from '@/api/mahakrama'
import type { MahakramaStepDocument } from '../data/schema'

interface MahakramaDocumentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stepId: string
  stepName: string
}

export function MahakramaDocumentsDialog({ open, onOpenChange, stepId, stepName }: MahakramaDocumentsDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [language, setLanguage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null)

  const { data: documents = [], isLoading } = useQuery({
    ...getStepDocumentsQueryOptions(stepId),
    enabled: open && Boolean(stepId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mahakrama-step-documents', stepId] })
  const invalidateSteps = () => queryClient.invalidateQueries({ queryKey: ['mahakrama-steps'] })

  const uploadMutation = useMutation({
    mutationFn: ({ file, lang }: { file: File; lang: string }) => uploadStepDocument(stepId, lang, file),
    onSuccess: () => {
      toast({ title: 'Document uploaded' })
      setLanguage('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      invalidate()
      invalidateSteps()
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const replaceMutation = useMutation({
    mutationFn: ({ docId, file }: { docId: string; file: File }) => replaceStepDocument(stepId, docId, file),
    onSuccess: () => {
      toast({ title: 'Document replaced' })
      setReplacingDocId(null)
      if (replaceInputRef.current) replaceInputRef.current.value = ''
      invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Replace failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteStepDocument(stepId, docId),
    onSuccess: () => {
      toast({ title: 'Document deleted' })
      invalidate()
      invalidateSteps()
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (docId: string) => downloadStepDocument(stepId, docId),
    onError: (error) => {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const handleUpload = () => {
    if (!selectedFile || !language.trim()) return
    uploadMutation.mutate({ file: selectedFile, lang: language.trim() })
  }

  const handleReplaceFileChange = (doc: MahakramaStepDocument, file: File) => {
    setReplacingDocId(doc.id)
    replaceMutation.mutate({ docId: doc.id, file })
  }

  const isBusy = uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Documents</DialogTitle>
          <DialogDescription>
            Manage instruction documents for <span className='font-medium'>{stepName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-6 text-muted-foreground'>
              <IconLoader className='mr-2 h-4 w-4 animate-spin' /> Loading…
            </div>
          ) : documents.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>No documents yet.</p>
          ) : (
            <ul className='divide-y rounded-md border'>
              {documents.map((doc) => (
                <li key={doc.id} className='flex items-center gap-3 px-3 py-2'>
                  <IconFile className='h-4 w-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{doc.language}</p>
                    <p className='truncate text-xs text-muted-foreground'>{doc.documentFilename}</p>
                  </div>
                  <div className='flex shrink-0 items-center gap-1'>
                    <Button
                      size='icon'
                      variant='ghost'
                      disabled={downloadMutation.isPending}
                      onClick={() => downloadMutation.mutate(doc.id)}
                      title='View PDF'
                    >
                      <IconDownload className='h-4 w-4' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      disabled={isBusy}
                      onClick={() => replaceInputRef.current?.click()}
                      title='Replace file'
                    >
                      {replacingDocId === doc.id && replaceMutation.isPending ? (
                        <IconLoader className='h-4 w-4 animate-spin' />
                      ) : (
                        <IconUpload className='h-4 w-4' />
                      )}
                    </Button>
                    <input
                      ref={replaceInputRef}
                      type='file'
                      accept='application/pdf'
                      className='hidden'
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleReplaceFileChange(doc, file)
                      }}
                    />
                    <Button
                      size='icon'
                      variant='ghost'
                      disabled={isBusy}
                      onClick={() => deleteMutation.mutate(doc.id)}
                      title='Delete'
                      className='text-destructive hover:text-destructive'
                    >
                      {deleteMutation.isPending ? (
                        <IconLoader className='h-4 w-4 animate-spin' />
                      ) : (
                        <IconTrash className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className='space-y-3 rounded-md border p-3'>
            <p className='text-sm font-medium'>Add document</p>
            <div className='space-y-2'>
              <Label htmlFor='doc-language'>Language</Label>
              <Input
                id='doc-language'
                placeholder='e.g. English, Tibetan, Chinese…'
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={uploadMutation.isPending}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='doc-file'>PDF file</Label>
              <Input
                id='doc-file'
                ref={fileInputRef}
                type='file'
                accept='application/pdf'
                disabled={uploadMutation.isPending}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !language.trim() || uploadMutation.isPending}
              className='w-full'
            >
              {uploadMutation.isPending ? (
                <><IconLoader className='mr-2 h-4 w-4 animate-spin' /> Uploading…</>
              ) : (
                <><IconUpload className='mr-2 h-4 w-4' /> Upload</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
