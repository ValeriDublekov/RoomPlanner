/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checks if the user is currently typing in an input field or textarea.
 * Used to guard keyboard shortcuts from firing while typing.
 */
export const isUserTyping = (e: KeyboardEvent | React.KeyboardEvent): boolean => {
  const target = e.target as HTMLElement;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
};

/**
 * Checks if a keyboard event is a "Global Command" (Undo, Redo, Copy, Paste).
 * These should usually be prioritized or handled specially.
 */
export const isGlobalCommand = (e: KeyboardEvent | React.KeyboardEvent): boolean => {
  const isMod = e.ctrlKey || e.metaKey;
  if (!isMod) return false;
  
  const key = e.key.toLowerCase();
  return ['z', 'c', 'v', 'y', 'g'].includes(key);
};
