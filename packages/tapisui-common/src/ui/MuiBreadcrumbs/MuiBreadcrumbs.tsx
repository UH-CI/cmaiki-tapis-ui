import React, { useCallback, useState, useEffect } from 'react';
import { Files } from '@tapis/tapis-typescript';
import { Box, Button, Breadcrumbs, Link, Typography } from '@mui/material';
import { ArrowBack, NavigateNext } from '@mui/icons-material';

export type OnNavigateCallback = (file: Files.FileInfo) => any;

export const useFileNavigation = (
  initialPath: string,
  onNavigate?: OnNavigateCallback
) => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath || '/');

  // Initialize current path
  useEffect(() => {
    setCurrentPath(initialPath || '/');
  }, [initialPath]);

  const navigateToPath = useCallback(
    (targetPath: string) => {
      setCurrentPath(targetPath);
      if (onNavigate) {
        const pathSegments = targetPath.split('/').filter(Boolean);
        const dirInfo: Files.FileInfo = {
          name: pathSegments[pathSegments.length - 1] || '',
          path: targetPath,
          type: Files.FileTypeEnum.Dir,
        };
        onNavigate(dirInfo);
      }
    },
    [onNavigate]
  );

  const navigateToDirectory = useCallback(
    (file: Files.FileInfo) => {
      const targetPath = file.path || `${currentPath}/${file.name}`;
      navigateToPath(targetPath);
    },
    [currentPath, navigateToPath]
  );

  const goBack = useCallback(() => {
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length > 0) {
      segments.pop();
      const parentPath = segments.length ? '/' + segments.join('/') : '/';
      navigateToPath(parentPath);
    }
  }, [currentPath, navigateToPath]);

  const canGoBack = currentPath !== '/';

  return {
    currentPath,
    canGoBack,
    navigateToPath,
    navigateToDirectory,
    goBack,
  };
};

interface MuiBreadcrumbsProps {
  currentPath: string;
  onBack: () => void;
  canGoBack: boolean;
  onNavigateToPath: (path: string) => void;
  className?: string;
}

const MuiBreadcrumbs: React.FC<MuiBreadcrumbsProps> = ({
  currentPath,
  onBack,
  canGoBack,
  onNavigateToPath,
  className,
}) => {
  const pathSegments = currentPath.split('/').filter(Boolean);

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const fsPath = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;

    if (isLast) {
      return (
        <Typography key={fsPath} color="text.primary" fontSize="1rem">
          {segment}
        </Typography>
      );
    }

    return (
      <Link
        key={fsPath}
        underline="hover"
        color="inherit"
        onClick={() => onNavigateToPath(fsPath)}
        fontSize="1rem"
        sx={{ cursor: 'pointer' }}
      >
        {segment}
      </Link>
    );
  });

  const breadcrumbs = [
    <Link
      key="root"
      underline="hover"
      color="inherit"
      onClick={() => onNavigateToPath('/')}
      sx={{ cursor: 'pointer' }}
    >
      /
    </Link>,
    ...breadcrumbItems,
  ];

  return (
    <Box className={className}>
      <Box sx={{ flex: 1 }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
          {breadcrumbs}
        </Breadcrumbs>
      </Box>
      <Box>
        <Button
          variant="text"
          onClick={onBack}
          disabled={!canGoBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default MuiBreadcrumbs;
