
interface Props {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder = 'Search' }: Props) {
  useSearch()
  return null
}
import { useSearch } from '@/context/search-context'
