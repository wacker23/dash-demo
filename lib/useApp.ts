import { useContext } from 'react';
import { PresenceContext } from '../components/PresenceProvider';

export const useApp = () => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
}
