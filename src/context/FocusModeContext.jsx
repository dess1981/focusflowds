import React, { createContext, useState, useContext, useCallback } from 'react';

const FocusModeContext = createContext();

export function FocusModeProvider({ children }) {
  const [focusTaskId, setFocusTaskId] = useState(null);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);

  const startFocusMode = useCallback((taskId) => {
    setFocusTaskId(taskId);
    setNotificationsBlocked(true);
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocusTaskId(null);
    setNotificationsBlocked(false);
  }, []);

  return (
    <FocusModeContext.Provider
      value={{
        focusTaskId,
        notificationsBlocked,
        startFocusMode,
        exitFocusMode,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within FocusModeProvider');
  }
  return context;
}