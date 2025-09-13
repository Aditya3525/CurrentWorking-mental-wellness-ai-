import React, { useState } from 'react';
import { Heart, Brain, Users, Shield, CheckCircle, Sparkles, ArrowRight, MessageCircle, Target, TrendingUp, X } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface LandingPageProps {
  onSignUp: (userData: { name: string; email: string; password: string }) => void;
  onLogin: (credentials: { email: string; password: string }) => void;
  onNavigate?: (page: string) => void;
  authError?: string | null;
}

export function LandingPage({ onSignUp, onLogin, onNavigate, authError }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showStartJourney, setShowStartJourney] = useState(false);

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

  const handleGoogleAuth = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/20 px-6 pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Admin Link in top right corner */}
        {onNavigate && (
          <div className="absolute top-4 right-6 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('admin-login')}
              className="bg-white/90 backdrop-blur-sm border-primary/20 text-primary hover:bg-primary hover:text-white shadow-sm"
            >
              🔐 Admin
            </Button>
          </div>
        )}
        
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-semibold text-foreground leading-tight">
                  Your Personal
                  <span className="text-primary block">Wellbeing Companion</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Discover personalized insights, therapeutic guidance, and mindful practices 
                  powered by AI. Take control of your mental wellbeing journey with science-backed assessments and compassionate support.
                </p>
              </div>

              {/* Trust Bar */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Privacy First</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Science-Based</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>24/7 Support</span>
                </div>
              </div>

              {/* Unified Start Journey CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => setShowStartJourney(true)}
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Peaceful meditation scene representing mental wellbeing"
                className="rounded-3xl shadow-2xl w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/10 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 px-6 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to understand and improve your mental wellbeing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <h3 className="text-xl">Assess</h3>
                <p className="text-muted-foreground">
                  Take science-based assessments to understand your anxiety, stress levels, 
                  and emotional intelligence patterns.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <h3 className="text-xl">Understand</h3>
                <p className="text-muted-foreground">
                  Receive clear, personalized insights and recommendations based on 
                  your unique mental health profile.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <h3 className="text-xl">Act</h3>
                <p className="text-muted-foreground">
                  Follow your personalized plan combining therapy, meditation, 
                  and mindfulness practices with AI guidance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl">Complete Wellbeing Support</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for your mental health journey in one compassionate platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 space-y-4">
                <MessageCircle className="h-10 w-10 text-primary" />
                <h3>AI Therapist Chat</h3>
                <p className="text-sm text-muted-foreground">
                  24/7 conversational support with empathetic AI guidance
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 space-y-4">
                <TrendingUp className="h-10 w-10 text-primary" />
                <h3>Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your wellbeing journey with detailed analytics
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 space-y-4">
                <Heart className="h-10 w-10 text-primary" />
                <h3>Mindful Practices</h3>
                <p className="text-sm text-muted-foreground">
                  Guided meditation, yoga, and breathing exercises
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardContent className="p-6 space-y-4">
                <Users className="h-10 w-10 text-primary" />
                <h3>Expert Content</h3>
                <p className="text-sm text-muted-foreground">
                  Curated library of therapeutic videos and articles
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 px-6 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center space-y-12">
          <h2 className="text-3xl lg:text-4xl">Trusted by Thousands</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground italic">&quot;This app helped me understand my anxiety patterns and gave me practical tools to manage them. The AI chat feature feels like having a therapist available anytime.&quot;</p>
                <div className="text-sm">
                  <p>— Sarah M.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground italic">&quot;The personalized meditation recommendations were spot-on. I&apos;ve never been more consistent with my mindfulness practice.&quot;</p>
                <div className="text-sm">
                  <p>— David L.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground italic">&quot;Finally, a mental health app that doesn&apos;t feel clinical. The interface is beautiful and the guidance feels genuinely caring.&quot;</p>
                <div className="text-sm">
                  <p>— Maria R.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3>Wellbeing AI</h3>
              <p className="text-sm text-muted-foreground">
                Your personal companion for mental health and mindful living.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4>Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Features</p>
                <p>Assessments</p>
                <p>AI Chat</p>
                <p>Practices</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4>Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Help Center</p>
                <p>Privacy Policy</p>
                <p>Terms of Service</p>
                <p>Crisis Resources</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4>Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>support@wellbeingai.com</p>
                <p>Emergency: 988</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

  {/* Start Journey Modal (options) */}
      {showStartJourney && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl">Join or Continue</h3>
                <p className="text-muted-foreground">Choose how you want to get started</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => { setShowStartJourney(false); handleGoogleAuth(); }}>
                  Continue with Google
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setShowStartJourney(false); setShowSignUp(true); }}>
                  Create an Account
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setShowStartJourney(false); setShowLogin(true); }}>
                  Log In
                </Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setShowStartJourney(false)}>Cancel</Button>
            </CardContent>
          </Card>
        </div>
      )}

  {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 w-full h-full"
            onClick={() => setShowSignUp(false)}
            aria-label="Close sign up dialog"
          />
          <Card className="w-full max-w-md relative z-10">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 z-20"
              onClick={() => setShowSignUp(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl">Start Your Journey</h3>
                <p className="text-muted-foreground">Create your account to get personalized wellbeing support</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Get Started
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={handleGoogleAuth}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                
                <div className="text-xs text-center text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" className="underline" onClick={() => { setShowSignUp(false); setShowLogin(true); }}>
                    Log in
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 w-full h-full"
            onClick={() => setShowLogin(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowLogin(false);
              }
            }}
            aria-label="Close login dialog"
          />
          <Card className="w-full max-w-md relative z-10">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={() => setShowLogin(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl">Welcome Back</h3>
                <p className="text-muted-foreground">Log in to continue your wellbeing journey</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
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
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-destructive" role="alert">{authError}</p>
                )}
                <div className="space-y-3">
                  <Button type="submit" className="w-full">Log In</Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => { setShowLogin(false); setShowSignUp(true); }}
                  >
                    Create New Account
                  </Button>
                </div>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={handleGoogleAuth}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
                
                <div className="text-xs text-center text-muted-foreground">
                  New here?{' '}
                  <button type="button" className="underline" onClick={() => { setShowLogin(false); setShowSignUp(true); }}>
                    Create an account
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}