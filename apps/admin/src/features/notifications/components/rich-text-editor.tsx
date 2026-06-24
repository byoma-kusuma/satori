import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { cn } from '@/lib/utils'
import { Bold, Italic, UnderlineIcon, Link as LinkIcon, List, ListOrdered, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-[150px] p-3 focus:outline-none prose prose-sm max-w-none dark:prose-invert',
        'data-placeholder': placeholder ?? '',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync external value changes (e.g. when form resets)
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, false)
    }
  }, [value, editor])

  if (!editor) return null

  const toolbarBtn = (active: boolean, onClick: () => void, children: React.ReactNode, title: string) => (
    <Button
      type="button"
      variant={active ? 'default' : 'ghost'}
      size="sm"
      className="h-7 w-7 p-0"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  )

  const handleLink = () => {
    const url = window.prompt('URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
    else editor.chain().focus().unsetLink().run()
  }

  return (
    <div className={cn('rounded-md border relative', className)}>
      <div className="flex flex-wrap gap-1 border-b p-1">
        {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold className="h-3 w-3" />, 'Bold')}
        {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-3 w-3" />, 'Italic')}
        {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-3 w-3" />, 'Underline')}
        {toolbarBtn(editor.isActive('link'), handleLink, <LinkIcon className="h-3 w-3" />, 'Link')}
        <div className="w-px bg-border mx-1" />
        {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List className="h-3 w-3" />, 'Bullet list')}
        {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-3 w-3" />, 'Ordered list')}
        <div className="w-px bg-border mx-1" />
        {toolbarBtn(false, () => editor.chain().focus().undo().run(), <Undo className="h-3 w-3" />, 'Undo')}
        {toolbarBtn(false, () => editor.chain().focus().redo().run(), <Redo className="h-3 w-3" />, 'Redo')}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
