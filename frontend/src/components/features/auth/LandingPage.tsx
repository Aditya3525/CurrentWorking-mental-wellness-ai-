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
  Sun,
  AlertTriangle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { useDevice } from '../../../hooks/use-device';
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
  const device = useDevice();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [activeModal, setActiveModal] = useState<null | 'start' | 'signup' | 'login' | 'admin'>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeFeaturesIndex, setActiveFeaturesIndex] = useState(0);
  
  const metricsContainerRef = useRef<HTMLDivElement>(null);
  const testimonialsContainerRef = useRef<HTMLDivElement>(null);
  const featuresContainerRef = useRef<HTMLDivElement>(null);

  const isStartJourneyOpen = activeModal === 'start';
  const isSignupOpen = activeModal === 'signup';
  const isLoginOpen = activeModal === 'login';
  const isAdminOpen = activeModal === 'admin';

  const { settings: accessibilitySettings, setSetting: setAccessibilitySetting } = useAccessibility();

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Metrics carousel intersection observer
  useEffect(() => {
    const container = metricsContainerRef.current;
    if (!container || !device.isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(container.children).indexOf(entry.target);
            if (index !== -1) setActiveMetricIndex(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [device.isMobile]);

  // Testimonials carousel intersection observer
  useEffect(() => {
    const container = testimonialsContainerRef.current;
    if (!container || !device.isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(container.children).indexOf(entry.target);
            if (index !== -1) setActiveTestimonialIndex(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [device.isMobile]);

  // Auto-slide testimonials carousel
  useEffect(() => {
    if (!device.isMobile) return;
    
    const interval = setInterval(() => {
      const container = testimonialsContainerRef.current;
      if (!container) return;
      
      setActiveTestimonialIndex((prev) => {
        const next = (prev + 1) % 3; // Loop back to 0 after 2
        const child = container.children[next] as HTMLElement;
        child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return next;
      });
    }, 2000); // 2 second delay

    return () => clearInterval(interval);
  }, [device.isMobile]);

  // Features carousel intersection observer
  useEffect(() => {
    const container = featuresContainerRef.current;
    if (!container || !device.isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(container.children).indexOf(entry.target);
            if (index !== -1) setActiveFeaturesIndex(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [device.isMobile]);

  // Auto-slide features carousel
  useEffect(() => {
    if (!device.isMobile) return;
    
    const interval = setInterval(() => {
      const container = featuresContainerRef.current;
      if (!container) return;
      
      setActiveFeaturesIndex((prev) => {
        const next = (prev + 1) % 4; // Loop back to 0 after 3
        const child = container.children[next] as HTMLElement;
        child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return next;
      });
    }, 1800); // 1.8 second delay

    return () => clearInterval(interval);
  }, [device.isMobile]);

  const closeModal = () => setActiveModal(null);
  const openModal = (modal: Exclude<typeof activeModal, null>) => {
    setActiveModal(modal);
    setMobileMenuOpen(false); // Close mobile menu when opening a modal
  };

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
    // Redirect to Google OAuth endpoint - use smart URL detection
    const hostname = window.location.hostname;
    const apiUrl = hostname === 'localhost' || hostname === '127.0.0.1' 
      ? 'http://localhost:5000' 
      : `http://${hostname}:5000`;
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleToggleDarkMode = () => {
    const next = !accessibilitySettings.darkMode;
    setAccessibilitySetting('darkMode', next, {
      announce: `Dark mode ${next ? 'enabled' : 'disabled'}`
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Responsive Sticky Header */}
      <header 
        className={`
          sticky top-0 z-50 border-b bg-background/95 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-background/75
          ${isHeaderSticky ? 'shadow-md' : ''}
        `}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:py-4">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary sm:px-3">
              MaanaSarathi
            </Badge>
            <span className="hidden text-xs text-muted-foreground sm:text-sm lg:inline-flex">
              Guided support for calmer days
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#how-it-works" className="transition-colors hover:text-primary">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-primary">
              Features
            </a>
            <a href="#faq" className="transition-colors hover:text-primary">
              FAQ
            </a>
          </nav>

          {/* CTA Buttons & Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleDarkMode}
              aria-label={accessibilitySettings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={accessibilitySettings.darkMode}
              className="h-9 w-9 rounded-full border-border/60 text-muted-foreground hover:text-foreground sm:h-10 sm:w-10"
            >
              {accessibilitySettings.darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile: Compact Start Button */}
            <Button 
              className="h-9 px-3 text-sm font-medium sm:h-10 sm:px-4 lg:hidden" 
              onClick={() => openModal('start')}
            >
              Start free
            </Button>

            {/* Desktop: Full Buttons */}
            <div className="hidden items-center gap-3 lg:flex">
              <Button variant="ghost" className="text-sm font-medium" onClick={() => openModal('login')}>
                Log in
              </Button>
              <Button className="text-sm font-medium" onClick={() => openModal('start')}>
                Start for free
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t bg-background px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-3">
              <a 
                href="#how-it-works" 
                className="flex h-11 min-h-[44px] items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it works
              </a>
              <a 
                href="#features" 
                className="flex h-11 min-h-[44px] items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#faq" 
                className="flex h-11 min-h-[44px] items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <Separator className="my-2" />
              <Button 
                variant="ghost" 
                className="h-11 min-h-[44px] justify-start text-sm font-medium" 
                onClick={() => openModal('login')}
              >
                Log in
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/20 px-6 py-20 lg:py-28">
          {/* Animated Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          </div>
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background/80 to-transparent lg:block" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <Badge variant="secondary" className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm hover:shadow-md transition-all hover:scale-105">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  New: Mini-IPIP personality insights
                </Badge>
                <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-6xl xl:text-7xl">
                  <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">MaanaSarathi</span>
                  <span className="block mt-2">Your personal wellbeing companion</span>
                </h1>
                <p className="text-lg leading-relaxed text-muted-foreground lg:text-xl max-w-2xl">
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
                <Button size="lg" className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group" onClick={() => openModal('start')}>
                  Start your journey
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-medium border-2 hover:border-primary/50 transition-all" onClick={() => openModal('signup')}>
                  Create account
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trusted by teams at</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/80">
                  <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-default">Mindful Care</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-default">Wellness Institute</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-default">Serenity Health</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Peaceful meditation scene representing wellbeing"
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

        {/* Metrics Section - Responsive Carousel on Mobile */}
        <section className="border-y bg-muted/20 px-4 py-12 sm:px-6" id="metrics">
          <div className="mx-auto max-w-7xl">
            <h2 className="sr-only">Impact Metrics</h2>
            
            {/* Mobile: Swipeable Carousel */}
            <div className="md:hidden">
              <div 
                ref={metricsContainerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="region"
                aria-label="Impact metrics carousel"
              >
                {impactStats.map(({ icon: Icon, value, label, helper }, index) => (
                  <Card 
                    key={label}
                    className="min-w-[85vw] flex-shrink-0 snap-center border-none bg-background shadow-sm ring-1 ring-border/60"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`Metric ${index + 1} of ${impactStats.length}: ${label}`}
                  >
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </span>
                      <p className="text-4xl font-bold text-foreground">{value}</p>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">{label}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{helper}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination Dots */}
              <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Metrics pagination">
                {impactStats.map((stat, index) => (
                  <button
                    key={stat.label}
                    role="tab"
                    aria-selected={activeMetricIndex === index}
                    aria-label={`View metric ${index + 1} of ${impactStats.length}: ${stat.label}`}
                    className={`h-2 w-2 rounded-full transition-all ${
                      activeMetricIndex === index 
                        ? 'w-6 bg-primary' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    onClick={() => {
                      const container = metricsContainerRef.current;
                      const child = container?.children[index] as HTMLElement;
                      child?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                      });
                      setActiveMetricIndex(index);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tablet: 2x2 Grid */}
            <div className="hidden grid-cols-2 gap-6 md:grid lg:hidden">
              {impactStats.map(({ icon: Icon, value, label, helper }) => (
                <Card key={label} className="border-none bg-background shadow-sm ring-1 ring-border/60">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="text-4xl font-bold text-foreground">{value}</p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">{label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop: 4-column Grid */}
            <div className="hidden gap-6 lg:grid lg:grid-cols-4">
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
          </div>
        </section>

        {/* How It Works Section - Mobile Vertical List */}
        <section id="how-it-works" className="bg-muted/30 px-4 py-12 sm:px-6 md:py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 space-y-3 text-center md:mb-16 md:space-y-4">
              <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">How it works</h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
                Three simple steps to understand and improve your wellbeing
              </p>
            </div>

            {/* Mobile: Vertical List with Connector Line */}
            <ol className="relative space-y-8 md:hidden">
              {/* Connector Line */}
              <div 
                className="absolute left-6 top-10 bottom-10 w-0.5 bg-border"
                aria-hidden="true"
              />

              <li className="relative flex gap-4">
                <div className="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Assess</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Take science-based assessments to understand your anxiety, stress levels, and personality strengths.
                  </p>
                </div>
              </li>

              <li className="relative flex gap-4">
                <div className="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Understand</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Receive clear, personalized insights and recommendations based on your mental health profile.
                  </p>
                </div>
              </li>

              <li className="relative flex gap-4">
                <div className="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Act</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Follow your personalized plan combining therapy, meditation, and mindfulness practices with AI guidance.
                  </p>
                </div>
              </li>
            </ol>

            {/* Tablet+: Card Grid */}
            <div className="hidden gap-6 md:grid md:gap-8 lg:grid-cols-3">
              <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-6 text-center md:p-8">
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
                <CardContent className="space-y-4 p-6 text-center md:p-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <h3 className="text-xl">Understand</h3>
                  <p className="text-muted-foreground">
                    Receive clear, personalized insights and recommendations based on your wellbeing profile.
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 transition-colors hover:border-primary/20">
                <CardContent className="space-y-4 p-6 text-center md:p-8">
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

        {/* Features Section - Mobile Horizontal Carousel */}
        <section id="features" className="px-4 py-12 sm:px-6 md:py-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 space-y-3 text-center md:mb-12 md:space-y-4 lg:mb-16">
              <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">Complete wellbeing support</h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
                Everything you need for your wellbeing journey in one compassionate platform
              </p>
            </div>

            {/* Mobile: Horizontal Carousel */}
            <div className="md:hidden">
              <div 
                ref={featuresContainerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <Card className="min-w-[90vw] flex-shrink-0 snap-center border-2 transition-colors hover:border-primary/20">
                  <CardContent className="space-y-3 p-6">
                    <MessageCircle className="h-10 w-10 text-primary" />
                    <h3 className="text-lg font-semibold">AI Therapist Chat</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      24/7 conversational support with empathetic, clinically informed AI guidance.
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-[90vw] flex-shrink-0 snap-center border-2 transition-colors hover:border-primary/20">
                  <CardContent className="space-y-3 p-6">
                    <TrendingUp className="h-10 w-10 text-primary" />
                    <h3 className="text-lg font-semibold">Progress Tracking</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Monitor your wellbeing journey with trendlines, streaks, and progress reflections.
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-[90vw] flex-shrink-0 snap-center border-2 transition-colors hover:border-primary/20">
                  <CardContent className="space-y-3 p-6">
                    <Heart className="h-10 w-10 text-primary" />
                    <h3 className="text-lg font-semibold">Mindful Practices</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Guided meditation, yoga, and breathing sessions curated for your current energy.
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-[90vw] flex-shrink-0 snap-center border-2 transition-colors hover:border-primary/20">
                  <CardContent className="space-y-3 p-6">
                    <Users className="h-10 w-10 text-primary" />
                    <h3 className="text-lg font-semibold">Expert Content</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      A curated library of therapeutic videos and articles authored with clinicians.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Indicators */}
              <div className="mt-6 flex justify-center gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeFeaturesIndex === index 
                        ? 'w-8 bg-primary' 
                        : 'w-1.5 bg-muted-foreground/30'
                    }`}
                    aria-label={`Feature ${index + 1} of 4`}
                  />
                ))}
              </div>
            </div>

            {/* Tablet: 2x2 Grid */}
            <div className="hidden gap-6 md:grid md:grid-cols-2 lg:hidden">
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

            {/* Desktop: 4-column Grid */}
            <div className="hidden gap-6 lg:grid lg:grid-cols-4">
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
                Built alongside psychologists, coaches, and neurodiverse advocates to support modern wellbeing needs.
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

        <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/5 to-background px-4 py-16 sm:px-6 md:py-20 lg:py-28" id="testimonials">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/4 -left-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-1/4 -right-12 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-12 space-y-4 text-center md:mb-16">
              <Badge variant="secondary" className="mb-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <Heart className="mr-1.5 inline-block h-3.5 w-3.5" />
                User Stories
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
                Trusted by <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">thousands</span>
              </h2>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl">
                Real stories from members who rediscovered calm, confidence, and joy in their daily lives.
              </p>
            </div>

            {/* Mobile: Enhanced Swipeable Cards */}
            <div className="md:hidden">
              <div 
                ref={testimonialsContainerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="region"
                aria-label="Testimonials carousel"
                aria-roledescription="carousel"
              >
                {[{
                  quote: 'This app helped me understand my anxiety patterns and gave me practical tools to manage them. The AI chat feature feels like having a therapist available anytime.',
                  name: 'Sarah Mitchell',
                  role: 'Product Designer',
                  rating: 5
                },
                {
                  quote: 'The personalized meditation recommendations were spot-on. I\'ve never been more consistent with my mindfulness practice. The progress tracking keeps me motivated.',
                  name: 'David Chen',
                  role: 'Software Engineer',
                  rating: 5
                },
                {
                  quote: 'Finally, a wellbeing app that doesn\'t feel clinical. The interface is beautiful and the guidance feels genuinely caring. It\'s become part of my daily routine.',
                  name: 'Maria Rodriguez',
                  role: 'Teacher',
                  rating: 5
                }].map(({ quote, name, role, rating }, index) => (
                  <div 
                    key={name} 
                    className="min-w-[90vw] flex-shrink-0 snap-center"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`Testimonial ${index + 1} of 3`}
                  >
                    <Card className="group relative overflow-hidden border-2 border-primary/10 bg-background/95 shadow-lg backdrop-blur hover:border-primary/20 hover:shadow-xl transition-all">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <CardContent className="relative space-y-5 p-6">
                        {/* Quote Icon */}
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageCircle className="h-6 w-6" />
                          </div>
                          <div className="flex items-center gap-1" aria-label={`${rating} star rating`}>
                            {Array.from({ length: rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
                            ))}
                          </div>
                        </div>
                        
                        {/* Quote */}
                        <blockquote className="text-base leading-relaxed text-foreground">
                          &ldquo;{quote}&rdquo;
                        </blockquote>
                        
                        {/* Author */}
                        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-bold text-primary">
                            {name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">{role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Enhanced Navigation */}
              <div className="mt-8 flex flex-col items-center gap-4">
                {/* Progress Bar */}
                <div className="w-full max-w-xs">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out"
                      style={{ width: `${((activeTestimonialIndex + 1) / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-2"
                    onClick={() => {
                      const newIndex = Math.max(0, activeTestimonialIndex - 1);
                      const container = testimonialsContainerRef.current;
                      const child = container?.children[newIndex] as HTMLElement;
                      child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      setActiveTestimonialIndex(newIndex);
                    }}
                    aria-label="Previous testimonial"
                    disabled={activeTestimonialIndex === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                    <span className="text-sm font-semibold text-foreground">{activeTestimonialIndex + 1}</span>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">3</span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-2"
                    onClick={() => {
                      const newIndex = Math.min(2, activeTestimonialIndex + 1);
                      const container = testimonialsContainerRef.current;
                      const child = container?.children[newIndex] as HTMLElement;
                      child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      setActiveTestimonialIndex(newIndex);
                    }}
                    aria-label="Next testimonial"
                    disabled={activeTestimonialIndex === 2}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                Testimonial {activeTestimonialIndex + 1} of 3
              </div>
            </div>

            {/* Tablet+: Original 3-column Grid */}
            <div className="hidden gap-8 md:grid md:grid-cols-3">
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

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:mt-16 lg:mt-20">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary lg:text-4xl">5,000+</p>
                <p className="mt-1 text-sm text-muted-foreground">Active Members</p>
              </div>
              <div className="h-12 w-px bg-border" aria-hidden="true" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary lg:text-4xl">4.8/5</p>
                <p className="mt-1 text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div className="h-12 w-px bg-border" aria-hidden="true" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary lg:text-4xl">92%</p>
                <p className="mt-1 text-sm text-muted-foreground">Feel Better</p>
              </div>
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
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
            <div className="px-4 text-center sm:px-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl">Frequently asked questions</h2>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground">
                Still wondering if Wellbeing AI is right for you? We&apos;ve got answers.
              </p>
            </div>

            <Accordion type="single" collapsible className="rounded-xl border border-border/60 bg-background">
              {faqs.map(({ question, answer }) => (
                <AccordionItem key={question} value={question}>
                  <AccordionTrigger className="px-3 text-left text-sm font-semibold text-foreground sm:px-4 sm:text-base">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="px-3 text-sm text-muted-foreground sm:px-4 sm:text-base">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-6 pb-16">
          <Card className="mx-auto max-w-5xl overflow-hidden border-none bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 shadow-lg">
            <div className="grid gap-6 p-6 text-center sm:p-8 sm:text-left md:grid-cols-[1.5fr_1fr] md:items-center">
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  Ready to feel more grounded?
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Start your tailored journey in minutes with assessments, AI coaching, and practices selected just for you.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 md:items-end">
                <Button size="lg" className="h-12 w-full md:w-auto" onClick={() => openModal('signup')}>
                  Create your free account
                </Button>
                <Button variant="outline" size="lg" className="h-12 w-full border-primary text-primary md:w-auto" onClick={() => openModal('login')}>
                  I already have an account
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-muted/20 px-4 py-8 sm:px-6 md:px-8 md:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl space-y-6 md:space-y-12">
          {/* Priority Actions Section (Mobile First) */}
          <div className="space-y-4 lg:hidden">
            {/* Crisis Support - Always Visible */}
            <div className="rounded-lg border-2 border-red-600 bg-red-50 p-4 dark:bg-red-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-500" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">Crisis Support Available 24/7</h3>
                  <p className="text-xs text-red-800 dark:text-red-200">If you&apos;re in immediate danger, call emergency services.</p>
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                    <a 
                      href="tel:988" 
                      className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      aria-label="Call 988 Suicide and Crisis Lifeline"
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call 988
                    </a>
                    <a 
                      href="/crisis" 
                      className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md border border-red-600 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      More Resources
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="flex flex-col gap-2 rounded-lg bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Need Help?</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a 
                  href="mailto:support@wellbeingai.com" 
                  className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Email Support
                </a>
                <a 
                  href="#faq" 
                  className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Help Center
                </a>
              </div>
            </div>
          </div>

          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Brand Column */}
            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">Wellbeing AI</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                Evidence-based wellbeing support, anytime, anywhere.
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-background/60 p-3">
                <Shield className="h-4 w-4 text-primary" />
                <a href="/privacy" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Privacy-first
                </a>
                <span className="text-xs text-muted-foreground">•</span>
                <a href="/compliance" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  HIPAA-ready
                </a>
                <span className="text-xs text-muted-foreground">•</span>
                <a href="/security" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  SOC 2
                </a>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center gap-2 pt-2" role="group" aria-label="Social media links">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-lg bg-background/80 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Follow us on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-lg bg-background/80 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Follow us on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-lg bg-background/80 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Follow us on Instagram"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>

              {/* Desktop Crisis Support */}
              <div className="hidden rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30 lg:block">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-900 dark:text-red-100">Crisis Support 24/7</p>
                    <a 
                      href="tel:988" 
                      className="inline-flex items-center text-sm font-bold text-red-700 underline-offset-2 hover:underline dark:text-red-400"
                    >
                      Call 988
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Column */}
            <nav className="space-y-4" aria-labelledby="footer-product">
              <h4 id="footer-product" className="text-sm font-semibold text-foreground">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="#features" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    How it works
                  </a>
                </li>
                <li>
                  <button 
                    type="button" 
                    className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4" 
                    onClick={() => openModal('start')}
                  >
                    AI Chat
                  </button>
                </li>
                <li>
                  <a href="#features" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Assessments
                  </a>
                </li>
                <li>
                  <a href="#features" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Practices
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Pricing
                  </a>
                </li>
              </ul>
            </nav>

            {/* Company Column */}
            <nav className="space-y-4" aria-labelledby="footer-company">
              <h4 id="footer-company" className="text-sm font-semibold text-foreground">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="/about" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    About us
                  </a>
                </li>
                <li>
                  <a href="/careers" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/blog" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/press" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Press Kit
                  </a>
                </li>
                <li>
                  <a href="/partners" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Partners
                  </a>
                </li>
              </ul>
            </nav>

            {/* Resources Column */}
            <nav className="space-y-4" aria-labelledby="footer-resources">
              <h4 id="footer-resources" className="text-sm font-semibold text-foreground">Resources</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <a href="#faq" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/contact" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="inline-flex items-center transition-colors hover:text-primary hover:underline underline-offset-4">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/crisis" className="inline-flex items-center text-red-600 transition-colors hover:text-red-700 hover:underline underline-offset-4">
                    Crisis Resources
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    className="inline-flex items-center text-xs opacity-50 transition-opacity hover:opacity-100"
                    onClick={() => openModal('admin')}
                  >
                    Admin Access
                  </button>
                </li>
              </ul>
            </nav>

            {/* Newsletter Column - Enhanced with validation & consent */}
            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <h4 className="text-sm font-semibold text-foreground">Stay Connected</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Monthly wellbeing tips and mindfulness practices.
              </p>
              <form 
                className="space-y-3" 
                onSubmit={(e) => { 
                  e.preventDefault();
                  // Form validation and submission logic would go here
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="newsletter-email" className="text-xs text-muted-foreground">
                    Email address
                  </Label>
                  <Input 
                    id="newsletter-email"
                    type="email" 
                    placeholder="your@email.com" 
                    className="h-11 bg-background text-sm" 
                    aria-label="Email address for newsletter" 
                    aria-describedby="newsletter-consent"
                    inputMode="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-11 w-full text-sm font-medium"
                >
                  Subscribe
                </Button>
                <p id="newsletter-consent" className="text-xs leading-relaxed text-muted-foreground">
                  By subscribing, you agree to our{' '}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </a>
                  . Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>

          {/* Back to Top Button */}
          <div className="flex justify-center pt-4 lg:hidden">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex h-11 min-w-[44px] items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Scroll back to top of page"
            >
              <ArrowRight className="h-4 w-4 rotate-[-90deg]" />
              Back to top
            </button>
          </div>

          <Separator className="bg-border/60" />

          {/* Bottom Bar - Legal & Copyright */}
          <div className="flex flex-col gap-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p className="flex items-center gap-1">
              © {new Date().getFullYear()} Wellbeing AI. All rights reserved.
            </p>
            
            {/* Legal Links */}
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6" aria-label="Legal and compliance links">
              <a href="/privacy" className="transition-colors hover:text-foreground hover:underline underline-offset-4">
                Privacy
              </a>
              <a href="/terms" className="transition-colors hover:text-foreground hover:underline underline-offset-4">
                Terms
              </a>
              <a href="/cookies" className="transition-colors hover:text-foreground hover:underline underline-offset-4">
                Cookies
              </a>
              <button
                type="button"
                className="transition-colors hover:text-foreground hover:underline underline-offset-4"
                onClick={() => {
                  // Cookie preferences modal would open here
                  console.log('Manage cookie preferences');
                }}
              >
                Manage Cookies
              </button>
              <a href="/accessibility" className="transition-colors hover:text-foreground hover:underline underline-offset-4">
                Accessibility
              </a>
            </nav>
            
            <p className="flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-red-500" aria-hidden="true" />
              <span>Made for people first</span>
            </p>
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
