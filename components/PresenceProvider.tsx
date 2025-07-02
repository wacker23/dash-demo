import { createContext } from 'react';

type PresenceContextProps = {
  setValue: (key: string, value: string) => void;
  getValue: (key: string) => string;
}

type Props = {
  children: JSX.Element | JSX.Element[],
}

export const PresenceContext = createContext<PresenceContextProps | undefined>(undefined);

export const PresenceProvider = ({ children }: Props) => {
  const setValue = (key: string, value: string) => {
    // save to local storage
    localStorage.setItem(key, value);
  };

  const getValue = (key: string): string => {
    return localStorage.getItem(key) ?? '';
  }

  return (
    <PresenceContext.Provider
      value={{
        setValue,
        getValue,
      }}>
      {children}
    </PresenceContext.Provider>
  );
}

export default PresenceProvider;
