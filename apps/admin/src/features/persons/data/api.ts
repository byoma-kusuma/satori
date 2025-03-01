import {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  getPersonsQueryOptions,
  getPersonQueryOptions,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson
} from '@/api/persons'

// Re-export all the hooks and functions for use within the persons feature
export {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  getPersonsQueryOptions,
  getPersonQueryOptions,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson
}

// Add any person-specific API utilities or extensions here 