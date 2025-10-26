import { CheckCircle2, KeyRound, MailQuestion } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { requestSecurityQuestion, resetPasswordWithSecurityAnswer } from '../../../services/auth';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  afterSuccess?: () => void;
}

type Step = 'request' | 'verify' | 'success';

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onOpenChange, afterSuccess }) => {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep('request');
      setEmail('');
      setQuestion(null);
      setAnswer('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setInfoMessage(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleRequestQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestSecurityQuestion(email);
      if (!result.questionAvailable || !result.question) {
        setInfoMessage('If this email is registered, we\'ll send additional recovery instructions.');
        return;
      }

      setQuestion(result.question);
      setStep('verify');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to look up your security question. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError('Please provide the answer you set previously.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordWithSecurityAnswer({ email, answer, password: newPassword });
      setStep('success');
      setInfoMessage(null);
      if (afterSuccess) {
        afterSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Security verification failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'request':
        return (
          <form className="space-y-5" onSubmit={handleRequestQuestion}>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Registered email address</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            {infoMessage && (
              <Alert variant="default">
                <AlertDescription>{infoMessage}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Unable to proceed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Looking up question…' : 'Continue'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        );
      case 'verify':
        return (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <Label>Security question</Label>
              <p className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{question}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-answer">Your answer</Label>
              <Input
                id="security-answer"
                type="text"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type the answer you provided"
                required
              />
            </div>
            <Separator className="bg-border" />
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Unable to reset password</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying…' : 'Reset password'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('request')} disabled={isSubmitting}>
                Back
              </Button>
            </div>
          </form>
        );
      case 'success':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/10 p-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-base font-semibold">Password updated</h3>
                <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Return to login
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {step === 'request' && <MailQuestion className="h-4 w-4" />}
            {step === 'verify' && <KeyRound className="h-4 w-4" />}
            {step === 'success' && <CheckCircle2 className="h-4 w-4" />}
            <span>{step === 'success' ? 'All set' : 'Account recovery'}</span>
          </div>
          <DialogTitle>{step === 'success' ? 'Password reset successful' : 'Forgot password'}</DialogTitle>
          {step !== 'success' && (
            <DialogDescription>
              {step === 'request'
                ? 'We use your security question to verify it’s really you before resetting your password.'
                : 'Answer your security question and set a new password to regain access.'}
            </DialogDescription>
          )}
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
