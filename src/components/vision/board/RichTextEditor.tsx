import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  minHeight?: number | undefined;
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 160 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Write your dream…" }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "vision-prose focus:outline-none text-sm leading-relaxed",
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Sync external value changes (e.g. switching items) without clobbering typing.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return <div className={cn("rounded-2xl glass p-3", className)} style={{ minHeight }} />;
  }

  const Tool = ({
    active,
    onClick,
    label,
    children,
  }: {
    active?: boolean | undefined;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-glass-strong hover:text-foreground",
        active && "bg-glass-strong text-foreground",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("rounded-2xl glass", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-glass-border px-2 py-1.5">
        <Tool label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <Tool label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <Tool
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <Tool label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <Tool label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <Tool label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <span className="mx-1 h-4 w-px bg-glass-border" />
        <Tool label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
        <Tool label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Tool>
      </div>
      <EditorContent editor={editor} className="px-3.5 py-3" />
    </div>
  );
}
