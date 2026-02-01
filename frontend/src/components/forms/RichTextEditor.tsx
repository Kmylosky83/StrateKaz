/**
 * RichTextEditor - Editor de texto enriquecido basado en TipTap
 *
 * Características:
 * - Formato de texto (negrita, cursiva, subrayado, tachado)
 * - Alineación de texto
 * - Listas (ordenadas y desordenadas)
 * - Encabezados
 * - Enlaces
 * - Resaltado
 * - Modo oscuro compatible
 */
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  Undo,
  Redo,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = ({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 rounded transition-colors',
      isActive
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
);

export interface RichTextEditorRef {
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  clearContent: () => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder, label, error, disabled, minHeight = '200px', className }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline.extend({
          name: 'customUnderline', // Nombre único para evitar conflictos entre instancias
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Highlight.configure({
          multicolor: false,
        }),
        Link.extend({
          name: 'customLink', // Nombre único para evitar conflictos
        }).configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-purple-600 underline hover:text-purple-800 dark:text-purple-400',
          },
        }),
      ],
      content: value || '',
      editable: !disabled,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none dark:prose-invert focus:outline-none',
            'prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
            'prose-p:text-gray-700 dark:prose-p:text-gray-300',
            'prose-ul:list-disc prose-ol:list-decimal',
            'prose-li:text-gray-700 dark:prose-li:text-gray-300',
            'prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400'
          ),
        },
      },
    });

    // Exponer métodos al padre
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      getText: () => editor?.getText() || '',
      setContent: (content: string) => editor?.commands.setContent(content),
      clearContent: () => editor?.commands.clearContent(),
    }));

    // Sincronizar contenido externo
    useEffect(() => {
      if (editor && value !== undefined && value !== editor.getHTML()) {
        editor.commands.setContent(value);
      }
    }, [value, editor]);

    const setLink = useCallback(() => {
      if (!editor) return;

      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('URL del enlace:', previousUrl);

      if (url === null) return;

      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }

      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
      return null;
    }

    return (
      <div className={cn('space-y-1', className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}

        <div
          className={cn(
            'border rounded-lg overflow-hidden transition-colors',
            error
              ? 'border-danger-500 dark:border-danger-400'
              : 'border-gray-300 dark:border-gray-600',
            disabled ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'
          )}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Deshacer"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Rehacer"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Título 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Título 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Título 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Negrita (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Cursiva (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('customUnderline')}
              title="Subrayado (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Tachado"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="Resaltar"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Alinear izquierda"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Centrar"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Alinear derecha"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              title="Justificar"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Lista con viñetas"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Lista numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Cita"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarDivider />

            {/* Links */}
            <ToolbarButton
              onClick={setLink}
              isActive={editor.isActive('link')}
              title="Insertar enlace"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            {editor.isActive('link') && (
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                title="Quitar enlace"
              >
                <Unlink className="w-4 h-4" />
              </ToolbarButton>
            )}
          </div>

          {/* Bubble Menu (aparece al seleccionar texto) */}
          {editor && (
            <BubbleMenu
              editor={editor}
              className="flex items-center gap-0.5 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
            >
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Negrita"
              >
                <Bold className="w-3.5 h-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Cursiva"
              >
                <Italic className="w-3.5 h-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('customUnderline')}
                title="Subrayado"
              >
                <UnderlineIcon className="w-3.5 h-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={setLink}
                isActive={editor.isActive('link')}
                title="Enlace"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </ToolbarButton>
            </BubbleMenu>
          )}

          {/* Editor Content */}
          <div
            className="p-4 overflow-y-auto"
            style={{ minHeight }}
          >
            <EditorContent
              editor={editor}
              className={cn(
                'min-h-full',
                !editor.getText() && placeholder && 'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:h-0 before:pointer-events-none'
              )}
              data-placeholder={placeholder}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
