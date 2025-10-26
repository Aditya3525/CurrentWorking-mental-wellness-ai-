import { AlertTriangle, Phone, MessageCircle, ExternalLink } from 'lucide-react';

import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface CrisisAlertBannerProps {
  crisisLevel: 'none' | 'low' | 'moderate' | 'high';
  onDismiss?: () => void;
}

export function CrisisAlertBanner({ crisisLevel, onDismiss }: CrisisAlertBannerProps) {
  if (crisisLevel === 'none') return null;

  const config = {
    low: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      icon: 'text-yellow-600',
      title: 'Support Available',
      message: 'We notice you might benefit from some extra support. Here are some resources that might help.'
    },
    moderate: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      title: 'We\'re Here for You',
      message: 'It looks like you might be going through a challenging time. Consider reaching out to these resources.'
    },
    high: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: 'text-red-600',
      title: 'Immediate Support Available',
      message: 'If you\'re in crisis or thinking about harming yourself, please reach out for immediate help. You\'re not alone.'
    }
  };

  const { bg, border, text, icon, title, message } = config[crisisLevel];

  return (
    <Card className={`${bg} ${border} border-2 shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className={`w-6 h-6 ${icon} flex-shrink-0 mt-1`} />
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className={`font-semibold text-lg mb-2 ${text}`}>
                {title}
              </h3>
              <p className={text}>
                {message}
              </p>
            </div>

            {/* Crisis Resources */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant={crisisLevel === 'high' ? 'destructive' : 'outline'}
                className="w-full"
                onClick={() => window.open('tel:988', '_self')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call 988
              </Button>
              
              <Button
                variant="outline"
                className={`w-full border-${crisisLevel === 'high' ? 'red' : 'orange'}-600 text-${crisisLevel === 'high' ? 'red' : 'orange'}-600 hover:bg-${crisisLevel === 'high' ? 'red' : 'orange'}-50`}
                onClick={() => window.open('https://988lifeline.org/chat/', '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat Now
              </Button>

              <Button
                variant="outline"
                className={`w-full border-${crisisLevel === 'high' ? 'red' : 'orange'}-600 text-${crisisLevel === 'high' ? 'red' : 'orange'}-600 hover:bg-${crisisLevel === 'high' ? 'red' : 'orange'}-50`}
                onClick={() => window.open('sms:741741', '_self')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Text HOME to 741741
              </Button>

              <Button
                variant="outline"
                className={`w-full border-${crisisLevel === 'high' ? 'red' : 'orange'}-600 text-${crisisLevel === 'high' ? 'red' : 'orange'}-600 hover:bg-${crisisLevel === 'high' ? 'red' : 'orange'}-50`}
                onClick={() => window.open('https://findtreatment.samhsa.gov/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Find Local Help
              </Button>
            </div>

            {/* Additional Resources */}
            <div className={`text-sm ${text} space-y-1`}>
              <p className="font-medium">Additional Resources:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>National Suicide Prevention Lifeline: 1-800-273-8255</li>
                <li>Crisis Text Line: Text HOME to 741741</li>
                <li>Veterans Crisis Line: 1-800-273-8255 (Press 1)</li>
                <li>LGBTQ+ Trevor Project: 1-866-488-7386</li>
              </ul>
            </div>

            {crisisLevel !== 'high' && onDismiss && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className={text}
                >
                  I&apos;m feeling better now
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
