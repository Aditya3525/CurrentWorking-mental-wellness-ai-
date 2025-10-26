import {
  Heart,
  Brain,
  Users,
  Shield,
  CheckCircle,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Target,
  TrendingUp,
  Star,
  BarChart3,
  Lock,
  Smile,
  CalendarCheck,
  Globe,
  Moon,
  Sun
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';

import { ForgotPasswordDialog } from './ForgotPasswordDialog';

interface LandingPageProps {
  onSignUp: (userData: { name: string; email: string; password: string }) => void;
  onLogin: (credentials: { email: string; password: string }) => void;
  onAdminLogin?: (credentials: { email: string; password: string }) => void;
  authError?: string | null;
  loginError?: { message?: string } | null;
}

export function LandingPage({ onSignUp, onLogin, onAdminLogin, authError, loginError }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [activeModal, setActiveModal] = useState<null | 'start' | 'signup' | 'login' | 'admin'>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const isStartJourneyOpen = activeModal === 'start';
  const isSignupOpen = activeModal === 'signup';
  const isLoginOpen = activeModal === 'login';
  const isAdminOpen = activeModal === 'admin';

  const { settings: accessibilitySettings, setSetting: setAccessibilitySetting } = useAccessibility();

  const closeModal = () => setActiveModal(null);
  const openModal = (modal: Exclude<typeof activeModal, null>) => setActiveModal(modal);

  const impactStats = useMemo(
    () => [
      {
        icon: Smile,
        value: '92%',
        label: 'Feel calmer in 2 weeks',
        helper: 'Based on post-program self-reports'
      },
      {
        icon: BarChart3,
        value: '4.8/5',
        label: 'Average member rating',
        helper: 'Across 5k+ coaching sessions'
      },
      {
        icon: CalendarCheck,
        value: '3x',
        label: 'Faster habit formation',
        helper: 'When pairing practices with AI nudges'
      },
      {
        icon: Shield,
        value: '100%',
        label: 'HIPAA-ready infrastructure',
        helper: 'Built with privacy and compliance first'
      }
    ],
    []
  );

  const differentiators = useMemo(
    () => [
      {
        icon: Sparkles,
        title: 'Personalized every day',
        description: 'Adaptive plans blend therapy techniques, breathwork, and mindful rituals based on your current mood and engagement.'
      },
      {
        icon: MessageCircle,
        title: 'Empathetic AI guide',
        description: 'Evidence-based conversational AI keeps check-ins warm yet clinically grounded, escalating to humans when needed.'
      },
      {
        icon: Globe,
        title: 'Designed for every background',
        description: 'Inclusive content authored with clinicians and community advocates ensures cultural resonance and accessibility.'
      },
      {
        icon: Lock,
        title: 'Enterprise-grade security',
        description: 'Zero-trust architecture with encryption in transit and at rest, SOC 2 controls, and granular consent management.'
      }
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        question: 'Is this a replacement for therapy?',
        answer:
          'We complement—not replace—licensed care. Our platform offers psychoeducation, self-care tools, and structured check-ins, and can seamlessly hand off to clinicians when deeper support is needed.'
      },
      {
        question: 'Who can see my assessment results?',
        answer:
          'You decide. Assessments and daily reflections are private by default. You can share summaries with clinicians, loved ones, or keep them personal.'
      },
      {
        question: 'How quickly will I see results?',
        answer:
          'Most members report improved emotional awareness within the first week, and noticeable reductions in stress and anxiety within 14–21 days of consistent practice.'
      },
      {
        question: 'Do you support teams or schools?',
        answer:
          'Yes. We offer dedicated onboarding, analytics dashboards, and tailored resource packs for organizations, universities, and coaches.'
      }
    ],
    []
  );

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      onSignUp({ name, email, password });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && loginPassword) {
      onLogin({ email, password: loginPassword });
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail && adminPassword && onAdminLogin) {
      onAdminLogin({ email: adminEmail, password: adminPassword });
    }
  };

  const handleGoogleAuth = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleToggleDarkMode = () => {
    const next = !accessibilitySettings.darkMode;
    setAccessibilitySetting('darkMode', next, {
      announce: `Dark mode ${next ? 'enabled' : 'disabled'}`
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Wellbeing AI
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:inline-flex">
              Guided support for calmer, more resilient days
            </span>
          </div>
          <nav className="flex w-full items-center justify-between gap-4 text-sm text-muted-foreground md:w-auto">
            <div className="hidden items-center gap-6 md:flex">
              <a href="#how-it-works" className="transition-colors hover:text-primary">
                How it works
              </a>
              <a href="#features" className="transition-colors hover:text-primary">
                Features
              </a>
              <a href="#faq" className="transition-colors hover:text-primary">
                FAQ
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleDarkMode}
                aria-label={accessibilitySettings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={accessibilitySettings.darkMode}
                className="h-9 w-9 rounded-full border-border/60 text-muted-foreground hover:text-foreground"
              >
                {accessibilitySettings.darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" className="text-sm font-medium" onClick={() => openModal('login')}>
                Log in
              </Button>
              <Button className="text-sm font-medium" onClick={() => openModal('start')}>
                Start for free
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/20 px-6 py-16 lg:py-24">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background/80 to-transparent lg:block" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  New: Mini-IPIP personality insights
                </Badge>
                <h1 className="text-4xl font-semibold leading-tight text-foreground lg:text-6xl">
                  Your personal
                  <span className="block text-primary">mental wellbeing companion</span>
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground lg:text-xl">
                  Pair clinically grounded assessments with daily micro-practices, reflective journaling, and an empathetic AI guide who meets you exactly where you are.
                </p>
              </div>

              <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Evidence-based assessments (GAD-7, Mini-IPIP, PHQ-9)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Personalized daily plan with breathwork, therapy tips, and journaling
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Clinician-reviewed content with culturally mindful guidance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Secure data sharing controls whenever you invite your care team
                </li>
              </ul>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button size="lg" className="px-8 py-6 text-lg" onClick={() => openModal('start')}>
                  Start your journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg" onClick={() => openModal('signup')}>
                  Create account
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trusted by teams at</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/80">
                  <span className="font-semibold text-foreground">Calm Collective</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">Mindful Schools</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">Restorative Health</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Peaceful meditation scene representing mental wellbeing"
                className="h-[500px] w-full rounded-3xl object-cover shadow-2xl"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/10 to-transparent" aria-hidden="true" />
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-background/80 p-4 shadow-lg backdrop-blur">
                <p className="text-sm font-medium text-foreground">“The app is like having a compassionate coach in my pocket.”</p>
                <span className="text-xs text-muted-foreground">— Priya, Product Designer</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/20 px-6 py-12">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {impactStats.map(({ icon: Icon, value, label, helper }) => (
              <Card key={label} className="border-none bg-background shadow-sm ring-1 ring-border/60">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
                  </div>
                  <CardDescription className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{helper}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-muted/30 px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 space-y-4 text-center">
              <h2 className="text-3xl lg:text-4xl">How it works</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Three simple steps to understand and improve your mental wellbeing
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <h3 className="text-xl">Assess</h3>
                  <p className="text-muted-foreground">
                    Take science-based assessments to understand your anxiety, stress levels, and personality strengths.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <h3 className="text-xl">Understand</h3>
                  <p className="text-muted-foreground">
                    Receive clear, personalized insights and recommendations based on your mental health profile.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <h3 className="text-xl">Act</h3>
                  <p className="text-muted-foreground">
                    Follow your personalized plan combining therapy, meditation, and mindfulness practices with AI guidance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 space-y-4 text-center">
              <h2 className="text-3xl lg:text-4xl">Complete wellbeing support</h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Everything you need for your mental health journey in one compassionate platform
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-6">
                  <MessageCircle className="h-10 w-10 text-primary" />
                  <h3 className="text-lg font-semibold">AI Therapist Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    24/7 conversational support with empathetic, clinically informed AI guidance.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-6">
                  <TrendingUp className="h-10 w-10 text-primary" />
                  <h3 className="text-lg font-semibold">Progress Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor your wellbeing journey with trendlines, streaks, and progress reflections.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-6">
                  <Heart className="h-10 w-10 text-primary" />
                  <h3 className="text-lg font-semibold">Mindful Practices</h3>
                  <p className="text-sm text-muted-foreground">
                    Guided meditation, yoga, and breathing sessions curated for your current energy.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-6">
                  <Users className="h-10 w-10 text-primary" />
                  <h3 className="text-lg font-semibold">Expert Content</h3>
                  <p className="text-sm text-muted-foreground">
                    A curated library of therapeutic videos and articles authored with clinicians.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted/20 px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl space-y-12">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl lg:text-4xl">Why people choose Wellbeing AI</h2>
              <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
                Built alongside psychologists, coaches, and neurodiverse advocates to support modern mental health needs.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {differentiators.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="h-full border border-primary/10 bg-background/80 shadow-sm">
                  <CardContent className="space-y-3 p-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-5xl space-y-12 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl lg:text-4xl">Trusted by thousands</h2>
              <p className="text-lg text-muted-foreground">Real stories from members who rediscovered calm and confidence.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[{
                quote: 'This app helped me understand my anxiety patterns and gave me practical tools to manage them. The AI chat feature feels like having a therapist available anytime.',
                name: 'Sarah M.'
              },
              {
                quote: 'The personalized meditation recommendations were spot-on. I\'ve never been more consistent with my mindfulness practice.',
                name: 'David L.'
              },
              {
                quote: 'Finally, a mental health app that doesn\'t feel clinical. The interface is beautiful and the guidance feels genuinely caring.',
                name: 'Maria R.'
              }].map(({ quote, name }) => (
                <Card key={name} className="h-full border border-primary/10 bg-background/90 shadow-sm">
                  <CardContent className="space-y-4 p-6 text-left">
                    <div className="flex items-center gap-1 text-primary">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">“{quote}”</p>
                    <p className="text-sm font-medium text-foreground">— {name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <Card className="border border-primary/10 bg-background/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Security and care you can trust</CardTitle>
                <CardDescription>
                  We go beyond compliance to keep your data secure and to respond with human care when moments get tough.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Shield className="h-4 w-4 text-primary" /> Privacy-first architecture
                  </h4>
                  <p>HIPAA-ready, SOC 2 aligned infrastructure with encryption in transit and at rest.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" /> Clinical review board
                  </h4>
                  <p>Content created with licensed therapists, mindfulness teachers, and DEI advisors.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Users className="h-4 w-4 text-primary" /> Escalation-ready support
                  </h4>
                  <p>Integrated crisis resources and optional handoff to emergency contacts or clinicians.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Lock className="h-4 w-4 text-primary" /> Fine-grained consent
                  </h4>
                  <p>Control exactly what you share, with whom, and for how long.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/10 bg-primary/5 shadow-sm">
              <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">Coaching & organizational plans</h3>
                  <p className="text-sm text-muted-foreground">
                    Support for therapists, coaches, schools, and workplaces looking to bring preventative mental wellness to their communities.
                  </p>
                </div>
                <Button variant="outline" className="border-primary text-primary" onClick={() => openModal('start')}>
                  Talk to our team
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="faq" className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl">Frequently asked questions</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Still wondering if Wellbeing AI is right for you? We&apos;ve got answers.
              </p>
            </div>

            <Accordion type="single" collapsible className="rounded-xl border border-border/60 bg-background">
              {faqs.map(({ question, answer }) => (
                <AccordionItem key={question} value={question}>
                  <AccordionTrigger className="px-4 text-base font-semibold text-foreground">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 text-muted-foreground">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-6 pb-16">
          <Card className="mx-auto max-w-5xl overflow-hidden border-none bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 shadow-lg">
            <div className="grid gap-6 p-8 text-center sm:text-left md:grid-cols-[1.5fr_1fr] md:items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-foreground">
                  Ready to feel more grounded?
                </h2>
                <p className="text-muted-foreground">
                  Start your tailored journey in minutes with assessments, AI coaching, and practices selected just for you.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 md:items-end">
                <Button size="lg" className="w-full md:w-auto" onClick={() => openModal('signup')}>
                  Create your free account
                </Button>
                <Button variant="outline" size="lg" className="w-full border-primary text-primary md:w-auto" onClick={() => openModal('login')}>
                  I already have an account
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-background px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Wellbeing AI
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your personal companion for mental health and mindful living.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Privacy-first • HIPAA-ready • SOC 2 controls</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="hover:text-primary">Features</a>
                <a href="#how-it-works" className="hover:text-primary">Assessments</a>
                <button type="button" className="hover:text-primary" onClick={() => openModal('start')}>
                  AI Chat
                </button>
                <a href="#faq" className="hover:text-primary">Practices</a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a className="hover:text-primary" href="#faq">Help Center</a>
                <p>Privacy Policy</p>
                <p>Terms of Service</p>
                <p>Crisis Resources</p>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => openModal('admin')}
                >
                  Admin Access
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stay in the loop</h4>
              <p className="text-sm text-muted-foreground">
                Receive monthly wellbeing tips and product updates.
              </p>
              <form className="flex flex-col gap-2 sm:flex-row">
                <Input type="email" placeholder="you@example.com" className="bg-background" aria-label="Email address" />
                <Button type="submit" className="sm:min-w-[120px]">Subscribe</Button>
              </form>
              <div className="text-sm text-muted-foreground">
                <p>support@wellbeingai.com</p>
                <p>Emergency: 988</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/80" />

          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Wellbeing AI. All rights reserved.</p>
            <p>Made with care for people first.</p>
          </div>
        </div>
      </footer>

      <Dialog open={isStartJourneyOpen} onOpenChange={(open) => (open ? openModal('start') : closeModal())}>
        <DialogContent className="max-w-[22rem] sm:max-w-sm md:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>Start your journey</DialogTitle>
            <DialogDescription>Choose how you want to begin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => { closeModal(); handleGoogleAuth(); }}>
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full" onClick={() => openModal('signup')}>
              Create an account
            </Button>
            <Button variant="outline" className="w-full" onClick={() => openModal('login')}>
              Log in
            </Button>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="ghost" className="w-full sm:w-auto" onClick={closeModal}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignupOpen} onOpenChange={(open) => (open ? openModal('signup') : closeModal())}>
        <DialogContent className="max-w-[22rem] sm:max-w-sm md:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>Create your account</DialogTitle>
            <DialogDescription>Get personalized support, assessments, and daily nudges.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full name</Label>
              <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" minLength={6} required />
            </div>

            {authError && <p className="text-sm text-destructive" role="alert">{authError}</p>}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="flex-1">
                Get started
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
            </div>

            <Separator className="bg-border" />

            <Button type="button" variant="outline" className="flex w-full items-center gap-2" onClick={() => { closeModal(); handleGoogleAuth(); }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <button type="button" className="underline" onClick={() => openModal('login')}>
                Log in
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={(open) => (open ? openModal('login') : closeModal())}>
        <DialogContent className="max-w-[22rem] sm:max-w-sm md:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome back</DialogTitle>
            <DialogDescription>Log in to continue your wellbeing journey.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            {authError && <p className="text-sm text-destructive" role="alert">{authError}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="flex-1">
                Log in
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
            </div>

            <div className="text-right text-xs text-muted-foreground">
              <button
                type="button"
                className="text-primary underline-offset-4 transition hover:underline"
                onClick={() => {
                  closeModal();
                  setIsForgotPasswordOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>

            <Separator className="bg-border" />

            <Button type="button" variant="outline" className="flex w-full items-center gap-2" onClick={() => { closeModal(); handleGoogleAuth(); }}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              New here?{' '}
              <button type="button" className="underline" onClick={() => openModal('signup')}>
                Create an account
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdminOpen} onOpenChange={(open) => (open ? openModal('admin') : closeModal())}>
        <DialogContent className="max-w-[22rem] sm:max-w-sm md:max-w-md">
          <DialogHeader className="space-y-2 text-center">
            <Shield className="mx-auto h-10 w-10 text-primary" />
            <DialogTitle>Admin access</DialogTitle>
            <DialogDescription>Secure sign-in for administrators.</DialogDescription>
          </DialogHeader>
          {(authError || loginError?.message) && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {authError || loginError?.message}
            </div>
          )}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { closeModal(); setAdminEmail(''); setAdminPassword(''); }}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Log in as admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ForgotPasswordDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </div>
  );
}
