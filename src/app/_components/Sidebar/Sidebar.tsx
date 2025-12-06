// TACC Core Styles for icons: https://github.com/TACC/Core-Styles/blob/main/src/lib/_imports/components/cortal.icon.font.css
import React, { useEffect, useState } from 'react';
import { useTapisConfig } from '@tapis/tapisui-hooks';
import styles from './Sidebar.module.scss';
import { Navbar, NavItem } from '@tapis/tapisui-common';
import { useExtension } from 'extensions';
import {
  ExpandLessRounded,
  ExpandMoreRounded,
  Login,
  Logout,
  SettingsRounded,
} from '@mui/icons-material';
import {
  Menu,
  Collapse,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  MenuItem,
  Chip,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { Link, useHistory } from 'react-router-dom';

type SidebarItems = {
  [key: string]: any;
};

const Sidebar: React.FC = () => {
  const { accessToken } = useTapisConfig();
  const { extension } = useExtension();
  const [expanded, setExpanded] = useState(true);
  const [openSecondary, setOpenSecondary] = useState(false); //Added openSecondary state to manage the visibility of the secondary sidebar items.

  const history = useHistory();

  const { claims } = useTapisConfig();

  const renderSidebarItem = (
    to: string,
    icon: string | undefined,
    text: string
  ) => {
    return (
      <NavItem to={to} icon={icon} key={uuidv4()}>
        {expanded ? text : ''}
      </NavItem>
    );
  };

  const sidebarItems: SidebarItems = {
    //Existing sidebar items
    apps: renderSidebarItem('/apps', 'applications', 'Apps'),
    files: renderSidebarItem('/files', 'folder', 'Files'),
    jobs: renderSidebarItem('/jobs', 'jobs', 'Jobs'),
    projects: renderSidebarItem('/projects', 'visualization', 'Projects'),
    metadata: renderSidebarItem(
      '/metadata-form',
      'edit-document',
      'Metadata Form Generator'
    ),
    walkthrough: renderSidebarItem(
      'https://docs.google.com/presentation/d/1UB3VrQXAiCqAJEa0hDQmgmr9TWBlHxPmuo-gtoiRod4/edit#slide=id.g35f391192_00',
      'compass',
      'Walkthrough'
    ),
    help: renderSidebarItem(
      'mailto:uh-hpc-help@lists.hawaii.edu',
      'conversation',
      'Help'
    ),
  };

  if (extension !== undefined) {
    //extension handlng
    for (const [id, service] of Object.entries(extension.serviceMap)) {
      sidebarItems[id] = renderSidebarItem(
        service.route,
        service.iconName,
        service.sidebarDisplayName
      );
    }
  }

  let mainSidebarItems = [];
  let secondarySidebarItems = [];

  for (const [id, item] of Object.entries(sidebarItems)) {
    if (extension && extension.mainSidebarServices.includes(id)) {
      mainSidebarItems.push(item);
    } else {
      secondarySidebarItems.push(item);
    }
  }

  // If there were no main items, we make all items main items
  if (mainSidebarItems.length === 0) {
    mainSidebarItems = secondarySidebarItems;
    secondarySidebarItems = [];
  }

  const toggleSecondaryItems = () => {
    setOpenSecondary(!openSecondary);
  };

  const chipLabel = expanded ? (
    <ExpandLessRounded className={styles['expand-icon--expanded']} />
  ) : (
    <ExpandMoreRounded className={styles['expand-icon--collapsed']} />
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  // const handleModal = () => {
  //   setModal('delete');
  // };

  const useCountdown = (targetTime: number) => {
    const [timeLeft, setTimeLeft] = useState(
      targetTime - Math.floor(Date.now() / 1000)
    );

    useEffect(() => {
      const interval = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const newTimeLeft = targetTime - currentTime;

        if (newTimeLeft <= 0) {
          clearInterval(interval);
          setTimeLeft(0);
        } else {
          setTimeLeft(newTimeLeft);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [targetTime]);

    return timeLeft;
  };

  const CountdownDisplay = ({ expirationTime }: { expirationTime: number }) => {
    const timeLeft = useCountdown(expirationTime);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <div>
        {timeLeft <= 0
          ? 'Expired'
          : `${minutes} minutes, ${seconds} seconds left`}
      </div>
    );
  };

  return (
    <div
      className={`${styles.root} ${
        expanded ? styles['root--expanded'] : styles['root--collapsed']
      }`}
    >
      <div className={styles.header}>
        <Link to={'/'}>
          <img
            className={
              expanded ? styles['logo--expanded'] : styles['logo--collapsed']
            }
            alt="Logo"
            src={
              expanded
                ? extension?.logo?.filePath ||
                  extension?.logo?.url ||
                  extension?.logo?.text ||
                  '/cmaiki-tapis-ui/hawaii-thumb-inverted.png'
                : extension?.icon?.filePath ||
                  extension?.icon?.url ||
                  extension?.logo?.text ||
                  '/cmaiki-tapis-ui/hawaii-thumb-inverted.png'
            }
          />
        </Link>
      </div>

      <Chip
        label={chipLabel}
        variant="outlined"
        size="small"
        style={{
          borderRadius: '8px',
          borderTopLeftRadius: '0px',
          borderBottomLeftRadius: '0px',
          backgroundColor: '#4f5a67',
          borderColor: '#ffffff',
          color: '#ffffff',
          height: '1.5rem',
          width: '1.5rem',
          position: 'absolute',
          right: '-1.55rem',
          top: '1.5rem',
          paddingBottom: '.3rem',
          zIndex: 1000,
        }}
        onClick={() => {
          setExpanded(!expanded);
        }}
      />
      <Navbar>
        {renderSidebarItem('/', 'dashboard', 'Dashboard')}
        {!accessToken && renderSidebarItem('/login', 'user', 'Login')}
        {accessToken && (
          <>
            {mainSidebarItems.map((item) => item)}
            {secondarySidebarItems.length > 0 && (
              <>
                <div
                  onClick={toggleSecondaryItems}
                  className={styles['secondary-items-toggle']}
                >
                  <ListItemButton
                    sx={{
                      color: '#707070',
                      pl: '1.4rem',
                      pt: '5px',
                      pb: '5px',
                    }}
                  >
                    {openSecondary ? (
                      <ExpandLessRounded />
                    ) : (
                      <ExpandMoreRounded />
                    )}
                    {expanded && (
                      <ListItemText primary="More" sx={{ pl: '.5rem' }} />
                    )}
                  </ListItemButton>
                </div>

                <Collapse in={openSecondary}>
                  {secondarySidebarItems.map((item) => item)}
                </Collapse>
              </>
            )}
          </>
        )}
      </Navbar>
      <Chip
        variant="outlined"
        style={{
          borderRadius: '8px',
        }}
        label={
          !expanded ? (
            <SettingsRounded sx={{ width: 24, height: 24 }} />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: 12,
                lineHeight: 1.2,
                overflow: 'hidden',
              }}
            >
              <div>
                <SettingsRounded sx={{ width: 24, height: 24 }} />
              </div>
              {claims['tapis/username'] ? (
                <div style={{ marginLeft: '.4rem', maxWidth: '9rem' }}>
                  {claims['tapis/username']}
                  <br />@{claims['sub'].split('@')[1]}
                </div>
              ) : (
                <div style={{ marginLeft: '.4rem', maxWidth: '9rem' }}>
                  {'Logged Out'}
                </div>
              )}
            </div>
          )
        }
        onClick={handleClick} // Move the click handler here to make the entire div clickable
        sx={{
          height: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '.6rem',
          color: '#ffffff',
          //minWidth: '0rem',
          //width: '2rem',
          '& .MuiChip-label': {
            display: 'flex',
            whiteSpace: 'normal',
          },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          style: {
            maxHeight: 48 * 4.5,
          },
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.52))',
            mt: 0.5,
            ml: 1.2,
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {claims && claims['exp'] && (
          <MenuItem
            disabled
            sx={{
              opacity: '0.7 !important',
              fontSize: '0.75rem',
              minHeight: '36px',
              py: 1,
              justifyContent: 'center',
            }}
          >
            <div>
              <Typography
                variant="caption"
                display="block"
                sx={{ fontSize: '0.8rem', mb: 0.2, textAlign: 'center' }}
              >
                Token Expires:
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.75rem', fontWeight: 500 }}
              >
                <CountdownDisplay expirationTime={claims['exp']} />
              </Typography>
            </div>
          </MenuItem>
        )}
        <Divider />
        {claims && claims['sub'] ? (
          <MenuItem onClick={() => history.push('/logout')}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign out</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => history.push('/login')}>
            <ListItemIcon>
              <Login />
            </ListItemIcon>
            Login
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

export default Sidebar;
