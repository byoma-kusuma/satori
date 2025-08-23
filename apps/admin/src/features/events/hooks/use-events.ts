import React from 'react'
import { EventsContext } from '../context/events-context-definition'

export const useEvents = () => {
  const eventsContext = React.useContext(EventsContext)
  if (!eventsContext) {
    throw new Error('useEvents has to be used within <EventsProvider>')
  }
  return eventsContext
}