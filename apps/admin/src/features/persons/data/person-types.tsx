import { 
  IconUser, 
  IconUserCheck, 
  IconUserQuestion 
} from '@tabler/icons-react'
import { PersonType, personTypeLabels } from './schema'

// Define the person types with icons for the faceted filter
export const personTypes = [
  {
    label: personTypeLabels.interested,
    value: 'interested',
    icon: IconUserQuestion,
  },
  {
    label: personTypeLabels.contact,
    value: 'contact',
    icon: IconUser,
  },
  {
    label: personTypeLabels.sangha_member,
    value: 'sangha_member',
    icon: IconUserCheck,
  },
]