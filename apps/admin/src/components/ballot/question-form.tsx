'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createQuestion, type BallotQuestion } from '@/lib/actions/ballot';

const questionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  questionType: z.enum(['single_choice', 'multi_choice', 'ranked_choice', 'yes_no', 'write_in']),
  maxSelections: z.number().int().min(1),
  allowWriteIn: z.boolean(),
  candidates: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
    party: z.string(),
  })).min(2, 'At least 2 options required'),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  open: boolean;
  onClose: () => void;
  electionId: string;
  displayOrder: number;
  onSuccess: () => void;
  existingQuestion?: BallotQuestion;
}

export function QuestionForm({
  open,
  onClose,
  electionId,
  displayOrder,
  onSuccess,
  existingQuestion,
}: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: existingQuestion
      ? {
          title: existingQuestion.title,
          description: existingQuestion.description || '',
          questionType: existingQuestion.questionType,
          maxSelections: existingQuestion.maxSelections,
          allowWriteIn: existingQuestion.allowWriteIn,
          candidates: existingQuestion.candidates.map((c) => ({
            name: c.name,
            description: c.description || '',
            party: c.party || '',
          })),
        }
      : {
          title: '',
          description: '',
          questionType: 'single_choice',
          maxSelections: 1,
          allowWriteIn: false,
          candidates: [
            { name: '', description: '', party: '' },
            { name: '', description: '', party: '' },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'candidates',
  });

  const handleSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createQuestion({
        electionId,
        jurisdictionId: electionId, // Using election ID as default jurisdiction for now
        title: data.title,
        description: data.description || undefined,
        questionType: data.questionType,
        maxSelections: data.maxSelections,
        allowWriteIn: data.allowWriteIn,
        displayOrder,
        candidates: data.candidates.map((c) => ({
          name: c.name,
          description: c.description || undefined,
          party: c.party || undefined,
        })),
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingQuestion ? 'Edit Question' : 'Add Ballot Question'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Board of Directors - Seat 1" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional instructions for voters..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_choice">Single Choice</SelectItem>
                        <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                        <SelectItem value="ranked_choice">Ranked Choice</SelectItem>
                        <SelectItem value="yes_no">Yes/No</SelectItem>
                        <SelectItem value="write_in">Write-In Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSelections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Selections</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      For multi-choice questions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowWriteIn"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Allow write-in candidates</FormLabel>
                </FormItem>
              )}
            />

            {/* Candidates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Options / Candidates</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', description: '', party: '' })}
                >
                  Add Option
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`candidates.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Option name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`candidates.${index}.party`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Party (optional)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`candidates.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description (optional)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
              {form.formState.errors.candidates?.root && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.candidates.root.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : existingQuestion ? 'Save Changes' : 'Add Question'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
