import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme';

const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('cv-builder-theme') || 'dark'; }
    catch { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem('cv-builder-theme', mode); } catch {}
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
