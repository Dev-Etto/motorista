import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { OfferRow } from '@features/offers/OfferRow';
import { copilot } from '@modules/copilot';
import { showDialog } from '@shared/ui/dialog';

jest.mock('@shared/ui/dialog', () => ({ showDialog: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { setOfferStatus: jest.fn().mockResolvedValue(undefined) } }));

const ENTRY = { timestamp: 77, source: 'Uber', valueCents: 1840, km: 8.5, minutes: 19, perKmCents: 216, perHourCents: 5810, color: 'green' as const };

describe('corrigir o resultado da oferta', () => {
  it('marca a oferta como aceita e recarrega', async () => {
    const onCorrected = jest.fn();
    await render(<OfferRow entry={ENTRY} onCorrected={onCorrected} />);

    await fireEvent.press(screen.getByRole('button'));
    await act(async () => jest.mocked(showDialog).mock.calls.at(-1)?.[0].actions[0]?.onPress?.());

    expect(copilot.setOfferStatus).toHaveBeenCalledWith(77, 'accepted');
    expect(onCorrected).toHaveBeenCalled();
  });

  it('sem correção, a linha não é um botão', async () => {
    await render(<OfferRow entry={ENTRY} />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
