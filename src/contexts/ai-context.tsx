
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AIContextType {
  isAssistantOpen: boolean;
  toggleAssistant: () => void;
}

const AIContext = createContext<AIContextType>({
  isAssistantOpen: false,
  toggleAssistant: () => {},
});

export const AIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const toggleAssistant = useCallback(() => {
    setIsAssistantOpen(prevState => !prevState);
  }, []);

  return (
    <AIContext.Provider value={{ isAssistantOpen, toggleAssistant }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => useContext(AIContext);
