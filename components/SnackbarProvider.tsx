import { createContext, useCallback, useState } from 'react'
import { Alert, Snackbar, SnackbarCloseReason, Stack } from '@mui/material'

type AlertType = 'success' | 'info' | 'warning' | 'error'

type SnackBarContextProps = {
  toast: (type: AlertType, message: string) => void
}

type Props = {
  children: JSX.Element | JSX.Element[],
}

export const SnackBarContext = createContext<SnackBarContextProps | undefined>(undefined);

const SnackBarProvider = ({ children }: Props) => {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [alertType, setType] = useState<AlertType>('success')

  const cookToast = useCallback((type: AlertType, message: string) => {
    setMessage(message)
    setType(type)
    !visible && setVisible(!visible)
  }, [visible])

  const handleClose = useCallback((evt: React.SyntheticEvent | Event, reason: SnackbarCloseReason) => {
    if (/timeout|escapeKeyDown/i.test(reason)) {
      setVisible(!visible)
    }
  }, [visible])

  return (
    <SnackBarContext.Provider value={{ toast: cookToast }}>
      {children}
      <Stack sx={{ width: "100%" }} spacing={2}>
        <Snackbar open={visible} autoHideDuration={5000} onClose={handleClose}>
          <Alert severity={alertType}>
            {message}
          </Alert>
        </Snackbar>
      </Stack>
    </SnackBarContext.Provider>
  )
}

export default SnackBarProvider
