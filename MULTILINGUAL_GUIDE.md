# Multilingual Support Implementation Guide

## Overview
The application now supports 6 languages:
- English (en) - Default
- Spanish (es) - Español
- French (fr) - Français  
- German (de) - Deutsch
- Hindi (hi) - हिन्दी
- Chinese (zh) - 中文

## Installation
The following packages have been installed:
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings for i18next
- `i18next-browser-languagedetector` - Automatic language detection

## File Structure
```
frontend/src/
├── i18n/
│   ├── config.ts          # i18n initialization and language list
│   ├── usage-examples.tsx # Code examples for developers
│   └── locales/
│       ├── en.json        # English translations
│       ├── es.json        # Spanish translations
│       ├── fr.json        # French translations
│       ├── de.json        # German translations
│       ├── hi.json        # Hindi translations
│       └── zh.json        # Chinese translations
├── components/
│   └── features/
│       └── LanguageSelector.tsx  # Language dropdown component
└── main.tsx               # i18n imported here
```

## How to Use Translations in Components

### 1. Import the hook
```tsx
import { useTranslation } from 'react-i18next';
```

### 2. Use in your component
```tsx
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.howFeeling')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### 3. Translation Key Structure
Translation keys follow dot notation:
- `app.*` - App-level strings (name, tagline, etc.)
- `nav.*` - Navigation items
- `dashboard.*` - Dashboard-specific text
- `chat.*` - Chatbot interface
- `mood.*` - Mood tracker
- `practices.*` - Mindfulness practices
- `content.*` - Content library
- `assessments.*` - Assessment flow
- `help.*` - Help & Safety section
- `profile.*` - User profile
- `settings.*` - Settings page
- `auth.*` - Authentication flows
- `common.*` - Reusable text (buttons, actions, etc.)
- `validation.*` - Form validation messages

## Adding the Language Selector

### In the App Header
```tsx
import { LanguageSelector } from './components/features/LanguageSelector';

function AppHeader() {
  return (
    <header>
      <div className="header-right">
        <LanguageSelector />
        {/* Other header items */}
      </div>
    </header>
  );
}
```

### In Settings Page
```tsx
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './components/features/LanguageSelector';

function SettingsPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('settings.title')}</h2>
      <div className="setting-section">
        <label>{t('settings.language')}</label>
        <p className="description">{t('settings.selectLanguage')}</p>
        <LanguageSelector />
      </div>
    </div>
  );
}
```

## Adding New Translations

### 1. Add to English first (en.json)
```json
{
  "newSection": {
    "title": "New Section Title",
    "description": "Description text"
  }
}
```

### 2. Add to all other language files
Translate the same keys in es.json, fr.json, de.json, hi.json, zh.json

### 3. Use in components
```tsx
const { t } = useTranslation();
return <h1>{t('newSection.title')}</h1>;
```

## Adding a New Language

### 1. Create locale file
Create `frontend/src/i18n/locales/[language-code].json`

### 2. Add to config
```tsx
// In frontend/src/i18n/config.ts
import newLang from './locales/[language-code].json';

const resources = {
  // ... existing languages
  [languageCode]: { translation: newLang },
};

export const languages = [
  // ... existing languages
  { code: '[code]', name: 'Name', nativeName: 'Native Name' },
];
```

## Language Detection
The app automatically:
1. Checks localStorage for saved language preference
2. Falls back to browser language if available
3. Uses English as final fallback

Users' language preference is saved automatically when they change it.

## Current Implementation Status

### ✅ Completed
- i18n setup and configuration
- 6 language translation files
- Language selector component
- Translation keys for all major sections
- Automatic language detection
- localStorage persistence

### 🔄 To Implement in Components
You need to update existing components to use `t()` function instead of hardcoded strings:

#### High Priority
1. **Dashboard** - Replace "Welcome back", "Mood Check-in", etc.
2. **Navigation** - Replace all menu items
3. **Chatbot** - Interface text and placeholders
4. **Mood Tracker** - Mood labels and prompts
5. **Practices** - Search placeholder, filter labels
6. **Content Library** - Section titles, search
7. **Assessments** - Instructions, buttons
8. **Help & Safety** - Tab names, search placeholder

#### Medium Priority
9. **Profile** - Form labels
10. **Settings** - Add language selector
11. **Auth Pages** - Login/Register forms

#### Low Priority
12. **Admin Dashboard** - Admin interface (optional)

## Example Implementation Pattern

### Before:
```tsx
function Dashboard() {
  return (
    <div>
      <h1>Welcome back</h1>
      <p>How are you feeling today?</p>
      <button>Save</button>
    </div>
  );
}
```

### After:
```tsx
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.howFeeling')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

## Testing
To test language switching:
1. Add `<LanguageSelector />` to any component
2. Click the language dropdown
3. Select a different language
4. All translated text should update immediately
5. Refresh the page - language preference is persisted

## Performance
- All translations are bundled at build time
- No runtime fetching needed
- Minimal bundle size impact (~20-30KB per language)
- Instant language switching (no reload needed)

## Best Practices
1. Always add keys to ALL language files
2. Use descriptive key names
3. Keep translations concise for UI elements
4. Test with longest translations (German often longest)
5. Use common.* for reusable strings
6. Never hardcode user-facing text
7. Keep translation files organized by section

## Next Steps
1. Add `<LanguageSelector />` to Settings page
2. Replace hardcoded strings in Dashboard
3. Update Navigation component
4. Update Chatbot interface
5. Continue with other components systematically

## Support
For adding more languages or translation help, the structure is now in place and can be easily extended.
