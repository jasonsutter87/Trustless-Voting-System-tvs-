'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { StepBasics } from './wizard-steps/step-basics';
import { StepSettings } from './wizard-steps/step-settings';
import { StepReview } from './wizard-steps/step-review';
import { createElection } from '@/lib/actions/elections';

const electionFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  threshold: z.number().int().min(1, 'Must be at least 1'),
  totalTrustees: z.number().int().min(1, 'Must be at least 1'),
}).refine((data) => data.threshold <= data.totalTrustees, {
  message: 'Threshold cannot exceed total trustees',
  path: ['threshold'],
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export type ElectionFormData = z.infer<typeof electionFormSchema>;

const STEPS = ['Basics', 'Settings', 'Review'] as const;

export function ElectionWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ElectionFormData>({
    resolver: zodResolver(electionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      threshold: 2,
      totalTrustees: 3,
    },
    mode: 'onChange',
  });

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof ElectionFormData)[] = [];

    if (step === 0) {
      fieldsToValidate = ['name'];
    } else if (step === 1) {
      fieldsToValidate = ['startTime', 'endTime', 'threshold', 'totalTrustees'];
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const values = form.getValues();

      // Convert datetime-local to ISO format
      const result = await createElection({
        name: values.name,
        description: values.description,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        threshold: values.threshold,
        totalTrustees: values.totalTrustees,
        candidates: [{ name: 'Placeholder A' }, { name: 'Placeholder B' }], // Will be replaced by ballot builder
      });

      router.push(`/elections/${result.election.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create election');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((stepName, index) => (
          <div key={stepName} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  index < step
                    ? 'bg-green-600 text-white'
                    : index === step
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {index < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  index === step
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {stepName}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-16 ${
                  index < step ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 0 && <StepBasics form={form} />}
            {step === 1 && <StepSettings form={form} />}
            {step === 2 && <StepReview form={form} />}
          </form>
        </Form>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Election'}
          </Button>
        )}
      </div>
    </div>
  );
}
