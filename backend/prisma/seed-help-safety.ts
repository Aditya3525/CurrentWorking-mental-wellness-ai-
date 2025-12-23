import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHelpSafetyData() {
  console.log('🌱 Seeding Help & Safety system data...');

  try {
    // ===== SEED FAQs =====
    console.log('Creating FAQs...');
    const faqs = await prisma.fAQ.createMany({
      data: [
        {
          question: 'How do I get started with the Mental Wellbeing AI App?',
          answer: 'Getting started is easy! First, create an account or log in. Then, take one of our initial assessments to help us understand your mental health needs. Based on your results, we\'ll recommend personalized practices, content, and resources.',
          category: 'GENERAL',
          order: 1,
          tags: 'onboarding, getting started, beginner',
          createdBy: 'system'
        },
        {
          question: 'Is my personal information and mental health data secure?',
          answer: 'Yes, we take your privacy very seriously. All your data is encrypted both in transit and at rest. We never share your personal information or assessment results with third parties without your explicit consent. You can read more in our Privacy Policy.',
          category: 'PRIVACY',
          order: 2,
          tags: 'privacy, security, data protection',
          createdBy: 'system'
        },
        {
          question: 'How accurate are the mental health assessments?',
          answer: 'Our assessments are based on clinically validated scales (PHQ-9 for depression, GAD-7 for anxiety, etc.). While they provide valuable insights, they are not diagnostic tools. Always consult with a qualified mental health professional for an official diagnosis.',
          category: 'ASSESSMENTS',
          order: 3,
          tags: 'assessments, accuracy, validation',
          createdBy: 'system'
        },
        {
          question: 'Can the AI chatbot replace therapy?',
          answer: 'No, our AI chatbot is designed to provide support, coping strategies, and mindfulness exercises—not to replace professional therapy. If you\'re experiencing severe mental health issues, please reach out to a licensed therapist or crisis hotline.',
          category: 'CHATBOT',
          order: 4,
          tags: 'chatbot, therapy, limitations',
          createdBy: 'system'
        },
        {
          question: 'What if I\'m in a mental health crisis?',
          answer: 'If you\'re experiencing a mental health crisis, please contact emergency services immediately (911 in the US) or reach out to a crisis hotline. You can find crisis resources in the Help & Safety section under "Crisis Resources".',
          category: 'SAFETY',
          order: 5,
          tags: 'crisis, emergency, safety',
          createdBy: 'system'
        },
        {
          question: 'How much does the app cost?',
          answer: 'We offer both free and premium plans. The free plan includes basic assessments, mood tracking, and limited content access. Premium plans unlock personalized recommendations, unlimited AI chatbot conversations, advanced analytics, and priority support.',
          category: 'BILLING',
          order: 6,
          tags: 'pricing, subscription, premium',
          createdBy: 'system'
        },
        {
          question: 'The app is not loading properly. What should I do?',
          answer: 'Try these steps: 1) Clear your browser cache and cookies, 2) Make sure you\'re using an updated browser (Chrome, Firefox, Safari, or Edge), 3) Check your internet connection, 4) Try logging out and back in. If issues persist, contact support.',
          category: 'TECHNICAL',
          order: 7,
          tags: 'troubleshooting, loading issues, technical',
          createdBy: 'system'
        },
        {
          question: 'Can I delete my account and data?',
          answer: 'Yes, you have full control over your data. Go to Settings > Account > Delete Account. This will permanently remove all your personal information, assessment results, and activity history. This action cannot be undone.',
          category: 'PRIVACY',
          order: 8,
          tags: 'account deletion, data removal, GDPR',
          createdBy: 'system'
        }
      ]
    });
    console.log(`✅ Created ${faqs.count} FAQs`);

    // ===== SEED CRISIS RESOURCES =====
    console.log('Creating crisis resources...');
    const crisisResources = await prisma.crisisResource.createMany({
      data: [
        {
          name: '988 Suicide & Crisis Lifeline',
          type: 'HOTLINE',
          phoneNumber: '988',
          website: 'https://988lifeline.org/',
          description: 'Free and confidential support for people in distress, 24/7. Available for anyone experiencing suicidal thoughts, mental health crisis, or emotional distress.',
          availability: '24/7',
          country: 'US',
          language: 'English, Spanish',
          order: 1,
          tags: 'suicide prevention, crisis hotline, 24/7'
        },
        {
          name: 'Crisis Text Line',
          type: 'TEXT_LINE',
          textNumber: '741741',
          website: 'https://www.crisistextline.org/',
          description: 'Free, 24/7 support via text message. Text "HELLO" to 741741 to connect with a trained Crisis Counselor.',
          availability: '24/7',
          country: 'US',
          language: 'English',
          order: 2,
          tags: 'text support, crisis text, 24/7'
        },
        {
          name: 'SAMHSA National Helpline',
          type: 'HOTLINE',
          phoneNumber: '1-800-662-4357',
          website: 'https://www.samhsa.gov/find-help/national-helpline',
          description: 'Treatment referral and information service for individuals and families facing mental health and/or substance use disorders.',
          availability: '24/7',
          country: 'US',
          language: 'English, Spanish',
          order: 3,
          tags: 'substance abuse, mental health, treatment referral'
        },
        {
          name: 'NAMI Helpline',
          type: 'HOTLINE',
          phoneNumber: '1-800-950-6264',
          website: 'https://www.nami.org/help',
          description: 'National Alliance on Mental Illness helpline provides information, resource referrals, and support for people living with mental illness.',
          availability: 'Mon-Fri 10am-10pm ET',
          country: 'US',
          language: 'English',
          order: 4,
          tags: 'NAMI, mental illness support, information'
        },
        {
          name: 'The Trevor Project',
          type: 'HOTLINE',
          phoneNumber: '1-866-488-7386',
          textNumber: '678678',
          website: 'https://www.thetrevorproject.org/',
          description: 'Crisis intervention and suicide prevention for LGBTQ+ youth under 25. Call, text, or chat available.',
          availability: '24/7',
          country: 'US',
          language: 'English',
          order: 5,
          tags: 'LGBTQ+, youth, suicide prevention'
        },
        {
          name: 'Veterans Crisis Line',
          type: 'HOTLINE',
          phoneNumber: '988 (Press 1)',
          textNumber: '838255',
          website: 'https://www.veteranscrisisline.net/',
          description: 'Free, confidential support for Veterans in crisis, their families, and friends. Call 988 and press 1, text 838255, or chat online.',
          availability: '24/7',
          country: 'US',
          language: 'English',
          order: 6,
          tags: 'veterans, military, crisis support'
        },
        {
          name: '7 Cups',
          type: 'CHAT_SERVICE',
          website: 'https://www.7cups.com/',
          description: 'Free, anonymous, and confidential conversations with trained listeners. Available via chat 24/7.',
          availability: '24/7',
          country: 'Global',
          language: 'Multiple languages',
          order: 7,
          tags: 'emotional support, chat, anonymous'
        },
        {
          name: '911 Emergency Services',
          type: 'EMERGENCY',
          phoneNumber: '911',
          description: 'For immediate life-threatening emergencies only. Call 911 if someone is in immediate danger or experiencing a medical emergency.',
          availability: '24/7',
          country: 'US',
          language: 'English',
          order: 8,
          tags: 'emergency, 911, immediate danger'
        }
      ]
    });
    console.log(`✅ Created ${crisisResources.count} crisis resources`);

    // ===== SEED THERAPISTS =====
    console.log('Creating therapist directory...');
    const therapists = await prisma.therapist.createMany({
      data: [
        {
          name: 'Dr. Sarah Johnson',
          credential: 'PSYCHOLOGIST',
          title: 'Clinical Psychologist, PhD',
          bio: 'Dr. Johnson specializes in cognitive-behavioral therapy (CBT) and mindfulness-based interventions. With over 15 years of experience, she helps clients manage anxiety, depression, and stress. She creates a warm, non-judgmental space where clients can explore their thoughts and feelings.',
          specialtiesJson: JSON.stringify(['Anxiety', 'Depression', 'Stress Management', 'CBT', 'Mindfulness']),
          email: 'sarah.johnson@example.com',
          phone: '(555) 123-4567',
          website: 'https://www.drjohnsontherapy.com',
          street: '123 Main Street, Suite 200',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'US',
          acceptsInsurance: true,
          insurances: JSON.stringify(['Aetna', 'Blue Cross Blue Shield', 'UnitedHealthcare', 'Cigna']),
          sessionFee: 150,
          offersSliding: true,
          availabilityJson: JSON.stringify([
            { day: 'Monday', times: ['9:00 AM - 5:00 PM'] },
            { day: 'Tuesday', times: ['9:00 AM - 5:00 PM'] },
            { day: 'Wednesday', times: ['9:00 AM - 5:00 PM'] },
            { day: 'Thursday', times: ['9:00 AM - 5:00 PM'] }
          ]),
          yearsExperience: 15,
          languages: 'English, Spanish',
          isVerified: true,
          isActive: true
        },
        {
          name: 'Michael Chen, LCSW',
          credential: 'LCSW',
          title: 'Licensed Clinical Social Worker',
          bio: 'Michael Chen is a compassionate therapist specializing in trauma-informed care and EMDR therapy. He works with individuals who have experienced trauma, PTSD, grief, and relationship issues. His approach is client-centered and evidence-based.',
          specialtiesJson: JSON.stringify(['Trauma', 'PTSD', 'EMDR', 'Grief', 'Relationship Issues']),
          email: 'michael.chen@example.com',
          phone: '(555) 234-5678',
          website: 'https://www.chentherapy.com',
          street: '456 Oak Avenue, Building B',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'US',
          acceptsInsurance: true,
          insurances: JSON.stringify(['Aetna', 'Kaiser Permanente', 'Blue Shield', 'Medicare']),
          sessionFee: 120,
          offersSliding: true,
          availabilityJson: JSON.stringify([
            { day: 'Tuesday', times: ['10:00 AM - 7:00 PM'] },
            { day: 'Wednesday', times: ['10:00 AM - 7:00 PM'] },
            { day: 'Thursday', times: ['10:00 AM - 7:00 PM'] },
            { day: 'Friday', times: ['10:00 AM - 3:00 PM'] }
          ]),
          yearsExperience: 10,
          languages: 'English, Mandarin',
          isVerified: true,
          isActive: true
        },
        {
          name: 'Dr. Emily Rodriguez',
          credential: 'PSYCHIATRIST',
          title: 'Board-Certified Psychiatrist, MD',
          bio: 'Dr. Rodriguez is a board-certified psychiatrist with expertise in medication management for depression, anxiety, bipolar disorder, and other mental health conditions. She takes a holistic approach, combining medication when appropriate with therapy referrals and lifestyle interventions.',
          specialtiesJson: JSON.stringify(['Medication Management', 'Depression', 'Anxiety', 'Bipolar Disorder', 'Psychiatric Evaluation']),
          email: 'emily.rodriguez@example.com',
          phone: '(555) 345-6789',
          website: 'https://www.drrodriguezpsych.com',
          street: '789 Pine Street, Suite 500',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          acceptsInsurance: true,
          insurances: JSON.stringify(['Aetna', 'Blue Cross Blue Shield', 'UnitedHealthcare', 'Cigna', 'Medicare']),
          sessionFee: 200,
          offersSliding: false,
          availabilityJson: JSON.stringify([
            { day: 'Monday', times: ['8:00 AM - 4:00 PM'] },
            { day: 'Wednesday', times: ['8:00 AM - 4:00 PM'] },
            { day: 'Friday', times: ['8:00 AM - 12:00 PM'] }
          ]),
          yearsExperience: 12,
          languages: 'English, Spanish',
          isVerified: true,
          isActive: true
        },
        {
          name: 'Jessica Williams, LMFT',
          credential: 'LMFT',
          title: 'Licensed Marriage and Family Therapist',
          bio: 'Jessica Williams specializes in couples therapy, family therapy, and relationship counseling. She helps couples improve communication, resolve conflicts, and rebuild intimacy. Her approach is collaborative and strengths-based.',
          specialtiesJson: JSON.stringify(['Couples Therapy', 'Family Therapy', 'Relationship Issues', 'Communication', 'Premarital Counseling']),
          email: 'jessica.williams@example.com',
          phone: '(555) 456-7890',
          website: 'https://www.williamstherapy.com',
          street: '321 Maple Drive',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'US',
          acceptsInsurance: true,
          insurances: JSON.stringify(['Premera Blue Cross', 'Regence', 'Aetna']),
          sessionFee: 140,
          offersSliding: true,
          availabilityJson: JSON.stringify([
            { day: 'Monday', times: ['1:00 PM - 8:00 PM'] },
            { day: 'Tuesday', times: ['1:00 PM - 8:00 PM'] },
            { day: 'Thursday', times: ['1:00 PM - 8:00 PM'] },
            { day: 'Saturday', times: ['10:00 AM - 2:00 PM'] }
          ]),
          yearsExperience: 8,
          languages: 'English',
          isVerified: true,
          isActive: true
        },
        {
          name: 'Dr. James Thompson',
          credential: 'PSYCHOLOGIST',
          title: 'Clinical Psychologist, PsyD',
          bio: 'Dr. Thompson specializes in treating OCD, panic disorder, and phobias using evidence-based approaches like Exposure and Response Prevention (ERP) and CBT. He has extensive experience helping clients overcome debilitating anxiety and reclaim their lives.',
          specialtiesJson: JSON.stringify(['OCD', 'Panic Disorder', 'Phobias', 'ERP', 'CBT', 'Anxiety Disorders']),
          email: 'james.thompson@example.com',
          phone: '(555) 567-8901',
          website: 'https://www.thompsonpsychology.com',
          street: '654 Elm Street, Suite 300',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'US',
          acceptsInsurance: true,
          insurances: JSON.stringify(['Blue Cross Blue Shield', 'Harvard Pilgrim', 'Tufts Health Plan']),
          sessionFee: 160,
          offersSliding: false,
          availabilityJson: JSON.stringify([
            { day: 'Monday', times: ['9:00 AM - 5:00 PM'] },
            { day: 'Wednesday', times: ['9:00 AM - 5:00 PM'] },
            { day: 'Friday', times: ['9:00 AM - 5:00 PM'] }
          ]),
          yearsExperience: 18,
          languages: 'English',
          isVerified: true,
          isActive: true
        }
      ]
    });
    console.log(`✅ Created ${therapists.count} therapists`);

    console.log('✅ Help & Safety system seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding Help & Safety data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedHelpSafetyData()
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
