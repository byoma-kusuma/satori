"use client"

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PhotoIdCard } from './photo-id-card'
import { IconPrinter } from '@tabler/icons-react'

interface PhotoIdPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: {
    id: string
    firstName: string
    middleName?: string | null
    lastName: string
    membershipCardNumber?: string | null
    membershipType?: string | null
    photo?: string | null
  }
}

export function PhotoIdPrintDialog({ open, onOpenChange, person }: PhotoIdPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Photo ID - ${person.firstName} ${person.lastName}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Photo ID Card</DialogTitle>
          <DialogDescription>
            Preview and print the membership card for {person.firstName} {person.lastName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center py-4">
          <PhotoIdCard ref={printRef} person={person} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <IconPrinter className="w-4 h-4 mr-2" />
            Print Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}