'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ElectionFormData } from '../election-wizard';

interface StepSettingsProps {
  form: UseFormReturn<ElectionFormData>;
}

export function StepSettings({ form }: StepSettingsProps) {
  const totalTrustees = form.watch('totalTrustees');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Election Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure voting dates and security thresholds.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>
                When voting opens.
              </FormDescription>
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
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>
                When voting closes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Threshold Key Security
        </h3>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configure how many trustees are needed to decrypt results.
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="totalTrustees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Trustees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription>
                  Number of key holders.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Threshold</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={totalTrustees || 10}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription>
                  Minimum trustees needed to decrypt.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
          {form.watch('threshold')} of {totalTrustees} trustees must participate to reveal results.
        </p>
      </div>
    </div>
  );
}
