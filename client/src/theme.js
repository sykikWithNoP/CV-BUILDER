import { createTheme } from '@mui/material/styles';

export function createAppTheme(mode = 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: '#667eea', light: '#8b9cf7', dark: '#4a5fc7' },
      secondary: { main: '#764ba2', light: '#9b6fc7', dark: '#5a3480' },
      background: {
        default: isDark ? '#0a0a1a' : '#f5f5f7',
        paper: isDark ? '#0f1029' : '#ffffff',
      },
      success: { main: '#34d399' },
      error: { main: '#f87171' },
      warning: { main: '#fbbf24' },
      text: {
        primary: isDark ? '#e8eaed' : '#1a1a2e',
        secondary: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
      },
    },
    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      h1: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h2: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h3: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 },
      h4: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
      h5: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
      h6: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark ? '#0a0a1a' : '#f5f5f7',
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '10px 24px',
            fontSize: '0.95rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(135deg, #7b93f5 0%, #8b5fb8 100%)',
              boxShadow: '0 6px 25px rgba(102, 126, 234, 0.45)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(15, 16, 41, 0.85)' : '#ffffff',
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              color: isDark ? '#e8eaed' : '#1a1a2e',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(102, 126, 234, 0.4)' },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.15)',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            },
            '& .MuiInputBase-input': {
              color: isDark ? '#e8eaed' : '#1a1a2e',
            },
            '& .MuiInputBase-input::placeholder': {
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              opacity: 1,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
          icon: {
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(15, 16, 41, 0.8)' : '#ffffff',
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 16,
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(10, 10, 26, 0.9)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: isDark ? 'rgba(10, 10, 26, 0.97)' : '#ffffff',
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.08)',
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            color: isDark ? '#e8eaed' : '#1a1a2e',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
        },
      },
    },
  });
}

// Default export for backward compatibility
const theme = createAppTheme('dark');
export default theme;
