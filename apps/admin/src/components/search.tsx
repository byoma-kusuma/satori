import { Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-context'

interface Props {
  className?: string
  placeholder?: string
}

export function Search({ className, placeholder = 'Search…' }: Props) {
  const { setOpen } = useSearch()

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "relative w-full justify-start text-sm text-muted-foreground sm:w-64",
        className,
      )}
      onClick={() => setOpen(true)}
    >
      <SearchIcon className="mr-2 h-4 w-4" />
      <span>{placeholder}</span>
      <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
