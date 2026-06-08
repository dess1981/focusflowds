import React, { createContext, useContext, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import FocusTimer from '@/components/focus/FocusTimer';

const FocusTimerContext = createContext(null);

export function FocusTimerProvider({ children }) {
  const [activeTask, setActiveTask] = useState(null);
  const [onCompleteCallback, setOnCompleteCallback] = useState(null);

  const startFocus = (task, onComplete) => {
    setActiveTask(task);
    setOnCompleteCallback(() => onComplete);
  };

  const stopFocus = () => {
    setActiveTask(null);
    setOnCompleteCallback(null);
  };

  return (
    <FocusTimerContext.Provider value={{ startFocus, stopFocus, activeTask }}>
      {children}
      <AnimatePresence>
        {activeTask && (
          <FocusTimer
            key={activeTask.id}
            task={activeTask}
            onClose={stopFocus}
            onComplete={() => {
              onCompleteCallback?.();
              stopFocus();
            }}
          />
        )}
      </AnimatePresence>
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const context = useContext(FocusTimerContext);
  if (!context) {
    return {
      activeTask: null,
      startFocus: () => {},
      stopFocus: () => {},
    };
  }
  return context;
}