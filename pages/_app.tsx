import { useMemo } from 'react'
import type { AppProps } from 'next/app'
import { CssBaseline, ThemeProvider } from '@mui/material'
import {createTheme} from "@mui/material/styles"
import {green, yellow} from '@mui/material/colors'
import {SWRConfig} from "swr"
import SessionProvider from '../components/SessionProvider'
import SnackbarProvider from '../components/SnackbarProvider'
import { useDarkMode } from '../lib/utils'
import PresenceProvider from '../components/PresenceProvider';

function MyApp({ Component, pageProps }: AppProps) {
  const prefersDarkMode = useDarkMode();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: green[500],
            contrastText: yellow[600],
          },
          secondary: {
            main: yellow[500],
          },
          background: {
            default: prefersDarkMode ? '#121212' : '#f5f5f5',
          },
        }
      }),
    [prefersDarkMode],
  )

  return (
    <SWRConfig
      value={{
        refreshInterval: 60 * 1000,
        fetcher: (resource: RequestInfo | URL, init?: RequestInit) =>
          fetch(resource, init)
            .then(res => res.json()),
      }}>
      <PresenceProvider>
        <SessionProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider>
              <Component {...pageProps} />
            </SnackbarProvider>
          </ThemeProvider>
        </SessionProvider>
      </PresenceProvider>
    </SWRConfig>
  );
}

export default MyApp
