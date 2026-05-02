/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Triggers a file download in the browser using a Blob.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  if (typeof document === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a file download in the browser using a URL string (e.g. data URL).
 */
export const downloadURL = (url: string, filename: string): void => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
