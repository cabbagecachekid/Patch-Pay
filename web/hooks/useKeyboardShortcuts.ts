import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;
type ShortcutMap = Record<string, ShortcutHandler>;

/**
 * Keyboard shortcuts hook
 * Supports combinations like 'ctrl+k', 'ctrl+enter', 'esc', etc.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Build the key combination string
      const keys: string[] = [];
      
      if (event.ctrlKey || event.metaKey) keys.push('ctrl');
      if (event.altKey) keys.push('alt');
      if (event.shiftKey) keys.push('shift');
      
      // Normalize key name
      const key = event.key.toLowerCase();
      if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
        keys.push(key);
      }
      
      const combination = keys.join('+');
      
      // Check if this combination has a handler
      const handler = shortcuts[combination];
      
      if (handler) {
        event.preventDefault();
        handler();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Helper to show keyboard shortcut hints
 */
export function getShortcutDisplay(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return shortcut
    .split('+')
    .map(key => {
      if (key === 'ctrl') return isMac ? '⌘' : 'Ctrl';
      if (key === 'alt') return isMac ? '⌥' : 'Alt';
      if (key === 'shift') return isMac ? '⇧' : 'Shift';
      if (key === 'enter') return '↵';
      if (key === 'escape') return 'Esc';
      return key.toUpperCase();
    })
    .join(isMac ? '' : '+');
}
