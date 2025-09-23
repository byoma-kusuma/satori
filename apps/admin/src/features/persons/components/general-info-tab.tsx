import { UseFormReturn } from 'react-hook-form'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { personTypeLabels, titleLabels, membershipTypeLabels, countries } from '../data/schema'
import { getKramaInstructorsQueryOptions } from '../data/api'
import { SearchableNationalitySelect } from '@/components/ui/searchable-nationality-select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { IconUpload, IconX, IconId } from '@tabler/icons-react'
import React from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { PhotoIdPrintDialog } from './photo-id-print-dialog'
import { countryToPhoneCode } from '@/utils/country-phone-codes'

interface GeneralInfoTabProps {
  form: UseFormReturn<any>
  person: any
  formRef: React.RefObject<HTMLFormElement>
  onSubmit: (data: any) => void
}

// Helper function to compress and resize image
const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    let objectUrl: string
    
    if (!ctx) {
      reject(new Error('Failed to create canvas context'))
      return
    }
    
    img.onload = () => {
      try {
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      } catch (error) {
        reject(new Error('Failed to process image'))
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    
    objectUrl = URL.createObjectURL(file)
    img.src = objectUrl
  })
}

const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Please select a JPEG, PNG, or WebP image.' }
  }
  
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Please select an image smaller than 5MB.' }
  }
  
  return { isValid: true }
}

