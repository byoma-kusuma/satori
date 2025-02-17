import { UserType } from 'server/src/api/user/user.route';
import { hc } from 'hono/client';
import { queryOptions } from '@tanstack/react-query';
// Create a fetch function with credentials included
const fetchWithCredentials = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, { ...init, credentials: 'include' });
};

// Initialize the Hono client with the custom fetch function
const client = hc<UserType>('http://localhost:3000/api/user', {
  fetch: fetchWithCredentials,
});

export const getUsers = async () => {
  const response = await client.index.$get();
  return await response.json();
};

export const getUsersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: getUsers,
})

export const getUser = async (id: string) => {
  const response = await client[':id'].$get({ param: { id } });
  return await response.json();
};
