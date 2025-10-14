"use client"

import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface PhotoIdCardProps {
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

export const PhotoIdCard = forwardRef<HTMLDivElement, PhotoIdCardProps>(
  ({ person }, ref) => {
    const fullName = [person.firstName, person.middleName, person.lastName]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={ref}
        className="w-[3.375in] h-[2.125in] bg-white border-2 border-gray-300 rounded-lg p-4 flex flex-col print:border-black print:shadow-none"
        style={{ fontSize: '10px' }}
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="font-bold text-xs text-blue-800">MEMBERSHIP CARD</h1>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-3">
          {/* Left Side - Photo */}
          <div className="flex flex-col items-center">
            <Avatar className="w-16 h-20 rounded border">
              <AvatarImage src={person.photo || ''} alt="Profile photo" className="object-cover" />
              <AvatarFallback className="bg-gray-100 text-xs">
                {person.firstName.charAt(0)}{person.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Center - Details */}
          <div className="flex-1 space-y-1">
            <div>
              <div className="font-semibold text-xs">{fullName}</div>
            </div>
            
            {person.membershipCardNumber && (
              <div>
                <span className="text-gray-600 text-xs">Card #: </span>
                <span className="font-mono text-xs">{person.membershipCardNumber}</span>
              </div>
            )}
            
            {person.membershipType && (
              <div>
                <span className="text-gray-600 text-xs">Type: </span>
                <span className="text-xs">{person.membershipType}</span>
              </div>
            )}
          </div>

          {/* Right Side - QR Code */}
          <div className="flex flex-col items-center justify-center">
            <QRCodeSVG
              value={person.id}
              size={48}
              level="M"
              includeMargin={false}
            />
            <div className="text-xs text-gray-500 mt-1">ID</div>
          </div>
        </div>
      </div>
    )
  }
)

PhotoIdCard.displayName = 'PhotoIdCard'