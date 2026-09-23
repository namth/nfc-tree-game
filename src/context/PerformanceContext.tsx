/**
 * Performance & Visual Effects Context
 * Project: Fractal Tree NFC Mobile Game
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { Preferences } from '../storage/preferences';
import { TargetFps } from '../types';

interface PerformanceContextValue {
  effectsEnabled: boolean;
  setEffectsEnabled: (enabled: boolean) => void;
  targetFps: TargetFps;
  setTargetFps: (fps: TargetFps) => void;
}

const PerformanceContext = createContext<PerformanceContextValue>({
  effectsEnabled: true,
  setEffectsEnabled: () => {},
  targetFps: 60,
  setTargetFps: () => {}
});

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [effectsEnabled, setEffectsEnabledState] = useState<boolean>(() => Preferences.getEffectsEnabled());
  const [targetFps, setTargetFpsState] = useState<TargetFps>(() => Preferences.getTargetFps());

  const setEffectsEnabled = (enabled: boolean) => {
    setEffectsEnabledState(enabled);
    Preferences.setEffectsEnabled(enabled);
  };

  const setTargetFps = (fps: TargetFps) => {
    setTargetFpsState(fps);
    Preferences.setTargetFps(fps);
  };

  const value = useMemo(
    () => ({
      effectsEnabled,
      setEffectsEnabled,
      targetFps,
      setTargetFps
    }),
    [effectsEnabled, targetFps]
  );

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>;
};

export const usePerformance = () => useContext(PerformanceContext);
