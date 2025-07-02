import Image from 'next/image';
import Head from "next/head";
import React, { Fragment, useEffect, useState } from 'react';
import {
  Box, Button, Chip,
  Container,
  Divider,
  Grid, IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText, Menu, MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import {styled, useTheme, Theme, CSSObject} from '@mui/material/styles'
import MuiAppBar, {AppBarProps as MuiAppBarProps} from "@mui/material/AppBar"
import MuiDrawer from '@mui/material/Drawer'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AccountCircle from '@mui/icons-material/AccountCircle'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Login from '../components/Login'
import { useSession } from '../lib/useSession'
import { useUser } from '../lib/useUser'
import { useRouter } from 'next/router'
import * as app from '../app';

const drawerWidth = 200;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
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

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({theme, open}) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
  padding: theme.spacing(0, 1),
}));

type Props = {
  title?: string;
  menuBar?: {
    icon: JSX.Element;
    iconName: string;
    iconLabel?: string;
    onClick: () => void;
  }[];
  children: JSX.Element | JSX.Element[];
  window?: () => Window;
}

export default function Layout({ title, children, window, ...props }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const session = useSession();
  const user = useUser();
  const [adminOpen, setAdminOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [logoUri, setLogoUri] = useState('');

  useEffect(() => {
    if (user.logo_uri !== '') {
      setLogoUri(user.logo_uri);
    }
  }, [user]);

  const handleAdminToggle = () => {
    if (user.privileged || user.role === 'admin') {
      setAdminOpen(!adminOpen);
    } else {
      setAdminOpen(false);
    }
  }

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  }

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  }

  const handleMenuClose = () => {
    setMenuAnchor(null);
  }

  const handleSignOut = async () => {
    session.signOut();
    await router.replace('/');
    router.reload();
  }

  const drawer = (
    <>
      <DrawerHeader>
        {logoUri.trim() !== '' && (
          <Image
            src={`https://api.stl1.co.kr${logoUri}`}
            alt={'logo'}
            width={'120'}
            height={'46'}
            priority={true}
            onError={() => setLogoUri('')} />
        )}
      </DrawerHeader>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            href={'/'}
            sx={{
              minHeight: 48,
              justifyContent: 'initial',
            }}>
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 'auto',
                justifyContent: 'center',
              }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary={'고장 예측 AI 원격 관제'}
              sx={{
                opacity: 1,
                ml: 1,
                my: 0,
              }} />
          </ListItemButton>
        </ListItem>
        {(user.privileged || user.role === 'admin') && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                alignItems={'flex-start'}
                onClick={handleAdminToggle}>
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 'auto',
                    justifyContent: 'flex-start',
                  }}>
                  <ManageAccountsIcon />
                </ListItemIcon>
                <ListItemText
                  primary={'관리자 메뉴'}
                  primaryTypographyProps={{
                    fontSize: 16,
                    mb: '2px',
                  }}
                  secondary={'원격관제 솔루션 관리'}
                  secondaryTypographyProps={{
                    noWrap: true,
                    fontSize: 12,
                    lineHeight: '15px',
                  }}
                  sx={{
                    opacity: 1,
                    ml: 1,
                    my: 0,
                  }} />
                <KeyboardArrowDownIcon
                  sx={{
                    mr: -1,
                    transform: adminOpen ? 'rotate(-180deg)' : 'rotate(0deg)',
                    transition: '0.2s'
                  }} />
              </ListItemButton>
            </ListItem>
            {adminOpen && user.menus.map(({name: menuName, path}) => (
              <ListItem
                key={`drawer_menu_${menuName}`}
                disablePadding>
                <ListItemButton href={path}>
                  <ListItemText
                    primary={menuName}
                    sx={{
                      opacity: 1,
                      ml: 4,
                      my: 0,
                    }} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
      <Box sx={{textAlign: 'right', mr: 2, mb: 1}}>
        <Typography>
          {`version ${app.VERSION}`}
        </Typography>
      </Box>
    </>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  if (!session.isLoaded) {
    return <></>;
  }

  return (
    <Box sx={{display: 'flex', minHeight: '100vh'}}>
      <Head>
        <title>STL</title>
        <meta name="description" content="현황판" />
        <meta name="theme-color" content={`${theme.palette.primary.main}`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {session.isLoggedIn ? (
        <>
          <AppBar
            open={drawerOpen}
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)`, xs: '100%' },
              ml: { sm: `${drawerWidth}px`, xs: 0 },
            }}>
            <Toolbar variant={'dense'}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                edge="start"
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                {title}
              </Typography>
              <Box sx={{ flexGrow: 0 }}>
                {props.menuBar && props.menuBar.map(({icon, iconName, iconLabel, onClick}) => (
                  <Fragment key={iconLabel}>
                    {iconLabel ? (
                      <>
                        <IconButton
                          key={iconName}
                          size={'large'}
                          edge={'end'}
                          color={'secondary'}
                          sx={{ mx: 0, display: { xs: 'inline-flex', sm: 'none' } }}
                          aria-label={iconName}
                          onClick={onClick}>
                          {icon}
                        </IconButton>
                        <Button
                          key={iconName}
                          color={'secondary'}
                          variant={'outlined'}
                          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                          startIcon={icon}
                          onClick={onClick}>
                          {iconLabel}
                        </Button>
                      </>
                    ) : (
                      <IconButton
                        key={iconName}
                        size={'large'}
                        edge={'start'}
                        color={'inherit'}
                        sx={{ mx: 0 }}
                        aria-label={iconName}
                        onClick={onClick}>
                        {icon}
                      </IconButton>
                    )}
                  </Fragment>
                ))}
              </Box>
              <Box
                component={'div'}
                sx={{ ml: 3 }}>
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
                  <MenuItem disabled>
                    @{user.organization}
                  </MenuItem>
                  <MenuItem onClick={handleSignOut}>
                    로그아웃
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
          <Box
            component={'nav'}
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 1 } }}>
            <MuiDrawer
              container={container}
              variant={'temporary'}
              open={drawerOpen}
              onClose={handleDrawerClose}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                zIndex: { xs: 9999 },
                display: { xs: 'flex', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}>
              {drawer}
            </MuiDrawer>
            <Drawer
              container={container}
              variant={'permanent'}
              open
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}>
              {drawer}
            </Drawer>
          </Box>
          <Main open={drawerOpen}>
            <Container
              maxWidth={false}
              sx={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                marginTop: theme.spacing(6),
                height: `calc(100% - ${theme.spacing(6)})`,
              }}>
              <Box
                component={'div'}
                sx={{
                  padding: '.5rem 0 0',
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  overflowY: 'scroll',
                }}>
                <Grid container spacing={3}>
                  {children}
                </Grid>
              </Box>
              <Box
                component={'footer'}
                sx={{
                  display: 'flex',
                  padding: '.25rem 0 .5rem',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  overflow: 'hidden',
                  '& a': {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexGrow: 1,
                  },
                }}>
                <Typography noWrap component="p">
                  {'2023 (c) STL'}
                </Typography>
              </Box>
            </Container>
          </Main>
        </>
        ) : (
        <Box sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
        }}>
          <Login />
        </Box>
      )}
    </Box>
  );
}
