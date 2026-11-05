import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { activeTargets, DEFAULT_LOW_DEMAND_TARGETS, DEFAULT_OFFER_TARGETS, OfferMode, OfferSettings } from '@/domain/offer/offer';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero } from '@/shared/utils/parse';
import { loadOfferSettings, saveOfferSettings } from './syncTargets';

const INITIAL: OfferSettings = { mode: 'normal', normal: DEFAULT_OFFER_TARGETS, low: DEFAULT_LOW_DEMAND_TARGETS, followGoal: false };

export function useOfferTargets() {
  const [settings, setSettings] = useState<OfferSettings>(INITIAL);
  const [perKm, setPerKm] = useState('');
  const [perHour, setPerHour] = useState('');

  const loadFields = useCallback((next: OfferSettings) => {
    const targets = activeTargets(next);
    setSettings(next);
    setPerKm(centsToInput(targets.targetPerKmCents));
    setPerHour(centsToInput(targets.targetPerHourCents));
  }, []);

  const reload = useCallback(async () => loadFields(await loadOfferSettings()), [loadFields]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

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

  const setFollowGoal = async (followGoal: boolean) => {
    await saveOfferSettings({ ...settings, followGoal });
    await reload();
  };

  const values = useMemo(() => activeTargets(settings), [settings]);

  return {
    mode: settings.mode,
    setMode,
    values,
    followGoal: settings.followGoal,
    setFollowGoal,
    reload,
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
