import type { Href } from 'expo-router';
import { AppIconName } from '@/shared/ui/AppIcon';

export interface MoreMenuItem {
  icon: AppIconName;
  title: string;
  subtitle: string;
  href: Href;
}

export const MORE_SECTIONS: { title: string; items: MoreMenuItem[] }[] = [
  {
    title: 'Seu trabalho',
    items: [
      { icon: 'vehicle', title: 'Veículo e custos', subtitle: 'Seu custo por km', href: '/vehicle' },
      { icon: 'goal', title: 'Meta e mínimos', subtitle: 'Seu lucro e o mínimo por corrida', href: '/goal' },
      { icon: 'layers', title: 'Ofertas e faturamento', subtitle: 'Aceitas, não aceitas e o valor estimado', href: '/offers' },
      { icon: 'apps', title: 'Plataformas', subtitle: 'Apps em que você trabalha', href: '/platforms' },
      { icon: 'bell', title: 'Lembretes', subtitle: 'Óleo, pneus, revisões e fim do dia', href: '/reminders' },
    ],
  },
  {
    title: 'Copiloto e permissões',
    items: [
      { icon: 'copilot', title: 'Copiloto de ofertas', subtitle: 'Leitura, cartão, voz e botão flutuante', href: '/copilot' },
      { icon: 'key', title: 'Permissões', subtitle: 'O que o app pode usar', href: '/permissions' },
    ],
  },
  {
    title: 'Seus dados',
    items: [
      { icon: 'backup', title: 'Backup', subtitle: 'Salvar e restaurar seus dados', href: '/backup' },
      { icon: 'reports', title: 'Meu resumo', subtitle: 'Números de uso para compartilhar', href: '/summary' },
      { icon: 'shield', title: 'Privacidade', subtitle: 'O que acontece com seus dados', href: '/privacy' },
    ],
  },
  {
    title: 'Ajuda',
    items: [
      { icon: 'help', title: 'Ajuda', subtitle: 'Como o app funciona', href: '/help' },
      { icon: 'flag', title: 'Relatar um problema', subtitle: 'Ou sugerir uma melhoria', href: '/report' },
      { icon: 'document', title: 'Termos de uso', subtitle: 'As regras para usar o app', href: '/terms' },
    ],
  },
];
