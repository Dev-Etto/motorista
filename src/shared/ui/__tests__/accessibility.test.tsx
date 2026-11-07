import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { ChartDataList } from '@features/reports/ChartDataList';
import { palette } from '@shared/theme/theme';
import { DateField } from '@shared/ui/DateField';
import { showDialog } from '@shared/ui/dialog';
import { DialogHost } from '@shared/ui/DialogHost';
import { TextField } from '@shared/ui/fields';
import { LearnMore } from '@shared/ui/LearnMore';
import { Button, Card, Collapsible, EmptyState, ListRow, Notice, Segmented, StepDots } from '@shared/ui/primitives';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
};

describe('acessibilidade dos componentes base', () => {
  it('aviso negativo é alerta assertivo, e o de alerta é educado', async () => {
    await render(
      <>
        <Notice tone="negative" message="Falhou" />
        <Notice tone="warning" message="Atenção" />
        <Notice tone="accent" message="Dica" />
      </>,
    );

    const [negative, warning] = screen.getAllByRole('alert');
    expect(negative?.props.accessibilityLiveRegion).toBe('assertive');
    expect(warning?.props.accessibilityLiveRegion).toBe('polite');
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('o erro do campo é anunciado e vira a dica, e o rótulo inclui a unidade', async () => {
    await render(<TextField label="Distância total" suffix="km" value="" onChangeText={jest.fn()} error="Informe a distância" />);

    const input = screen.getByLabelText('Distância total, km');
    expect(input.props.accessibilityHint).toBe('Informe a distância');
    expect(screen.getByText('Informe a distância').props.accessibilityLiveRegion).toBe('polite');
  });

  it('títulos de card, estado vazio e seção recolhível são cabeçalhos', async () => {
    await render(
      <>
        <Card title="Card">{null}</Card>
        <EmptyState title="Vazio" message="Nada aqui" />
        <Collapsible title="Mais">
          <></>
        </Collapsible>
      </>,
    );

    expect(screen.getAllByRole('header').map((node) => node.props.children)).toEqual(['Card', 'Vazio', 'Mais']);
    expect(screen.getByText('+', { includeHiddenElements: true }).props.importantForAccessibility).toBe('no');
  });

  it('linha só informativa é lida como um item, sem estado desativado', async () => {
    await render(<ListRow title="Custo fixo" subtitle="Mês" value="R$ 100,00" />);

    const row = screen.getByLabelText('Custo fixo, Mês, R$ 100,00');
    expect(row.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('grupo de opções e passos têm rótulo', async () => {
    await render(
      <>
        <Segmented label="Tema" value="a" options={[{ value: 'a', label: 'A' }]} onChange={jest.fn()} />
        <StepDots total={3} current={0} />
      </>,
    );

    expect(screen.getByLabelText('Tema')).toBeTruthy();
    expect(screen.getByLabelText('Passo 1 de 3').props.accessible).toBe(true);
  });

  it('botão e "saiba mais" têm alvo de 48', async () => {
    await render(
      <>
        <Button label="‹" onPress={jest.fn()} />
        <LearnMore title="Saiba mais">
          <></>
        </LearnMore>
      </>,
    );

    const [button, learnMore] = screen.getAllByRole('button');
    expect(StyleSheet.flatten(button?.props.style)).toMatchObject({ minWidth: 48, minHeight: 48 });
    expect(StyleSheet.flatten(learnMore?.props.style)).toMatchObject({ minHeight: 48 });
  });

  it('o contorno forte tem 3:1 contra a superfície nos dois temas', () => {
    expect(contrast(palette.light.borderStrong, palette.light.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(palette.dark.borderStrong, palette.dark.surface)).toBeGreaterThanOrEqual(3);
  });

  it('limpar a data fica fora do botão da data', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const onChange = jest.fn();
    await render(<DateField label="Vence em" value="2026-11-10" onChange={onChange} clearable />);

    const clear = screen.getByLabelText(/Limpar/);
    expect(StyleSheet.flatten(clear.props.style)).toMatchObject({ minHeight: 48 });
    await fireEvent.press(clear);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('o diálogo é anunciado, tem título de cabeçalho e o fundo fica fora do leitor', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(<DialogHost />);
    await act(async () => showDialog({ title: 'Excluir?', message: 'Não volta.', actions: [{ label: 'Cancelar', tone: 'secondary' }] }));

    expect(screen.getByRole('header').props.children).toBe('Excluir?');
    expect(announce).toHaveBeenCalledWith('Excluir?. Não volta.');
    expect(screen.queryByLabelText('Fechar aviso')).toBeNull();
  });

  it('os dados do gráfico aparecem em lista', async () => {
    await render(
      <ChartDataList
        period="month"
        data={[
          { label: '3', value: 12000 },
          { label: '4', value: -500 },
        ]}
      />,
    );

    await fireEvent.press(screen.getByText('Ver os dados do gráfico'));

    expect(screen.getByLabelText('Dia 3, R$ 120,00')).toBeTruthy();
    expect(screen.getByLabelText('Dia 4, -R$ 5,00')).toBeTruthy();
  });
});
