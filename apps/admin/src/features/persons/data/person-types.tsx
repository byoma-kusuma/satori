import { 
  IconUser, 
  IconUserCheck, 
  IconUserQuestion,
  IconUserPlus 
} from '@tabler/icons-react'
import { personTypeLabels } from './schema'

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
  {
    label: personTypeLabels.attended_orientation,
    value: 'attended_orientation',
    icon: IconUserPlus,
  },
]