export function GeneralInfoTab({ form, person, formRef, onSubmit }: GeneralInfoTabProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showPhotoIdDialog, setShowPhotoIdDialog] = useState(false)
  const [primaryPhoneCountry, setPrimaryPhoneCountry] = useState<string>('NP')
  const [secondaryPhoneCountry, setSecondaryPhoneCountry] = useState<string>('NP')

  const personType = form.watch('type')
  const selectedCountry = form.watch('country')
  const primaryPhone = form.watch('primaryPhone')
  const secondaryPhone = form.watch('secondaryPhone')
  
  // Initialize phone country codes based on existing data
  React.useEffect(() => {
    if (person.country && countryToPhoneCode[person.country]) {
      const countryCode = countryToPhoneCode[person.country]
      setPrimaryPhoneCountry(countryCode)
      setSecondaryPhoneCountry(countryCode)
    }
  }, [person.country])
  
  // Update phone country codes when country changes
  React.useEffect(() => {
    if (selectedCountry && countryToPhoneCode[selectedCountry]) {
      const newCountryCode = countryToPhoneCode[selectedCountry]
      
      if (!primaryPhone || primaryPhone.trim() === '') {
        setPrimaryPhoneCountry(newCountryCode)
      }
      
      if (!secondaryPhone || secondaryPhone.trim() === '') {
        setSecondaryPhoneCountry(newCountryCode)
      }
    }
  }, [selectedCountry, primaryPhone, secondaryPhone])
  
  // Fetch Krama Instructors when person type is attended_orientation or sangha_member
  const { data: kramaInstructors = [] } = useQuery({
    ...getKramaInstructorsQueryOptions(),
    enabled: personType === 'attended_orientation' || personType === 'sangha_member'
  })

  return (
    <Form {...form}>
      <form
        id="person-form"
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Person Code Display */}
        {person.personCode && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Person ID:</span>
              <span className="font-mono text-lg font-semibold">{person.personCode}</span>
            </div>
          </div>
        )}
        
        {/* Person Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Person Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                  <FormControl>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select person type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                    <SelectItem value="sangha_member">Sangha Member</SelectItem>
                    <SelectItem value="attended_orientation">Attended Orientation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div></div>
        </div>
        
        {/* Top section: Basic fields on left, Photo on right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Basic fields */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter middle name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailId"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right side - Photo upload */}
          <div className="flex flex-col items-center justify-start">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center space-y-4">
                  <div className="relative cursor-pointer group">
                    <Avatar className="h-32 w-32 border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors">
                      <AvatarImage src={field.value || ''} alt="Profile photo" />
                      <AvatarFallback className="bg-gray-50 text-gray-400">
                        {isUploadingPhoto ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="text-xs mt-1">Uploading...</span>
                          </div>
                        ) : (
                          <IconUpload className="h-12 w-12" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {field.value && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => {
                          field.onChange('')
                          toast({ title: 'Photo removed' })
                        }}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        disabled={isUploadingPhoto}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          const validation = validateImageFile(file)
                          if (!validation.isValid) {
                            toast({ 
                              title: 'Invalid file', 
                              description: validation.error,
                              variant: 'destructive'
                            })
                            e.target.value = ''
                            return
                          }
                          
                          setIsUploadingPhoto(true)
                          
                          try {
                            const compressedImage = await compressImage(file)
                            field.onChange(compressedImage)
                            toast({ title: 'Photo uploaded successfully' })
                          } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
                            toast({ 
                              title: 'Upload failed', 
                              description: `Failed to process the image: ${errorMessage}`,
                              variant: 'destructive'
                            })
                          } finally {
                            setIsUploadingPhoto(false)
                            e.target.value = ''
                          }
                        }}
                      />
                    </FormControl>
                  </div>
                  <div className="text-center">
                    <FormLabel className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                      {isUploadingPhoto ? 'Processing...' : 'Click to upload photo'}
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, WebP • Max 5MB
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Print ID Card Button */}
            <div className="flex justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPhotoIdDialog(true)}
                disabled={!person.membershipCardNumber}
              >
                <IconId className="w-4 h-4 mr-2" />
                Print ID Card
              </Button>
            </div>
          </div>
        </div>

        {/* Additional fields section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="center"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Center</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select center" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Nepal">Nepal</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value as string | undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearOfBirth"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Year of Birth</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter year of birth"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                      field.onChange(value ? parseInt(value) : undefined)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Krama Instructor field */}
          {(personType === 'attended_orientation' || personType === 'sangha_member') && (
            <FormField
              control={form.control}
              name="krama_instructor_person_id"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Krama Instructor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Krama Instructor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {kramaInstructors.map((instructor: any) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.firstName} {instructor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <SearchableNationalitySelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Select country"
                    countries={countries}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <SearchableNationalitySelect
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Select nationality"
                    countries={countries}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="primaryPhone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Primary Phone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={true}
                      defaultCountry={primaryPhoneCountry as any}
                      placeholder="Enter primary phone"
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value || '')}
                      className="h-10 w-full"
                      inputClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="secondaryPhone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Secondary Phone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={true}
                      defaultCountry={secondaryPhoneCountry as any}
                      placeholder="Enter secondary phone"
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value || '')}
                      className="h-10 w-full"
                      inputClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="languagePreference"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Language Preference</FormLabel>
                <FormControl>
                  <Input placeholder="Enter language preference" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input placeholder="Enter occupation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="referredBy"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Referred By</FormLabel>
                <FormControl>
                  <Input placeholder="Enter who referred this person" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Notes/Comments</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any additional notes or comments" 
                    {...field} 
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Emergency Contact Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
          </div>
          <FormField
            control={form.control}
            name="emergencyContactName"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Emergency Contact Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter emergency contact name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactRelationship"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Relationship</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Spouse, Parent, Sibling" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergencyContactPhone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Emergency Contact Phone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={true}
                      defaultCountry="NP"
                      placeholder="Enter emergency contact phone"
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value || '')}
                      className="h-10 w-full"
                      inputClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {form.watch('type') === 'sangha_member' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-4">Sangha Member Information</h3>
            </div>
            <FormField
              control={form.control}
              name="refugeName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Refuge Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter refuge name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearOfRefuge"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Year of Refuge</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter year of refuge"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        field.onChange(value ? parseInt(value) : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearOfRefugeCalendarType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Year of Refuge Calendar Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || 'AD'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calendar type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AD">AD (Anno Domini)</SelectItem>
                      <SelectItem value="BS">BS (Bikram Sambat)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Title</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value as string | undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dharma_dhar">{titleLabels.dharma_dhar}</SelectItem>
                      <SelectItem value="sahayak_dharmacharya">{titleLabels.sahayak_dharmacharya}</SelectItem>
                      <SelectItem value="sahayak_samathacharya">{titleLabels.sahayak_samathacharya}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="membershipType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Membership Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select membership type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Life Time">{membershipTypeLabels['Life Time']}</SelectItem>
                      <SelectItem value="Board Member">{membershipTypeLabels['Board Member']}</SelectItem>
                      <SelectItem value="General Member">{membershipTypeLabels['General Member']}</SelectItem>
                      <SelectItem value="Honorary Member">{membershipTypeLabels['Honorary Member']}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasMembershipCard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Do you have a membership card?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_krama_instructor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Is this person a Krama Instructor?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="membershipCardNumber"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Membership Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter membership card number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </form>
      
      <PhotoIdPrintDialog
        open={showPhotoIdDialog}
        onOpenChange={setShowPhotoIdDialog}
        person={{
          id: person.id,
          firstName: person.firstName,
          middleName: person.middleName,
          lastName: person.lastName,
          membershipCardNumber: person.membershipCardNumber,
          membershipType: person.membershipType,
          photo: person.photo,
        }}
      />
    </Form>
  )
}