import React, { useState } from 'react';
import { Add } from '@mui/icons-material';
import { Button } from '@mui/material';
import CreateProjectModal from './CreateProjectModal';

const ProjectsToolbar: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsCreateOpen(true)}
        startIcon={<Add />}
        variant="outlined"
        size="small"
      >
        Create Project
      </Button>
      <CreateProjectModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
};

export default ProjectsToolbar;
