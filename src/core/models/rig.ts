import * as React from 'react';
import { PositionProperty } from 'csstype';

export interface RigExtensionView {
  x: number;
  y: number;
  orientation: string;
  id: string;
  channelId: string;
  extension: ExtensionCoordinator.ExtensionObject;
  features: {
    isChatEnabled: boolean;
  };
  type: string;
  mode?: string;
  role: string;
  linked: boolean;
  isPopout: boolean;
  deleteViewHandler?: (id: string) => void;
  openEditViewHandler?: (id: string) => void;
  frameSize?: FrameSize;
}

export interface FrameSize {
  height: number;
  width: number;
}
