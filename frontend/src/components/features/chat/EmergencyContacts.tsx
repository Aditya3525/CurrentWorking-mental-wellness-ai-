import { Phone, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import React from 'react';

import { EmergencyContact, CrisisSeverity } from '../../../types/chat';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  severity: CrisisSeverity;
  onCall: (number: string) => void;
  onClose?: () => void;
}

export function EmergencyContacts({ contacts, severity, onCall, onClose }: EmergencyContactsProps): JSX.Element {
  const getSeverityConfig = (severity: CrisisSeverity) => {
    switch (severity) {
      case CrisisSeverity.SEVERE:
        return {
          title: 'Emergency Help Needed',
          subtitle: 'Please get immediate help - you don\'t have to face this alone.',
          urgencyColor: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          primaryAction: 'Call 988 NOW'
        };
      case CrisisSeverity.MODERATE:
        return {
          title: 'Professional Support Available',
          subtitle: 'These resources can provide the support you need.',
          urgencyColor: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          primaryAction: 'Get Support'
        };
      default:
        return {
          title: 'Support Resources',
          subtitle: 'Help is available when you need it.',
          urgencyColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          primaryAction: 'Find Help'
        };
    }
  };

  const config = getSeverityConfig(severity);

  const handleCall = (contact: EmergencyContact) => {
    // Format the number for calling
    const phoneNumber = contact.number.replace(/[^\d]/g, '');
    onCall(`tel:${phoneNumber}`);
  };

  const getContactTypeIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'hotline':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'professional':
        return <ExternalLink className="h-4 w-4 text-green-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getContactTypePriority = (type: EmergencyContact['type']): number => {
    switch (type) {
      case 'emergency': return 1;
      case 'hotline': return 2;
      case 'professional': return 3;
      default: return 4;
    }
  };

  // Sort contacts by priority based on severity
  const sortedContacts = [...contacts].sort((a, b) => {
    if (severity === CrisisSeverity.SEVERE) {
      return getContactTypePriority(a.type) - getContactTypePriority(b.type);
    }
    return 0;
  });

  const primaryContact = sortedContacts[0];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${config.urgencyColor}`}>
          <AlertTriangle className="h-5 w-5" />
          {config.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary Action */}
        {primaryContact && (
          <div className={`p-4 rounded-lg border ${config.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{primaryContact.name}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {primaryContact.available}
                </p>
              </div>
              {getContactTypeIcon(primaryContact.type)}
            </div>
            <Button 
              className={`w-full mt-3 ${
                severity === CrisisSeverity.SEVERE 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : severity === CrisisSeverity.MODERATE
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
              onClick={() => handleCall(primaryContact)}
            >
              <Phone className="h-4 w-4 mr-2" />
              {config.primaryAction} - {primaryContact.number}
            </Button>
          </div>
        )}

        {/* Additional Contacts */}
        {sortedContacts.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Additional Resources:</h4>
            {sortedContacts.slice(1).map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  {getContactTypeIcon(contact.type)}
                  <div>
                    <p className="text-sm font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.available}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCall(contact)}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {contact.number}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Important Notes */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          {severity === CrisisSeverity.SEVERE && (
            <div className="bg-red-50 border border-red-200 p-2 rounded text-red-800">
              <p className="font-medium">If you&apos;re in immediate danger:</p>
              <p>• Call 911 for emergency services</p>
              <p>• Go to your nearest emergency room</p>
              <p>• Call 988 for crisis support</p>
            </div>
          )}
          
          <p className="mt-2">
            <strong>Remember:</strong> These services are confidential, free, and available when you need them.
            You deserve support and care.
          </p>
        </div>

        {/* Close Button */}
        {onClose && (
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Continue Conversation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}