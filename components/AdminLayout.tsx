import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import MenuIcon from '@mui/icons-material/Menu'
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import SwipeableDrawer from '@mui/material/SwipeableDrawer'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'
import AccountCircle from '@mui/icons-material/AccountCircle'
import DevicesIcon from '@mui/icons-material/Devices';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import { useSession } from '../lib/useSession'
import { useUser } from '../lib/useUser'
import { Chip, Menu, MenuItem } from '@mui/material';

type Props = {
  children: JSX.Element | JSX.Element[],
  title?: string,
  layoutType: 'view' | 'edit';
}

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
}));

export default function Layout({ children, title, layoutType, ...props }: Props) {
  const isMobile = useRef(/Android|iPhone|iPad|iOS/i.test(navigator.userAgent));
  const theme = useTheme();
  const router = useRouter();
  const session = useSession();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  }

  const handleMenuClose = () => {
    setMenuAnchor(null);
  }

  const handleFabClick = () => {
    router.push('/console/device/new').then(() => false);
  };

  const handleSignOut = async () => {
    session.signOut();
    router.reload();
  }

  useEffect(() => {
   if (!isMobile.current) {
     document.location.replace('/');
   }
    const handleResize = () => {
      let vh = window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (!session.isLoaded) {
    return <></>;
  }

  return (
    <Box sx={{
      display: 'flex',
      flex: 1,
      minHeight: 'calc(var(--vh, 1vh))',
      maxHeight: 'calc(var(--vh, 1vh))',
    }}>
      <Head>
        <title>STL 통합 관리</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content={`${theme.palette.primary.main}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {session.isLoggedIn ? (
        <>
          <AppBar position="fixed" open={open}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{ mr: 2, ...(open && { display: 'none' }) }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant={'h6'}
                noWrap
                component={'div'}
                sx={{ flexGrow: 1, }}>
                {title ?? user.menus[0].name}
              </Typography>
              <Box
                component={'div'}>
                <Chip
                  clickable
                  avatar={(
                    <AccountCircle />
                  )}
                  label={user.name}
                  onClick={handleMenuClick} />
                <Menu
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                  anchorEl={menuAnchor}>
                  <MenuItem onClick={handleSignOut}>
                    로그아웃
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
          <SwipeableDrawer
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
              },
            }}
            anchor={'left'}
            open={open}
            onOpen={handleDrawerOpen}
            onClose={handleDrawerClose}>
            <DrawerHeader>
              <Image
                src={'/logo.png'}
                alt={'logo'}
                width={'120'}
                height={'46'}
                priority={true} />
            </DrawerHeader>
            <Divider />
            <List>
              {user.menus.map(({name}, index) => (
                <ListItem key={name} disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      {index % 2 === 0 ? <DevicesIcon /> : <ManageAccountsIcon />}
                    </ListItemIcon>
                    <ListItemText primary={name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </SwipeableDrawer>
          <Main
            open={open}>
            <Container
              disableGutters
              maxWidth={false}
              sx={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                marginTop: theme.spacing(6),
                height: `calc(100% - ${theme.spacing(6)})`,
              }}>
              {children}
            </Container>
          </Main>
          {layoutType === 'view' && (
            <Fab
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
              }}
              color={'secondary'}
              aria-label="add"
              onClick={handleFabClick}>
              <AddIcon />
            </Fab>
          )}
        </>
      ) : (
        <Box sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
        }}>
          {children}
        </Box>
      )}
    </Box>
  )
}
