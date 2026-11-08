import { render, screen } from '@testing-library/react-native';
import { OfferRow } from '@features/offers/OfferRow';
import { OfferHistoryEntry } from '@modules/copilot';

const entry = (overrides: Partial<OfferHistoryEntry> = {}): OfferHistoryEntry => ({
  timestamp: 100,
  source: 'inDrive',
  valueCents: 1300,
  km: 4.3,
  minutes: 10,
  perKmCents: 302,
  perHourCents: 7800,
  color: 'green',
  ...overrides,
});

describe('linha da oferta', () => {
  it('marca o tempo estimado com til', async () => {
    await render(<OfferRow entry={entry({ minutesEstimated: true })} />);

    expect(screen.getByText(/~10 min/)).toBeTruthy();
    expect(screen.getByText(/~R\$\s78/)).toBeTruthy();
  });

  it('tempo lido aparece sem til', async () => {
    await render(<OfferRow entry={entry()} />);

    expect(screen.queryByText(/~/)).toBeNull();
    expect(screen.getByText(/10 min/)).toBeTruthy();
  });

  it('sem tempo mostra só a distância', async () => {
    await render(<OfferRow entry={entry({ minutes: 0, perHourCents: 0 })} />);

    expect(screen.queryByText(/min/)).toBeNull();
  });

  it('a bandeira fica antes do valor, e a nota depois', async () => {
    await render(<OfferRow entry={entry({ score: 4.1 })} />);

    const tree = JSON.stringify(screen.toJSON());
    const order = ['"inDrive"', '"R$', '"4,1"'].map((text) => tree.indexOf(text));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it.each([
    ['accepted', 'Aceita'],
    ['declined', 'Recusada'],
  ] as const)('o status %s vira selo, e o leitor de tela ouve %s', async (status, spoken) => {
    await render(<OfferRow entry={entry({ status })} />);

    expect(screen.getByTestId('offer-status-seal')).toBeTruthy();
    expect(screen.queryByText(spoken)).toBeNull();
    expect(screen.getByLabelText(new RegExp(`, ${spoken}$`))).toBeTruthy();
  });

  it('sem resposta, sem selo', async () => {
    await render(<OfferRow entry={entry()} />);

    expect(screen.queryByTestId('offer-status-seal')).toBeNull();
  });
});
