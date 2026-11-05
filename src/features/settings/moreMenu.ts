import { AppIconName } from '@/shared/ui/AppIcon';

export const MORE_MENU: { icon: AppIconName; title: string; subtitle: string; href: string }[] = [
  { icon: 'vehicle', title: 'Veículo e custos', subtitle: 'Seu custo por km', href: '/vehicle' },
  { icon: 'goal', title: 'Meta e mínimos', subtitle: 'Seu lucro e o mínimo por corrida', href: '/goal' },
  { icon: 'copilot', title: 'Copiloto de ofertas', subtitle: 'Leitura, cartão, voz e botão flutuante', href: '/copilot' },
  { icon: 'key', title: 'Permissões', subtitle: 'O que o app pode usar', href: '/permissions' },
  { icon: 'apps', title: 'Plataformas', subtitle: 'Apps em que você trabalha', href: '/platforms' },
  { icon: 'bell', title: 'Lembretes', subtitle: 'Óleo, pneus e revisões', href: '/reminders' },
  { icon: 'backup', title: 'Backup', subtitle: 'Salvar e restaurar seus dados', href: '/backup' },
  { icon: 'flag', title: 'Relatar um problema', subtitle: 'Ou sugerir uma melhoria', href: '/report' },
  { icon: 'help', title: 'Ajuda', subtitle: 'Como o app funciona', href: '/help' },
  { icon: 'reports', title: 'Meu resumo', subtitle: 'Números de uso para compartilhar', href: '/summary' },
  { icon: 'shield', title: 'Privacidade', subtitle: 'O que acontece com seus dados', href: '/privacy' },
  { icon: 'document', title: 'Termos de uso', subtitle: 'As regras para usar o app', href: '/terms' },
];
