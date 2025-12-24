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
import { Textarea } from '@/components/ui/textarea';
import type { ElectionFormData } from '../election-wizard';

interface StepBasicsProps {
  form: UseFormReturn<ElectionFormData>;
}

export function StepBasics({ form }: StepBasicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Basic Information
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Give your election a name and description.
        </p>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Election Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Board of Directors Election 2025" {...field} />
            </FormControl>
            <FormDescription>
              A clear, descriptive name for this election.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe the purpose of this election..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Additional context or instructions for voters.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
