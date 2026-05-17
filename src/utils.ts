import Node from "./node";
import Edge from "./edge";
import { IO, Input, Output } from "./io";
import { Connecting } from "./edge";

export type IOType = 'input' | 'output';
export interface Position {
  left: number;
  top: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface NodeProps {
  label: string;
  ios: IOprops[];
};
export interface IOprops {
  io: Input | Output;
  value: any;
  label: string;
}

interface GlobalModel {
  container: HTMLElement | null;
  selectedNode: Node | null;
  holdingNode: Node | null;
  editingNode: Node | null;
  selectedEdge: Edge | null;
  isHoldingContainer: boolean;
  selectedIO: {
    from: IO | null,
    to: IO | null,
  };
  connecting: Connecting | null;
  offset: Position,
  mouse: Point,
  nodes: Node[],
  edges: Edge[],
}

export const States: GlobalModel = {
  container: null,
  selectedNode: null,
  holdingNode: null,
  editingNode: null,
  selectedEdge: null,
  isHoldingContainer: false,
  selectedIO: {
    from: null,
    to: null,
  },
  connecting: null,
  offset: {
    left: 0,
    top: 0,
  },
  mouse: {
    x: 0,
    y: 0
  },
  nodes: [],
  edges: [],
}

export interface SerializedIOProps {
  type: IOType;
  value: any;
  label: string;
}

export interface SerializedNodeProps {
  label: string;
  ios: SerializedIOProps[];
}

export interface SerializedNode {
  id: string;
  type: string;
  left: number;
  top: number;
  props: SerializedNodeProps;
}

export interface SerializedEdge {
  fromNodeId: string;
  fromIoIndex: number;
  toNodeId: string;
  toIoIndex: number;
}

export interface SerializedGraph {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

/**
 * Make ID string with random and unique strings.
 * @returns ID string.
 */
export function makeId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  result += '-' + new Date().getTime().toString().substring(6);
  
  if (document.getElementById(result)) {
    return makeId();
  }

  return result;
}
