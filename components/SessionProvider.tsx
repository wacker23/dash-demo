import { createContext, useEffect, useState } from 'react';
import UserDto, { SignInDto, SignInErrorDto, UserMenu } from '../types/user.dto';

type SessionContextProps = {
  isLoaded: boolean;
  isLoggedIn: boolean;
  challenge: (username: string, passcode: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<SignInDto>;
  signOut: () => void;
}

type UserContextProps = {
  name: string;
  role: string;
  privileged: boolean;
  organization: string;
  logo_uri: string;
  menus: UserMenu[];
}

type Props = {
  children: JSX.Element | JSX.Element[],
}

export const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const UserContext = createContext<UserContextProps | undefined>(undefined);

const SessionProvider = ({ children }: Props) => {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [hasPrivilege, setHasPrivilege] = useState(false);
  const [name, setName] = useState<string>('');
  const [logoUri, setLogoUri] = useState('');
  const [roleName, setRoleName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [menus, setMenus] = useState<UserMenu[]>([]);

  useEffect(() => {
    fetch('/api/agentCheck', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
      })
      .catch(() => {
        // do nothing
      });
    fetch('/api/verify', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setIsSignedIn(data.isLoggedIn);
        setIsLoaded(true);
      })
      .catch(() => {
        setIsSignedIn(false);
        setIsLoaded(true);
      })
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/profile', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then((data: UserDto) => {
          setName(data.name);
          setLogoUri(data.logo_uri);
          setRoleName(data.role);
          setHasPrivilege(data.privileged);
          setOrgName(data.organization);
          setMenus(data.menus);
        });
    }
  }, [isSignedIn]);

  const challenge = async (username: string, passcode: string) => {
    const response = await fetch("/api/challenge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        passcode,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setToken(data["access_token"]);
    } else {
      throw new Error(data["description"]);
    }
  }

  const signIn = async (username: string, password: string) => {
    const response = await fetch("/api/signIn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    const data = await response.json() as SignInDto | SignInErrorDto;
    if (response.ok) {
      const {
        need_2fa,
        access_token,
        expiry_time,
      } = data as SignInDto;
      if (!need_2fa) {
        setToken(access_token);
      }
      return {
        need_2fa,
        access_token,
        expiry_time,
      };
    } else {
      const {description} = data as SignInErrorDto;
      throw new Error(description);
    }
  };

  const signOut = async () => {
    const response = await fetch("/api/signOut");
    if (response.ok) {
      setToken(undefined);
    }
  }

  return (
    <SessionContext.Provider
      value={{
        isLoaded,
        isLoggedIn: isSignedIn,
        challenge,
        signIn,
        signOut
      }}>
      <UserContext.Provider
        value={{
          name,
          logo_uri: logoUri,
          role: roleName,
          privileged: hasPrivilege,
          organization: orgName,
          menus,
        }}>
        {children}
      </UserContext.Provider>
    </SessionContext.Provider>
  );
}

export default SessionProvider;
