# Mental Wellbeing AI App - Monorepo

A comprehensive mental health and wellbeing application with AI-powered support features.

## Project Structure

```
Mental Wellbeing AI App Overview/
├── frontend/                    # React + Vite frontend application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # React components organized by feature
│   │   │   ├── features/       # Feature-specific components
│   │   │   │   ├── auth/       # Authentication components
│   │   │   │   ├── assessment/ # Mental health assessments
│   │   │   │   ├── chat/       # AI chatbot interface
│   │   │   │   ├── content/    # Content library & practices
│   │   │   │   ├── dashboard/  # Main dashboard
│   │   │   │   ├── onboarding/ # User onboarding flow
│   │   │   │   ├── plans/      # Personalized plans
│   │   │   │   └── profile/    # User profile & progress
│   │   │   ├── layout/         # Layout components
│   │   │   ├── common/         # Shared/reusable components
│   │   │   └── ui/             # Base UI components (Radix UI)
│   │   ├── services/           # API services and data fetching
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility libraries
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Helper functions
│   │   ├── styles/             # Global styles and CSS
│   │   └── assets/             # Images, icons, etc.
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── README.md
│
├── backend/                     # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # Custom middleware
│   │   ├── config/             # Configuration files
│   │   └── utils/              # Backend utilities
│   ├── prisma/                 # Database schema and migrations
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/                        # Project documentation
├── README.md                   # Main project README
└── package.json                # Root package.json for workspace scripts
```
