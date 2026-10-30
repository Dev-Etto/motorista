import { useEffect, useMemo, useState } from 'react';
import { activeTargets, DEFAULT_LOW_DEMAND_TARGETS, DEFAULT_OFFER_TARGETS, OfferMode, OfferSettings, OfferTargets } from '@/domain/offer/offer';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero } from '@/shared/utils/parse';
import { loadOfferSettings, saveOfferSettings } from './syncTargets';

const INITIAL: OfferSettings = { mode: 'normal', normal: DEFAULT_OFFER_TARGETS, low: DEFAULT_LOW_DEMAND_TARGETS };

export function useOfferTargets() {
  const [settings, setSettings] = useState<OfferSettings>(INITIAL);
  const [perKm, setPerKm] = useState('');
  const [perHour, setPerHour] = useState('');

  const loadFields = (next: OfferSettings) => {
    const targets = activeTargets(next);
    setSettings(next);
    setPerKm(centsToInput(targets.targetPerKmCents));
    setPerHour(centsToInput(targets.targetPerHourCents));
  };

  useEffect(() => {
    void loadOfferSettings().then(loadFields);
  }, []);

  const applyTargets = (nextPerKm: string, nextPerHour: string) => {
    const next = {
      ...settings,
      [settings.mode]: { targetPerKmCents: centsOrZero(nextPerKm), targetPerHourCents: centsOrZero(nextPerHour) },
    };
    setSettings(next);
    void saveOfferSettings(next);
  };

  const setMode = (mode: OfferMode) => {
    const next = { ...settings, mode };
    loadFields(next);
    void saveOfferSettings(next);
  };

  const replaceTargets = (targets: OfferTargets) => {
    const next = { ...settings, [settings.mode]: targets };
    loadFields(next);
    void saveOfferSettings(next);
  };

  const values = useMemo(() => activeTargets(settings), [settings]);

  return {
    mode: settings.mode,
    setMode,
    values,
    replaceTargets,
    perKm: {
      value: perKm,
      onChangeText: (text: string) => {
        setPerKm(text);
        applyTargets(text, perHour);
      },
    },
    perHour: {
      value: perHour,
      onChangeText: (text: string) => {
        setPerHour(text);
        applyTargets(perKm, text);
      },
    },
  };
}

export type OfferTargetsState = ReturnType<typeof useOfferTargets>;
