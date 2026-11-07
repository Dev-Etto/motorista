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
});
