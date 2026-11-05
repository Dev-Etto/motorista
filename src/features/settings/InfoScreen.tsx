import { ReactNode } from 'react';
import { AppText, Card, Screen } from '@/shared/ui/primitives';

export interface InfoSection {
  title: string;
  body: string;
}

export function InfoScreen({ sections, footer }: { sections: InfoSection[]; footer?: ReactNode }) {
  return (
    <Screen>
      {sections.map((section) => (
        <Card key={section.title} title={section.title}>
          <AppText>{section.body}</AppText>
        </Card>
      ))}
      {footer}
    </Screen>
  );
}
