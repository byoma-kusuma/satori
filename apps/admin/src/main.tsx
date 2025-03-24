import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { AxiosError } from 'axios';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { handleServerError } from '@/utils/handle-server-error';
import { toast } from '@/hooks/use-toast';
import './index.css';
import AppearanceEffect from '@/components/AppearanceEffect';
// Generated Routes
import { routeTree } from './routeTree.gen';




/* 
  EVent table
  > id
  > name
  > description
  > start_date
  > end_date
  > created_at
  > updated_at
  > type (ENUM, "REFUGE", "BODHIPUSPANJALI")
  > metadata (JSONB, RefugeData, BodhipushpanjaliData) 
   example of metadata: Refugedata = Array<{
    personId,
    firstName,
    lastName,
    refugeName,
    completed,
   }>
    example of metaData: BodhipushpanjaliData = Array<{
      personId,
      firstName,
      lastName,
      hasTakenRefuge,
      referralMedium
    }>

  PersonEvents
  > id
  > person_id
  > event_id
  > created_at
  > updated_at
  > type (eg "refuge")
   
*/

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) console.log({ failureCount, error });
        if (failureCount >= 0 && import.meta.env.DEV) return false;
        if (failureCount > 3 && import.meta.env.PROD) return false;
        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        );
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000,
    },
    mutations: {
      onError: (error) => {
        handleServerError(error);
        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast({
              variant: 'destructive',
              title: 'Content not modified!',
            });
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast({
            variant: 'destructive',
            title: 'Session expired!',
          });
          const redirect = `${router.history.location.href}`;
          router.navigate({ to: '/sign-in', search: { redirect } });
        }
        if (error.response?.status === 500) {
          toast({
            variant: 'destructive',
            title: 'Internal Server Error!',
          });
          router.navigate({ to: '/500' });
        }
      }
    },
  }),
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppearanceEffect />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  );
}