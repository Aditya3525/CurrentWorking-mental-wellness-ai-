// Translation Hook Usage Examples

import { useTranslation } from 'react-i18next';

// Example 1: Basic usage in a component
export function ExampleComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}</h1>
      <p>{t('dashboard.howFeeling')}</p>
    </div>
  );
}

// Example 2: With interpolation
export function GreetingComponent({ name }: { name: string }) {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('dashboard.welcome')}, {name}!</h1>
    </div>
  );
}

// Example 3: In buttons and actions
export function ActionButtons() {
  const { t } = useTranslation();
  
  return (
    <div>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
      <button>{t('common.submit')}</button>
    </div>
  );
}

// Example 4: Navigation items
export function Navigation() {
  const { t } = useTranslation();
  
  return (
    <nav>
      <a href="/dashboard">{t('nav.dashboard')}</a>
      <a href="/chat">{t('nav.chat')}</a>
      <a href="/mood">{t('nav.mood')}</a>
      <a href="/practices">{t('nav.practices')}</a>
      <a href="/assessments">{t('nav.assessments')}</a>
    </nav>
  );
}

// Example 5: Language switcher in Settings
import { LanguageSelector } from '../components/features/LanguageSelector';

export function SettingsPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('settings.title')}</h2>
      
      <div className="setting-item">
        <label>{t('settings.language')}</label>
        <LanguageSelector />
      </div>
    </div>
  );
}
