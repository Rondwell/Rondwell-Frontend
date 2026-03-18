<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Readable } from 'svelte/store';
  import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
  import StarterKit from '@tiptap/starter-kit';
  import PlaceholderExtension from '@tiptap/extension-placeholder'; 

  interface Props {
    content?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
  }

  let { content = '', onChange, placeholder = 'Start writing...' }: Props = $props();

  let editor = $state() as Readable<Editor>;

  onMount(() => {
    editor = createEditor({
      extensions: [
        StarterKit,
        PlaceholderExtension.configure({ placeholder }), 
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
    });
  });

  onDestroy(() => {
    $editor?.destroy();
  });
</script>

<!-- Toolbar -->
{#if $editor}
  <div class="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-gray-300 bg-[#F4F3F3] p-2">

    <!-- Bold -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleBold().run()}
      class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200
        {$editor.isActive('bold') ? 'bg-black text-white' : ''}"
    >
      B
    </button>

    <!-- Italic -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleItalic().run()}
      class="rounded px-2 py-1 text-sm italic hover:bg-gray-200
        {$editor.isActive('italic') ? 'bg-black text-white' : ''}"
    >
      I
    </button>

    <!-- Strikethrough -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleStrike().run()}
      class="rounded px-2 py-1 text-sm line-through hover:bg-gray-200
        {$editor.isActive('strike') ? 'bg-black text-white' : ''}"
    >
      S
    </button>

    <div class="mx-1 w-px bg-gray-300"></div>

    <!-- H1 -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleHeading({ level: 1 }).run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200
        {$editor.isActive('heading', { level: 1 }) ? 'bg-black text-white' : ''}"
    >
      H1
    </button>

    <!-- H2 -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleHeading({ level: 2 }).run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200
        {$editor.isActive('heading', { level: 2 }) ? 'bg-black text-white' : ''}"
    >
      H2
    </button>

    <!-- Paragraph -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().setParagraph().run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200
        {$editor.isActive('paragraph') ? 'bg-black text-white' : ''}"
    >
      P
    </button>

    <div class="mx-1 w-px bg-gray-300"></div>

    <!-- Bullet List -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleBulletList().run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200
        {$editor.isActive('bulletList') ? 'bg-black text-white' : ''}"
    >
      • List
    </button>

    <!-- Ordered List -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().toggleOrderedList().run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200
        {$editor.isActive('orderedList') ? 'bg-black text-white' : ''}"
    >
      1. List
    </button>

    <div class="mx-1 w-px bg-gray-300"></div>

    <!-- Undo -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().undo().run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200"
    >
      ↩
    </button>

    <!-- Redo -->
    <button
      type="button"
      onclick={() => $editor.chain().focus().redo().run()}
      class="rounded px-2 py-1 text-sm hover:bg-gray-200"
    >
      ↪
    </button>
  </div>
{/if}

<!-- Editor area -->
<div class="rounded-b-md border border-gray-300 bg-white p-3 min-h-\[200px\]">
  <EditorContent editor={$editor} />
</div>

<style>
  :global(.ProseMirror) {
    outline: none;
    min-height: 150px;
  }
  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
    float: left;
    height: 0;
  }
  :global(.ProseMirror h1) { font-size: 1.5rem; font-weight: bold; }
  :global(.ProseMirror h2) { font-size: 1.25rem; font-weight: bold; }
  :global(.ProseMirror ul) { list-style: disc; padding-left: 1.5rem; }
  :global(.ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; }
</style>