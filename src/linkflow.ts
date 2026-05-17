import { NodeProps, States, SerializedGraph } from './utils';
import Edge from './edge';
import Node from './node';
import { Output } from './io';
import { styling } from './styling';
import PropsPanel from './props-panel';

export class Linkflow {
  panel: PropsPanel = new PropsPanel(this.updateProps);

  constructor(containerId: string) {
    States.container = document.getElementById(containerId);
    if (States.container === null) return;
    States.container.classList.add('linkflow');
    States.container.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e));
    States.container.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), { passive: false });
    States.offset.top = States.container.getBoundingClientRect()['top'];
    States.offset.left = States.container.getBoundingClientRect()['left'];

    window.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e: MouseEvent) => this.onMouseUp(e));
    window.addEventListener('keyup', (e: KeyboardEvent) => this.onKeyUp(e));

    const style = document.createElement('style');
    style.textContent = styling;
    document.head.appendChild(style);

    const canvas = document.createElement('div');
    canvas.classList.add('lf-canvas');
    States.canvas = canvas;
    States.container.appendChild(canvas);
    States.container.appendChild(this.panel.render());
  }

  addNode(node: Node) {
    node.bindOnSelected((n) => this.onSelectedNode(n));
    States.nodes.push(node);
    this.mount(node.render());
  }

  removeNode(nodeId: string) {
    States.nodes = States.nodes.filter((v) => v.id !== nodeId);
  }

  mount(dom: HTMLElement) {
    if (States.canvas !== null) {
      States.canvas.appendChild(dom);
    }
  }

  private onMouseDown(e: MouseEvent) {
    States.isHoldingContainer = true;
    States.mouse.x = e.clientX;
    States.mouse.y = e.clientY;
    States.selectedNode = null;
    const selected = document.querySelectorAll('div.node.selected');
    for (const sel of selected) {
      sel.classList.remove('selected');
    }
    if (States.selectedEdge) {
      States.selectedEdge.deselect();
      States.selectedEdge = null;
    }
    this.panel.reset();
  }

  private onMouseMove(e: MouseEvent) {
    const diff = {
      x: (e.clientX - States.mouse.x) / States.zoom,
      y: (e.clientY - States.mouse.y) / States.zoom,
    }
    if (States.holdingNode) {
      // Moving node
      States.holdingNode.move(diff.x, diff.y);
      // Moving Edge
      for (const edge of States.edges) {
        if (edge.includeNode(States.holdingNode.id)) edge.move();
      }
      
    } else if (States.connecting) {
      // Re-route only when dragging from an input that already has a connection
      if (States.connecting.io.type === 'input') {
        for (const edge of States.edges) {
          if (edge.from.id === States.connecting.io.id || edge.to.id === States.connecting.io.id) {
            this.removeEdge(edge);
            break;
          }
        }
      }
      States.connecting.move(e.clientX, e.clientY);

    } else if (States.isHoldingContainer) {
      this.move(diff.x, diff.y);
    }

    States.mouse.x = e.clientX;
    States.mouse.y = e.clientY;
  }

  private onMouseUp(e: MouseEvent) {
    if (States.connecting) {
      this.connect();
      document.getElementById('drawing')?.remove();
    }
    
    States.holdingNode = null;
    States.connecting = null;
    States.isHoldingContainer = false;
    States.selectedIO = {
      from: null,
      to: null,
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    switch (e.key) {
      case 'Delete':
        if (States.selectedEdge !== null) {
          this.removeEdge(States.selectedEdge);
          States.selectedEdge = null;
        } else if (States.selectedNode !== null) {
          const selectedId = States.selectedNode.id;
          States.selectedNode.remove();
          States.nodes = States.nodes.filter((v) => v.id !== selectedId);
          const edgesToRemove = States.edges.filter((v) => v.includeNode(selectedId));
          for (const edge of edgesToRemove) {
            this.removeEdge(edge);
          }
          States.selectedNode = null;
        }
        break;
      case 'Escape':
        const selected = document.querySelectorAll('div.node.selected');
        for (const sel of selected) {
          sel.classList.remove('selected');
        }
        const editing = document.querySelector('div.node.editing');
        editing?.classList.remove('editing');

        States.selectedNode = null;
        this.panel.reset();
        break;
    }
  }

  private connect() {
    if (States.selectedIO.from === null || States.selectedIO.to === null) return;
    if (States.selectedIO.from.type === States.selectedIO.to.type) return;

    // Input side must not already have a connection
    const inputIO = States.selectedIO.from.type === 'input' ? States.selectedIO.from : States.selectedIO.to;
    for (const edge of States.edges) {
      if (inputIO.id === edge.from.id || inputIO.id === edge.to.id) return;
    }

    if (States.selectedIO.from.type === 'output') {
      (States.selectedIO.from as Output).addConnect(States.selectedIO.to);
      States.selectedIO.to.update(States.selectedIO.from.value);
    } else {
      (States.selectedIO.to as Output).addConnect(States.selectedIO.from);
      States.selectedIO.from.update(States.selectedIO.to.value);
    }

    const edge = new Edge(States.selectedIO.from, States.selectedIO.to);
    States.edges.push(edge);
    const svg = edge.render();

    if (States.canvas !== null) {
      States.canvas.appendChild(svg);
    }
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    States.zoom = Math.min(Math.max(States.zoom * factor, 0.1), 3.0);
    if (States.canvas) {
      States.canvas.style.transform = `scale(${States.zoom})`;
    }
  }

  private removeEdge(edge: Edge) {
    const outputIO = edge.from.type === 'output' ? edge.from as Output : edge.to as Output;
    const inputIO = edge.from.type === 'input' ? edge.from : edge.to;
    outputIO.removeConnect(inputIO);
    inputIO.update(null);
    edge.remove();
    States.edges = States.edges.filter(v => v !== edge);
  }

  serialize(): SerializedGraph {
    return {
      nodes: States.nodes.map(node => ({
        id: node.id,
        type: node.type,
        left: node.left,
        top: node.top,
        props: {
          label: node.props.label,
          ios: node.props.ios.map(io => ({
            type: io.io.type,
            value: io.value,
            label: io.label,
          })),
        },
      })),
      edges: States.edges.flatMap(edge => {
        const fromNode = States.nodes.find(n => n.id === edge.from.nodeId);
        const toNode = States.nodes.find(n => n.id === edge.to.nodeId);
        if (!fromNode || !toNode) return [];
        const fromIoIndex = fromNode.props.ios.findIndex(io => io.io.id === edge.from.id);
        const toIoIndex = toNode.props.ios.findIndex(io => io.io.id === edge.to.id);
        if (fromIoIndex === -1 || toIoIndex === -1) return [];
        return [{ fromNodeId: fromNode.id, fromIoIndex, toNodeId: toNode.id, toIoIndex }];
      }),
    };
  }

  deserialize(graph: SerializedGraph, factory: (type: string) => Node) {
    for (const node of States.nodes) node.remove();
    for (const edge of States.edges) edge.remove();
    States.nodes = [];
    States.edges = [];
    States.selectedNode = null;
    States.selectedEdge = null;
    States.holdingNode = null;
    States.editingNode = null;
    this.panel.reset();

    const nodeMap = new Map<string, Node>();

    for (const nodeData of graph.nodes) {
      const node = factory(nodeData.type);
      node.left = nodeData.left;
      node.top = nodeData.top;
      this.addNode(node);

      const restoredProps: NodeProps = {
        label: nodeData.props.label,
        ios: node.props.ios.map((ioProp, i) => ({
          io: ioProp.io,
          value: nodeData.props.ios[i]?.value ?? ioProp.value,
          label: nodeData.props.ios[i]?.label ?? ioProp.label,
        })),
      };
      node.update(restoredProps);
      nodeMap.set(nodeData.id, node);
    }

    for (const edgeData of graph.edges) {
      const fromNode = nodeMap.get(edgeData.fromNodeId);
      const toNode = nodeMap.get(edgeData.toNodeId);
      if (!fromNode || !toNode) continue;

      const fromIO = fromNode.props.ios[edgeData.fromIoIndex]?.io;
      const toIO = toNode.props.ios[edgeData.toIoIndex]?.io;
      if (!fromIO || !toIO) continue;

      if (fromIO.type === 'output') {
        (fromIO as Output).addConnect(toIO);
        toIO.update(fromIO.value);
      } else {
        (toIO as Output).addConnect(fromIO);
        fromIO.update(toIO.value);
      }

      const edge = new Edge(fromIO, toIO);
      States.edges.push(edge);
      if (States.canvas !== null) {
        States.canvas.appendChild(edge.render());
      }
    }
  }
  
  private move(dx: number, dy: number) {
    // Moving all nodes
    for (const node of States.nodes) {
      node.move(dx, dy);
    }
    
    // Moving all edges
    for (const edge of States.edges) {
      edge.move();
    }
  }

  private onSelectedNode(node: Node) {
    States.container?.appendChild(this.panel.setNode(node));
  }

  private updateProps(props: NodeProps | null) {
    if (States.editingNode === null || props === null) return;
    States.editingNode.update(props);
  }

}
