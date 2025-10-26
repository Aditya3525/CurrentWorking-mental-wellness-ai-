import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  ArrowLeft,
  Phone,
  MessageSquare,
  AlertTriangle,
  Heart,
  Users,
  Clock,
  Search,
  Send,
  MapPin,
  Star,
  ExternalLink,
  HelpCircle,
  Shield,
  BookOpen,
  Video,
  Mail
} from 'lucide-react';

interface HelpSafetyProps {
  onNavigate: (page: string) => void;
}

interface Therapist {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  location: string;
  availableSlots: string[];
  acceptsInsurance: boolean;
  profileImage: string;
  bio: string;
}

export function HelpSafety({ onNavigate }: HelpSafetyProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const crisisResources = [
    {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      description: '24/7 free and confidential support for people in distress',
      type: 'crisis'
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free 24/7 support via text message',
      type: 'crisis'
    },
    {
      name: 'SAMHSA National Helpline',
      number: '1-800-662-HELP (4357)',
      description: 'Treatment referral and information service',
      type: 'support'
    },
    {
      name: 'Emergency Services',
      number: '911',
      description: 'For immediate life-threatening emergencies',
      type: 'emergency'
    }
  ];

  const therapists: Therapist[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      title: 'Licensed Clinical Psychologist',
      specialties: ['Anxiety', 'Depression', 'CBT', 'Mindfulness'],
      rating: 4.9,
      location: 'San Francisco, CA',
      availableSlots: ['Mon 2PM', 'Wed 10AM', 'Fri 3PM'],
      acceptsInsurance: true,
      profileImage: 'https://images.unsplash.com/photo-1599744403700-b7330f3c4dbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxtaW5kZnVsbmVzcyUyMG5hdHVyZSUyMHBlYWNlZnVsfGVufDF8fHx8MTc1NjcxMDg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      bio: 'Specializing in anxiety and depression with over 10 years of experience in cognitive behavioral therapy.'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      title: 'Licensed Marriage & Family Therapist',
      specialties: ['Relationships', 'Family Therapy', 'Stress Management'],
      rating: 4.8,
      location: 'Los Angeles, CA',
      availableSlots: ['Tue 1PM', 'Thu 11AM', 'Sat 9AM'],
      acceptsInsurance: true,
      profileImage: 'https://images.unsplash.com/photo-1687180948607-9ba1dd045e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbWVkaXRhdGlvbiUyMHdlbGxuZXNzfGVufDF8fHx8MTc1NjcxMDg4Bnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      bio: 'Helping individuals and couples build stronger relationships and manage life transitions.'
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      title: 'Licensed Clinical Social Worker',
      specialties: ['Trauma', 'PTSD', 'EMDR', 'Women\'s Issues'],
      rating: 4.9,
      location: 'New York, NY',
      availableSlots: ['Mon 4PM', 'Wed 2PM', 'Thu 6PM'],
      acceptsInsurance: false,
      profileImage: 'https://images.unsplash.com/photo-1622048769696-4d042b1028de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFjZWZ1bCUyMHlvZ2ElMjBtZWRpdGF0aW9ufGVufDF8fHx8MTc1NjcxMDg4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      bio: 'Trauma-informed therapy specialist with expertise in EMDR and somatic approaches.'
    }
  ];

  const faqs = [
    {
      question: 'Is my data private and secure?',
      answer: 'Yes, absolutely. All your data is encrypted both in transit and at rest. We follow HIPAA guidelines and never share your personal information without your explicit consent. You can review our privacy policy for full details.'
    },
    {
      question: 'How accurate are the assessment results?',
      answer: 'Our assessments are based on validated psychological instruments and research. However, they are screening tools, not diagnostic tests. Results should be discussed with a healthcare professional for clinical interpretation.'
    },
    {
      question: 'Can I use this app instead of therapy?',
      answer: 'This app is designed to supplement, not replace, professional mental health care. While our tools can be very helpful for general wellbeing, we always recommend consulting with licensed professionals for clinical issues.'
    },
    {
      question: 'What if I\'m having thoughts of self-harm?',
      answer: 'Please reach out for immediate help. Call 988 (Suicide Prevention Lifeline), text HOME to 741741, or go to your nearest emergency room. Your safety is the top priority.'
    },
    {
      question: 'How often should I take assessments?',
      answer: 'We recommend retaking assessments every 2-4 weeks to track progress. However, you can take them more frequently if you\'re going through significant changes or working with a therapist.'
    },
    {
      question: 'Can I export my data to share with my therapist?',
      answer: 'Yes! You can export your assessment results, progress charts, and insights from your profile settings. This can be very helpful for your healthcare provider to understand your patterns.'
    },
    {
      question: 'What if the app isn\'t helping me?',
      answer: 'Everyone\'s mental health journey is different. If you\'re not finding the app helpful, we encourage you to speak with a mental health professional. We also offer refunds within the first 30 days.'
    },
    {
      question: 'Are there any age restrictions?',
      answer: 'This app is designed for adults 18 and older. If you\'re under 18 and struggling with mental health, please talk to a parent, guardian, teacher, or counselor about getting appropriate support.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const specialties = ['all', 'Anxiety', 'Depression', 'Trauma', 'Relationships', 'CBT', 'Mindfulness'];

  const filteredTherapists = therapists.filter(therapist => 
    selectedSpecialty === 'all' || therapist.specialties.includes(selectedSpecialty)
  );

  const handleFeedbackSubmit = () => {
    // In a real app, this would send feedback to support
    console.log('Feedback submitted:', feedbackMessage);
    setFeedbackMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Crisis Banner - Always Visible */}
      <div className="bg-red-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-semibold">If you are in immediate danger or having thoughts of self-harm:</p>
              <p className="text-sm">Call 988 (US) • Text HOME to 741741 • Call 911 for emergencies</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => window.open('tel:988')}
            className="bg-white text-red-600 hover:bg-gray-100"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call 988
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl">Help & Safety</h1>
            <p className="text-muted-foreground text-lg">
              Resources, support, and answers to help you on your wellbeing journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="crisis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="crisis">Crisis Resources</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="therapists">Find Therapist</TabsTrigger>
            <TabsTrigger value="support">Contact Support</TabsTrigger>
          </TabsList>

          {/* Crisis Resources Tab */}
          <TabsContent value="crisis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Immediate Crisis Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  If you or someone you know is in immediate danger, please don't wait. 
                  Reach out for professional help right away.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {crisisResources.map((resource, index) => (
                    <Card key={index} className={`border-2 ${
                      resource.type === 'crisis' ? 'border-red-200 bg-red-50' :
                      resource.type === 'emergency' ? 'border-orange-200 bg-orange-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{resource.name}</h3>
                          <Badge variant={
                            resource.type === 'crisis' ? 'destructive' :
                            resource.type === 'emergency' ? 'secondary' : 'default'
                          }>
                            {resource.type === 'crisis' ? 'Crisis' : 
                             resource.type === 'emergency' ? 'Emergency' : 'Support'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {resource.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg">{resource.number}</span>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (resource.number.includes('741741')) {
                                window.open('sms:741741&body=HOME');
                              } else if (resource.number === '988') {
                                window.open('tel:988');
                              } else if (resource.number === '911') {
                                window.open('tel:911');
                              } else {
                                window.open(`tel:${resource.number.replace(/\D/g, '')}`);
                              }
                            }}
                          >
                            {resource.number.includes('Text') ? (
                              <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Text
                              </>
                            ) : (
                              <>
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Heart className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Mental Health Resources</h3>
                  <p className="text-sm text-muted-foreground">
                    Educational materials and self-help resources for various mental health topics
                  </p>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Resources
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Users className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Support Groups</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with others who understand your journey through peer support groups
                  </p>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Find Groups
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center space-y-3">
                  <Video className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold">Crisis Prevention</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn warning signs and develop a personal safety plan for difficult times
                  </p>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFAQs.length === 0 && (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p className="text-muted-foreground">
                        Try different search terms or contact support for personalized help.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Therapist Directory Tab */}
          <TabsContent value="therapists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Find a Licensed Therapist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Connect with licensed mental health professionals in your area. 
                    This directory includes verified therapists who specialize in various areas.
                  </p>

                  {/* Specialty Filter */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Specialty:</span>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
                        <Button
                          key={specialty}
                          variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSpecialty(specialty)}
                          className="capitalize"
                        >
                          {specialty}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Therapist Cards */}
            <div className="space-y-4">
              {filteredTherapists.map((therapist) => (
                <Card key={therapist.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0"></div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{therapist.name}</h3>
                            <p className="text-sm text-muted-foreground">{therapist.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                                <span className="text-sm">{therapist.rating}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{therapist.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Badge variant={therapist.acceptsInsurance ? 'default' : 'secondary'}>
                            {therapist.acceptsInsurance ? 'Insurance Accepted' : 'Self-Pay'}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {therapist.bio}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {therapist.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Available Times:
                            </p>
                            <div className="flex gap-2">
                              {therapist.availableSlots.slice(0, 3).map((slot) => (
                                <Badge key={slot} variant="secondary" className="text-xs">
                                  {slot}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                            <Button size="sm">
                              Book Consultation
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Can't find what you're looking for? We can help you find additional therapists in your area.
                </p>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Request Therapist Referral
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Contact Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Need help with the app or have questions about your wellbeing journey? 
                    Our support team is here to help.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Message</label>
                      <Textarea
                        placeholder="Describe your question or issue..."
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleFeedbackSubmit}
                      disabled={!feedbackMessage.trim()}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    We typically respond within 24 hours. For urgent issues, please use the crisis resources above.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Other Ways to Reach Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-muted-foreground">support@wellbeingai.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">Available Mon-Fri, 9AM-6PM PST</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Help Center</p>
                        <p className="text-sm text-muted-foreground">Comprehensive guides and tutorials</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Response Times:</strong><br />
                      • General inquiries: Within 24 hours<br />
                      • Technical issues: Within 12 hours<br />
                      • Account problems: Within 6 hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
