export interface ProblemReportInput {
  description: string;
  version: string;
  android: string;
  device: string;
  accessibilityGranted: boolean;
  failedReads: number;
  readings: string[];
}

export function buildProblemReport(input: ProblemReportInput): string {
  const lines = [
    'Relato do app Motorista',
    '',
    input.description.trim() || '(sem descrição)',
    '',
    `Versão: ${input.version}`,
    `Android: ${input.android}`,
    `Aparelho: ${input.device}`,
    `Acessibilidade: ${input.accessibilityGranted ? 'ativa' : 'desativada'}`,
    `Leituras incompletas: ${input.failedReads}`,
  ];
  if (input.readings.length === 0) return lines.join('\n');
  return [...lines, '', 'O que o Copiloto leu (palavras mascaradas):', ...input.readings].join('\n');
}
