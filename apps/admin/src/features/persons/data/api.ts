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
  useDeletePerson,
  getKramaInstructors,
  getPersonWithKramaInstructor,
  getKramaInstructorsQueryOptions,
  getPersonWithKramaInstructorQueryOptions,
  getPersonEvents,
  getPersonEventsQueryOptions
} from '@/api/persons'
import {
  getMahakramaSteps,
  getMahakramaHistory,
  addInitialMahakramaStep,
  completeMahakramaStep,
  getMahakramaStepsQueryOptions,
  getMahakramaHistoryQueryOptions,
} from '@/api/mahakrama'

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
  useDeletePerson,
  getKramaInstructors,
  getPersonWithKramaInstructor,
  getKramaInstructorsQueryOptions,
  getPersonWithKramaInstructorQueryOptions,
  getPersonEvents,
  getPersonEventsQueryOptions,
  getMahakramaSteps,
  getMahakramaHistory,
  addInitialMahakramaStep,
  completeMahakramaStep,
  getMahakramaStepsQueryOptions,
  getMahakramaHistoryQueryOptions,
}

// Add any person-specific API utilities or extensions here 
