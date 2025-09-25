import React, { useEffect, useState } from 'react';
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
  const testSMTPConnection = useAppStore((state) => state.testSMTPConnection);
  const sendTestEmail = useAppStore((state) => state.sendTestEmail);
  const loadSmtpSettings = useAppStore((state) => state.loadSmtpSettings);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
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
    // Load SMTP settings when component mounts
    loadSmtpSettings();
  }, [loadSmtpSettings]);

  useEffect(() => {
    if (smtpSettings) {
      form.reset(smtpSettings);
    }
  }, [smtpSettings, form]);
  const onSubmit = async (data: SmtpSettingsFormData) => {
    try {
      await updateSettings(data);
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await testSMTPConnection();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsTesting(true);
    try {
      await sendTestEmail(testEmail);
    } finally {
      setIsTesting(false);
    }
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
            <CardDescription>
              Configure SMTP settings for email reminders. Make sure your backend server is running on port 3001.
              <br />
              <strong>Note:</strong> For Gmail, you'll need to use an App Password instead of your regular password.
              <br />
              Settings will be saved even if the connection test fails - you can test your credentials separately.
            </CardDescription>
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
                      <p className="text-sm text-muted-foreground">
                        For Gmail: Use an App Password, not your regular password. 
                        <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          Learn how to create one
                        </a>
                      </p>
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleTestConnection}
                      disabled={isTesting || form.formState.isSubmitting}
                    >
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Send Test Email</h3>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={handleSendTestEmail}
                        disabled={isTesting || !testEmail}
                      >
                        {isTesting ? 'Sending...' : 'Send Test'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Send a test email to verify your SMTP configuration is working correctly.
                    </p>
                  </div>
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