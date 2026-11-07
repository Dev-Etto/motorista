import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { activeTargets, DEFAULT_LOW_DEMAND_TARGETS, DEFAULT_OFFER_TARGETS, OfferMode, OfferSettings } from '@/domain/offer/offer';
import { centsToInput } from '@/shared/utils/money';
import { centsOrZero } from '@/shared/utils/parse';
import { loadOfferSettings, saveFollowGoal, saveModeTargets, saveOfferMode } from './syncTargets';

const INITIAL: OfferSettings = { mode: 'normal', normal: DEFAULT_OFFER_TARGETS, low: DEFAULT_LOW_DEMAND_TARGETS, followGoal: false };

export function useOfferTargets() {
  const [settings, setSettings] = useState<OfferSettings>(INITIAL);
  const [perKm, setPerKm] = useState('');
  const [perHour, setPerHour] = useState('');
  const editing = useRef(false);

  const loadFields = useCallback((next: OfferSettings) => {
    const targets = activeTargets(next);
    editing.current = false;
    setSettings(next);
    setPerKm(centsToInput(targets.targetPerKmCents));
    setPerHour(centsToInput(targets.targetPerHourCents));
  }, []);

  const reload = useCallback(async () => loadFields(await loadOfferSettings()), [loadFields]);

  useFocusEffect(
    useCallback(() => {
      if (editing.current) return;
      void reload();
    }, [reload]),
  );

  const applyTargets = (nextPerKm: string, nextPerHour: string) => {
    editing.current = true;
    const next = {
      ...settings,
      [settings.mode]: { targetPerKmCents: centsOrZero(nextPerKm), targetPerHourCents: centsOrZero(nextPerHour) },
    };
    setSettings(next);
    const targets = next[settings.mode];
    if (targets.targetPerKmCents > 0 && targets.targetPerHourCents > 0) void saveModeTargets(settings.mode, targets);
  };

  const setMode = (mode: OfferMode) => {
    loadFields({ ...settings, mode });
    void saveOfferMode(mode);
  };

  const setFollowGoal = async (followGoal: boolean) => {
    await saveFollowGoal(followGoal);
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
