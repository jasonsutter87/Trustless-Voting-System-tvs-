'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ImportResult } from '@/lib/actions/voters';

interface VoterImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<ImportResult>;
}

type ImportState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export function VoterImport({ open, onClose, onImport }: VoterImportProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState('idle');
    setFile(null);
    setResult(null);
    setError(null);
  }, []);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setState('selected');
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files?.[0] || null);
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files?.[0] || null);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setState('uploading');
    setError(null);

    try {
      const importResult = await onImport(file);
      setResult(importResult);
      setState(importResult.failed > 0 ? 'error' : 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setState('error');
    }
  }, [file, onImport]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Voters from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with voter information. The file should have columns for name, email,
            and optionally jurisdiction.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {(state === 'idle' || state === 'selected') && (
            <>
              <div
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleInputChange}
                  className="hidden"
                  aria-label="Select CSV file"
                />

                <svg
                  className="mb-4 h-12 w-12 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                {file ? (
                  <div className="text-center">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{file.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setState('idle');
                      }}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Drag and drop a CSV file here, or
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  CSV Format
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Your CSV should include the following columns:
                </p>
                <code className="mt-2 block rounded bg-zinc-200 p-2 text-xs dark:bg-zinc-800">
                  name,email,jurisdiction
                  <br />
                  John Doe,john@example.com,District 1
                  <br />
                  Jane Smith,jane@example.com,District 2
                </code>
                <p className="mt-2 text-xs text-zinc-500">
                  The jurisdiction column is optional.
                </p>
              </div>
            </>
          )}

          {state === 'uploading' && (
            <div className="flex flex-col items-center py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">Importing voters...</p>
            </div>
          )}

          {(state === 'success' || (state === 'error' && result)) && result && (
            <div className="space-y-4">
              <div
                className={`rounded-lg border p-4 ${
                  result.failed > 0
                    ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
                    : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.failed > 0 ? (
                    <svg
                      className="h-6 w-6 text-amber-600 dark:text-amber-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      Import {result.failed > 0 ? 'Completed with Errors' : 'Successful'}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {result.imported} voters imported
                      {result.failed > 0 && `, ${result.failed} failed`}
                    </p>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{err.row}</td>
                          <td className="px-3 py-2 text-red-600 dark:text-red-400">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.errors.length > 10 && (
                    <p className="p-2 text-center text-xs text-zinc-500">
                      And {result.errors.length - 10} more errors...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {state === 'error' && !result && error && (
            <div className="flex flex-col items-center py-8">
              <svg
                className="h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
              <Button type="button" variant="outline" size="sm" onClick={reset} className="mt-4">
                Try Again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {(state === 'idle' || state === 'selected') && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleImport} disabled={!file}>
                Import Voters
              </Button>
            </>
          )}
          {(state === 'success' || (state === 'error' && result)) && (
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
