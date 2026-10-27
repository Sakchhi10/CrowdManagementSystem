import { useLayoutEffect, useRef } from 'react';

const MASK = '*';

// Password field that shows "*" per character instead of the browser's dots.
// The input only ever holds the mask; edits are mapped back onto the real value
// using the selection from before the change and the caret position after it.
export default function MaskedPasswordInput({ value, onChange, visible, ...props }) {
  const inputRef = useRef(null);
  const selection = useRef({ start: 0, end: 0 });
  const caret = useRef(null);

  const rememberSelection = (e) => {
    selection.current = { start: e.target.selectionStart ?? 0, end: e.target.selectionEnd ?? 0 };
  };

  const handleChange = (e) => {
    const next = e.target.value;
    if (visible) {
      onChange(next);
      return;
    }
    const cursor = e.target.selectionEnd ?? next.length;
    const prefix = Math.min(selection.current.start, cursor);
    const suffix = next.length - cursor;
    onChange(value.slice(0, prefix) + next.slice(prefix, cursor) + value.slice(value.length - suffix));
    caret.current = cursor;
    selection.current = { start: cursor, end: cursor };
  };

  // Swapping the typed character for "*" resets the caret to the end; put it back.
  useLayoutEffect(() => {
    if (caret.current !== null && inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(caret.current, caret.current);
    }
    caret.current = null;
  }, [value]);

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      value={visible ? value : MASK.repeat(value.length)}
      onChange={handleChange}
      onSelect={rememberSelection}
      onKeyDown={rememberSelection}
      onMouseUp={rememberSelection}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );
}
