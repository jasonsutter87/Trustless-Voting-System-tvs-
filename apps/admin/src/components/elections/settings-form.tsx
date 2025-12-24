'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Election } from '@/lib/actions/elections';

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  election: Election;
  canEditBasics: boolean;
  canEditDates: boolean;
  canEditThreshold: boolean;
}

// Format ISO date to datetime-local input format
function formatDateTimeLocal(isoDate: string): string {
  const date = new Date(isoDate);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SettingsForm({
  election,
  canEditBasics,
  canEditDates,
  canEditThreshold,
}: SettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: election.name,
      description: election.description,
      startTime: formatDateTimeLocal(election.startTime),
      endTime: formatDateTimeLocal(election.endTime),
    },
  });

  const handleSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Implement update election API
      console.log('Update election:', data);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = canEditBasics || canEditDates;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Basic Information
            </h3>
            {!canEditBasics && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                Cannot edit after election moves past draft phase
              </p>
            )}

            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Election Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEditBasics} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={!canEditBasics} />
                    </FormControl>
                    <FormDescription>
                      Additional context for voters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Schedule
            </h3>
            {!canEditDates && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                Cannot edit after voting has started
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} disabled={!canEditDates} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} disabled={!canEditDates} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Security (read-only after setup) */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Security Configuration
            </h3>
            {!canEditThreshold && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Threshold settings are locked after trustees are registered
              </p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Total Trustees
                </label>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {election.totalTrustees}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Required Threshold
                </label>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {election.threshold}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              {election.threshold} of {election.totalTrustees} trustees must participate
              to decrypt election results.
            </p>
          </div>

          {/* Status */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Election Status
            </h3>
            <div className="mt-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Current Status</p>
              <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                {election.status}
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Created on {new Date(election.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                  Settings saved successfully
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
