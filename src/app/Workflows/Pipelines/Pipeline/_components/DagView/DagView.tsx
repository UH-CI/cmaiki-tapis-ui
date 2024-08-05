import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useReducer,
} from 'react';
import { EnvironmentNode, StandardNode, ArgsNode } from './Nodes';
import { Workflows } from '@tapis/tapis-typescript';
import { Workflows as Hooks } from '@tapis/tapisui-hooks';
import { Icon } from '@tapis/tapisui-common';
import { useExtension } from 'extensions';
import styles from './DagView.module.scss';
import { Button } from 'reactstrap';
import Tooltip from '@mui/material/Tooltip';
import { useQueryClient } from 'react-query';
import { TaskEditor } from '../../../_components';
import {
  MenuList,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
} from '@mui/material';
import {
  Delete,
  Edit,
  Hub,
  Input,
  Output,
  Visibility,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MarkerType,
  Edge,
  Node,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

type DagViewProps = {
  tasks: Array<Workflows.Task>;
  pipeline: Workflows.Pipeline;
  groupId: string;
};

const DagView: React.FC<DagViewProps> = ({ groupId, pipeline, tasks }) => {
  const nodeTypes = useMemo(
    () => ({ standard: StandardNode, args: ArgsNode, env: EnvironmentNode }),
    []
  );

  let initialNodes: Array<Node> = tasks.map((task, i) => {
    return {
      id: task.id!,
      position: { x: i * 350, y: 200 },
      type: 'standard',
      data: { label: task.id!, task: task, groupId, pipelineId: pipeline.id },
    };
  });

  initialNodes = [
    ...initialNodes,
    {
      id: `${pipeline.id}-env`,
      position: { x: 0, y: 0 },
      type: 'env',
      data: { pipeline },
    },
    {
      id: `${pipeline.id}-args`,
      position: { x: 550, y: 0 },
      type: 'args',
      data: { pipeline },
    },
  ];

  const initialEdges: Array<Edge> = [];
  for (const task of tasks) {
    for (const dep of task.depends_on!) {
      initialEdges.push({
        id: `e-${dep.id}-${task.id}`,
        source: dep.id!,
        target: task.id!,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 10,
          height: 10,
          color: '#000000',
        },
        animated: true,
        style: { stroke: '#000000', strokeWidth: '3px' },
      });
    }
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={styles['dag']}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        defaultViewport={{ x: 20, y: 20, zoom: 2 }}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default DagView;
