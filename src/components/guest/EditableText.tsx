'use client';

import React, { useEffect, useRef } from 'react';

interface EditableTextProps {
  value: string;
  /** Short name for screen readers, e.g. "welcome message". */
  label: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Text the couple can click and edit in place on the live preview.
 * Plain text only: pasted formatting is dropped. Enter finishes a one-line field, Escape cancels.
 */
export default function EditableText({ value, label, onCommit, multiline, placeholder, className = '', style }: EditableTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // The DOM owns the text while editing; sync it from props only when the field isn't focused.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== value) el.innerText = value;
  }, [value]);

  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={`Edit ${label}`}
      aria-multiline={multiline || undefined}
      contentEditable
      suppressContentEditableWarning
      tabIndex={0}
      data-placeholder={placeholder || `Add ${label}`}
      onBlur={(e) => {
        const next = e.currentTarget.innerText.replace(/ /g, ' ').trim();
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.currentTarget.innerText = value;
          e.currentTarget.blur();
        } else if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, multiline ? text : text.replace(/\s*\n\s*/g, ' '));
      }}
      className={`whitespace-pre-wrap rounded-md cursor-text outline-2 outline-dashed outline-offset-4 outline-transparent hover:outline-aisle-terracotta/50 focus:outline-aisle-terracotta empty:before:content-[attr(data-placeholder)] empty:before:opacity-50 ${className}`}
      style={style}
    />
  );
}
