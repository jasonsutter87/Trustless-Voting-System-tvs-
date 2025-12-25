'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Voter, VoterInput } from '@/lib/actions/voters';

interface VoterFormProps {
  open: boolean;
  voter?: Voter | null;
  jurisdictions?: string[];
  onClose: () => void;
  onSubmit: (data: VoterInput) => Promise<void>;
}

export function VoterForm({
  open,
  voter,
  jurisdictions = [],
  onClose,
  onSubmit,
}: VoterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<VoterInput>({
    name: voter?.name || '',
    email: voter?.email || '',
    jurisdiction: voter?.jurisdiction || '',
  });

  const isEditing = !!voter;

  const handleChange = useCallback(
    (field: keyof VoterInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await onSubmit({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          jurisdiction: formData.jurisdiction?.trim() || undefined,
        });
        onClose();
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : 'Failed to save voter',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validate, onSubmit, onClose]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Voter' : 'Add Voter'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update voter information below.'
                : 'Enter voter details to add them to this election.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="John Doe"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-500" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="john@example.com"
                disabled={isEditing}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500" role="alert">
                  {errors.email}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-zinc-500">
                  Email cannot be changed after registration
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction (Optional)</Label>
              {jurisdictions.length > 0 ? (
                <select
                  id="jurisdiction"
                  value={formData.jurisdiction || ''}
                  onChange={handleChange('jurisdiction')}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  aria-label="Select jurisdiction"
                >
                  <option value="">No Jurisdiction</option>
                  {jurisdictions.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="jurisdiction"
                  value={formData.jurisdiction || ''}
                  onChange={handleChange('jurisdiction')}
                  placeholder="e.g., District 1"
                />
              )}
              <p className="text-xs text-zinc-500">
                Assign voter to a specific voting district or jurisdiction
              </p>
            </div>

            {errors.submit && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Voter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
