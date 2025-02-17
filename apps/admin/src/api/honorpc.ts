export async function fetchWithHandling<T>(
  input: RequestInfo | URL, // Accept both RequestInfo and URL
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as T
  return data
}
