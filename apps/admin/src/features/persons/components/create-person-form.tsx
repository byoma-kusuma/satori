"use client"

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useRef, useState } from 'react'
import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { personInputSchema, personTypeLabels, titleLabels, membershipTypeLabels, countries } from '../data/schema'
import { useCreatePerson, getKramaInstructorsQueryOptions } from '../data/api'
import { SearchableNationalitySelect } from '@/components/ui/searchable-nationality-select'
import { CenterSelect } from '@/components/ui/center-select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IconChevronLeft, IconUpload, IconX } from '@tabler/icons-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { countryToPhoneCode } from '@/utils/country-phone-codes'

type PersonForm = z.infer<typeof personInputSchema>

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
        // Calculate new dimensions
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
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      } catch (error) {
        reject(new Error('Failed to process image'))
      } finally {
        // Clean up object URL to prevent memory leaks
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

// Helper function to validate image file
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

export function CreatePersonPage() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [primaryPhoneCountry, setPrimaryPhoneCountry] = useState<string>('NP')
  const [secondaryPhoneCountry, setSecondaryPhoneCountry] = useState<string>('NP')
  const createPersonMutation = useCreatePerson()

  const form = useForm<PersonForm>({
    resolver: zodResolver(personInputSchema),
    defaultValues: {
      firstName: '',
      middleName: undefined,
      lastName: '',
      address: '',
      emailId: undefined,
      primaryPhone: undefined,
      secondaryPhone: undefined,
      yearOfBirth: undefined,
      photo: undefined,
      gender: undefined,
      centerId: undefined,
      type: 'interested',
      country: undefined,
      nationality: undefined,
      languagePreference: undefined,
      occupation: undefined,
      notes: undefined,
      refugeName: undefined,
      yearOfRefuge: undefined,
      title: undefined,
      membershipType: undefined,
      hasMembershipCard: undefined,
      membershipCardNumber: undefined,
      emergencyContactName: undefined,
      emergencyContactRelationship: undefined,
      emergencyContactPhone: undefined,
      yearOfRefugeCalendarType: 'AD',
      is_krama_instructor: false,
      krama_instructor_person_id: undefined,
      referredBy: undefined,
    },
  })

  const personType = form.watch('type')
  const selectedCountry = form.watch('country')
  const primaryPhone = form.watch('primaryPhone')
  const secondaryPhone = form.watch('secondaryPhone')
  
  // Update phone country codes when country changes, but only if phone fields are empty
  React.useEffect(() => {
    if (selectedCountry && countryToPhoneCode[selectedCountry]) {
      const newCountryCode = countryToPhoneCode[selectedCountry]
      
      // Update primary phone country if field is empty
      if (!primaryPhone || primaryPhone.trim() === '') {
        setPrimaryPhoneCountry(newCountryCode)
      }
      
      // Update secondary phone country if field is empty
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

  const onSubmit = (vals: PersonForm) => {
    const processedVals: any = {
      firstName: vals.firstName,
      middleName: vals.middleName || null,
      lastName: vals.lastName,
      address: vals.address,
      centerId: vals.centerId === undefined || vals.centerId === "" ? null : vals.centerId,
      type: vals.type,
      emailId: vals.emailId || null,
      primaryPhone: vals.primaryPhone || null,
      secondaryPhone: vals.secondaryPhone || null,
      yearOfBirth: vals.yearOfBirth || null,
      gender: vals.gender || null,
      country: vals.country || null,
      nationality: vals.nationality || null,
      languagePreference: vals.languagePreference || null,
      occupation: vals.occupation || null,
      notes: vals.notes || null,
      refugeName: vals.refugeName || null,
      yearOfRefuge: vals.yearOfRefuge || null,
      title: vals.title || null,
      membershipType: vals.membershipType || null,
      hasMembershipCard: vals.hasMembershipCard || null,
      membershipCardNumber: vals.membershipCardNumber || null,
      emergencyContactName: vals.emergencyContactName || null,
      emergencyContactRelationship: vals.emergencyContactRelationship || null,
      emergencyContactPhone: vals.emergencyContactPhone || null,
      yearOfRefugeCalendarType: vals.yearOfRefugeCalendarType || null,
      is_krama_instructor: vals.is_krama_instructor || false,
      krama_instructor_person_id: vals.krama_instructor_person_id === "none" ? null : vals.krama_instructor_person_id || null,
      referredBy: vals.referredBy || null,
    };
    
    // Handle photo field
    if (vals.photo && vals.photo !== '' && vals.photo.startsWith('data:')) {
      processedVals.photo = vals.photo;
    }

    createPersonMutation.mutate(processedVals, {
      onSuccess: () => {
        toast({ title: 'Person created successfully' })
        form.reset()
        navigate({ to: '/persons' })
      },
      onError: (err: unknown) => {
        console.error('Create error:', err)
        toast({ title: 'Creation failed', description: String(err), variant: 'destructive' })
      }
    })
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
      <Main>
        <div className='mb-6'>
          <Button 
            variant="outline" 
            className="mb-4" 
            onClick={() => navigate({ to: '/persons' })}
          >
            <IconChevronLeft className="mr-2 h-4 w-4" /> Back to Person List
          </Button>
          <h2 className='text-2xl font-bold tracking-tight'>Create Person</h2>
          <p className='text-muted-foreground'>
            Add a new person to the database.
          </p>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Person</CardTitle>
            <CardDescription>
              Enter the information for the new person.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                id="person-form"
                ref={formRef}
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Person Type - aligned with left column */}
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
                  {/* Left side - Basic fields (single column) */}
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
                                <IconUpload className="h-12 w-12" />
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Remove photo button */}
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
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const validation = validateImageFile(file)
                                    if (!validation.isValid) {
                                      toast({ title: 'Invalid file', description: validation.error, variant: 'destructive' })
                                      return
                                    }
                                    
                                    setIsUploadingPhoto(true)
                                    try {
                                      const compressedImage = await compressImage(file)
                                      field.onChange(compressedImage)
                                      toast({ title: 'Photo uploaded successfully' })
                                    } catch (error) {
                                      console.error('Image compression failed:', error)
                                      toast({ title: 'Failed to process image', description: String(error), variant: 'destructive' })
                                    } finally {
                                      setIsUploadingPhoto(false)
                                    }
                                  }
                                }}
                                disabled={isUploadingPhoto}
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
                  </div>
                </div>

                {/* Krama Instructor Section */}
                {(personType === 'attended_orientation' || personType === 'sangha_member') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                    <div className="col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Krama Instructor Information</h3>
                    </div>
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
                              Is Krama Instructor?
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="krama_instructor_person_id"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Krama Instructor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Krama Instructor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {kramaInstructors.map((instructor) => (
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
                  </div>
                )}

                {/* Additional fields section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="centerId"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Center</FormLabel>
                        <FormControl>
                          <CenterSelect
                            value={field.value ?? undefined}
                            onValueChange={(newValue) => field.onChange(newValue)}
                            placeholder="Select center"
                          />
                        </FormControl>
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
                              className="phone-input h-10 w-full"
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
                              className="phone-input h-10 w-full"
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
                              className="phone-input h-10 w-full"
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
            </Form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate({ to: '/persons' })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="person-form"
              disabled={createPersonMutation.isPending || isUploadingPhoto}
            >
              {createPersonMutation.isPending ? 'Creating...' : 'Create Person'}
            </Button>
          </CardFooter>
        </Card>
      </Main>
    </>
  )
}
