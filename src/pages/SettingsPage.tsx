import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
const smtpSettingsSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  user: z.string().min(1, 'Username is required'),
  pass: z.string().min(1, 'Password is required'),
});
type SmtpSettingsFormData = z.infer<typeof smtpSettingsSchema>;
export function SettingsPage() {
  const smtpSettings = useAppStore((state) => state.smtpSettings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const form = useForm<SmtpSettingsFormData>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: {
      host: '',
      port: 587,
      user: '',
      pass: '',
    },
  });
  useEffect(() => {
    if (smtpSettings) {
      form.reset(smtpSettings);
    }
  }, [smtpSettings, form]);
  const onSubmit = (data: SmtpSettingsFormData) => {
    updateSettings(data).then(() => {
        toast.success('Settings saved successfully!');
    }).catch(() => {
        toast.error('Failed to save settings.');
    });
  };
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Application Settings</CardTitle>
            <CardDescription>Configure settings for task reminders. This is a mock setup and does not send real emails.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="587" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username</FormLabel>
                      <FormControl>
                        <Input placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
         <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>Built with ❤️ for productivity</p>
        </div>
      </div>
    </div>
  );
}