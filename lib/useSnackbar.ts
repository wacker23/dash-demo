import { useContext } from 'react'
import { SnackBarContext } from '../components/SnackbarProvider'

export const useSnackbar = () => {
  const context = useContext(SnackBarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}
