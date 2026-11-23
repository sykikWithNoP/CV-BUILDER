import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Drawer,
  List, ListItemButton, ListItemIcon, ListItemText, Box, Avatar, Chip, Button, Tooltip,
  Menu, MenuItem, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import VerifiedIcon from '@mui/icons-material/Verified';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import GavelIcon from '@mui/icons-material/Gavel';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = mode === 'dark';
  const menuOpen = Boolean(anchorEl);

  const handleLogout = async () => { setAnchorEl(null); await logout(); navigate('/login'); };
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Signed-in-only destinations stay hidden rather than bouncing guests to a login page.
  const navItems = [
    { icon: <HomeIcon />, label: 'Home', path: '/' },
    { icon: <InfoIcon />, label: 'About', path: '/about' },
    { icon: <ViewCarouselIcon />, label: 'Templates', path: '/templates' },
    { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard', authOnly: true },
    { icon: <SettingsIcon />, label: 'Custom Design', path: '/custom-design', authOnly: true },
    { icon: <GavelIcon />, label: 'Legal & Ethics', path: '/legal' },
  ].filter((item) => !item.authOnly || user);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: "'Space Grotesk'", fontWeight: 700 }}>
            <Box component="span" className="gradient-text">CV</Box> Builder
          </Typography>

          {/* Theme Toggle */}
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* This tracks email confirmation only — it used to also require a
                  college affiliation, so confirmed users were labelled unverified. */}
              {user.verified ? (
                <Chip icon={<VerifiedIcon />} label={user.college_affiliation || 'Verified'} size="small"
                  sx={{ bgcolor: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', fontWeight: 500 }}
                />
              ) : (
                <Chip label="Unverified" size="small" onClick={() => navigate('/verify-email')}
                  sx={{ bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', fontWeight: 500, cursor: 'pointer' }}
                />
              )}
              {/* Clickable account area */}
              <Box
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                  px: 1.5, py: 0.5, borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                }}
              >
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                  {user.first_name} {user.last_name}
                </Typography>
                <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </Avatar>
              </Box>

              {/* Account Management Menu */}
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5, minWidth: 220, borderRadius: 2,
                    background: isDark ? 'rgba(15, 16, 41, 0.95)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.first_name} {user.last_name}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{user.email}</Typography>
                </Box>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}
                  sx={{ mt: 1, mx: 1, borderRadius: 1 }}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/account'); }}
                  sx={{ mx: 1, borderRadius: 1 }}>
                  <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/account'); }}
                  sx={{ mx: 1, borderRadius: 1 }}>
                  <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
                  Change Password
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={handleLogout}
                  sx={{ mx: 1, borderRadius: 1, color: '#f87171', '&:hover': { bgcolor: 'rgba(248,113,113,0.08)' } }}>
                  <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#f87171' }} /></ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="text" size="small" startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{ color: 'inherit', fontWeight: 500 }}>
                Login
              </Button>
              <Button variant="contained" size="small" startIcon={<PersonAddIcon />}
                onClick={() => navigate('/signup')}
                sx={{ borderRadius: 2 }}>
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)} anchor="left">
        <Box sx={{ width: 260, pt: 9 }} role="presentation" onClick={() => setOpen(false)}>
          {user && (
            <Box sx={{ px: 3, pb: 2, mb: 1, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <Avatar sx={{ width: 48, height: 48, mb: 1.5,
                background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '1.1rem' }}>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </Avatar>
              <Typography sx={{ fontWeight: 600 }}>{user.first_name} {user.last_name}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{user.email}</Typography>
              {user.verified ? (
                <Chip icon={<VerifiedIcon />} label={user.college_affiliation || 'Verified'} size="small" sx={{ mt: 1, bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 500 }} />
              ) : (
                <Chip label="Unverified" size="small" component={Link} to="/verify-email" clickable sx={{ mt: 1, bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171', fontWeight: 500 }} />
              )}
            </Box>
          )}
          <List>
            {navItems.map((item) => (
              <ListItemButton key={item.path} component={Link} to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1, borderRadius: 2, mb: 0.5,
                  '&.Mui-selected': { bgcolor: 'rgba(102, 126, 234, 0.12)', color: '#8b9cf7' },
                  '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' },
                }}>
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {user ? (
              <>
                <ListItemButton component={Link} to="/account"
                  selected={location.pathname === '/account'}
                  sx={{ mx: 1, borderRadius: 2, mt: 1,
                    '&.Mui-selected': { bgcolor: 'rgba(102, 126, 234, 0.12)', color: '#8b9cf7' },
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' } }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><AccountCircleIcon /></ListItemIcon>
                  <ListItemText primary="My Account" />
                </ListItemButton>
                <ListItemButton onClick={handleLogout}
                  sx={{ mx: 1, borderRadius: 2, mt: 0.5, color: 'text.secondary',
                    '&:hover': { bgcolor: 'rgba(248, 113, 113, 0.08)', color: '#f87171' } }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={Link} to="/login"
                  sx={{ mx: 1, borderRadius: 2, mt: 1,
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' } }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LoginIcon /></ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItemButton>
                <ListItemButton component={Link} to="/signup"
                  sx={{ mx: 1, borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' } }}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><PersonAddIcon /></ListItemIcon>
                  <ListItemText primary="Sign Up" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* minWidth: 0 — without it this flex item is sized by its widest child, so
          a horizontally scrolling row (the template strip) stretched the whole
          page instead of scrolling inside its own box. */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, pt: 8, minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
