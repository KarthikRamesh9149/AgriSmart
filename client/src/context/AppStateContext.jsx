import { createContext, useContext, useMemo, useState } from 'react';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const currentYear = new Date().getFullYear();
  const [timeHorizon, setTimeHorizon] = useState(currentYear);

  const value = useMemo(
    () => ({
      selectedDistrict,
      setSelectedDistrict,
      timeHorizon,
      setTimeHorizon,
    }),
    [selectedDistrict, timeHorizon]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
