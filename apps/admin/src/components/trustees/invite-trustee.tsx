'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { registerTrustee } from '@/lib/actions/trustees';

const inviteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  publicKey: z.string().min(10, 'Public key is required'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteTrusteeProps {
  open: boolean;
  onClose: () => void;
  electionId: string;
  onSuccess: () => void;
}

export function InviteTrustee({ open, onClose, electionId, onSuccess }: InviteTrusteeProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      publicKey: '',
    },
  });

  const handleSubmit = async (data: InviteFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await registerTrustee(electionId, {
        name: data.name,
        publicKey: data.publicKey,
      });

      form.reset();
      onSuccess();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register trustee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Trustee</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trustee Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alice (Board Chair)" {...field} />
                  </FormControl>
                  <FormDescription>
                    A name to identify this trustee
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Key</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the trustee's public key..."
                      className="min-h-[100px] font-mono text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The trustee generates this key using the ceremony client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? 'Adding...' : 'Add Trustee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
