import { makeId, Position, States } from './utils';
import { IO } from './io';

export default class Edge {
  id: string;
  from: IO;
  to: IO;
  path: SVGPathElement | null = null;
  hitPath: SVGPathElement | null = null;
  element: SVGElement | null = null;

  constructor(from: IO, to: IO) {
    this.id = makeId();
    this.from = from;
    this.to = to;
  }

  render() {
    const d = this.calcWirePath();

    const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke-width', '12');
    hitPath.setAttribute('d', d);
    hitPath.style.cursor = 'pointer';
    hitPath.addEventListener('click', (e) => {
      e.stopPropagation();
      this.select();
    });
    this.hitPath = hitPath;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = this.id;
    path.setAttribute('stroke', 'gray');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', d);
    this.path = path;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.appendChild(hitPath);
    svg.appendChild(path);
    this.element = svg;

    return svg;
  }

  move() {
    if (this.path === null) return;
    const d = this.calcWirePath();
    this.path.setAttribute('d', d);
    this.hitPath?.setAttribute('d', d);
  }

  remove() {
    if (this.element === null) return;
    this.element.remove();
  }

  select() {
    States.selectedEdge?.deselect();
    States.selectedEdge = this;
    this.path?.setAttribute('stroke', '#ff6b6b');
  }

  deselect() {
    this.path?.setAttribute('stroke', 'gray');
  }

  includeNode(nodeId: string): boolean {
    return nodeId === this.from.nodeId || nodeId === this.to.nodeId;
  }

  private calcWirePath(): string {
    const [start, end] = this.getPoints();
    const center = {
      left: (end.left + start.left) / 2,
      top: (end.top + start.top) / 2,
    }
    return `M ${start.left} ${start.top} Q ${(center.left + start.left) / 2} ${start.top}, ${center.left} ${center.top} T ${end.left} ${end.top}`;
  }

  private getPoints(): [Position, Position] {
    if (this.from.gate === null || this.to.gate === null) {
      return [{left: 0, top: 0}, {left: 0, top: 0}];
    }
    
    const fromRect = this.from.gate.getBoundingClientRect();
    const start = {
      top: (fromRect.top - States.offset.top + window.scrollY + fromRect.height / 2) / States.zoom,
      left: (fromRect.left - States.offset.left + window.scrollX) / States.zoom,
    }
    const endRect = this.to.gate.getBoundingClientRect();
    const end = {
      top: (endRect.top - States.offset.top + window.scrollY + endRect.height / 2) / States.zoom,
      left: (endRect.left - States.offset.left + window.scrollX) / States.zoom,
    }
    return [start, end];
  }
}

export class Connecting {
  io: IO;
  from: Position;
  path: SVGPathElement;

  constructor(io: IO, from: Position) {
    this.io = io;
    this.from = from;
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.id = 'drawing-path';
    path.setAttribute('stroke', 'lightgray');
    path.setAttribute('fill', 'transparent');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '2');
    this.path = path;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = 'drawing';
    svg.appendChild(path);

    if (States.canvas !== null) {
      States.canvas.appendChild(svg);
    }
  }

  move(x: number, y: number) {
    const end = {
      top: (y - States.offset.top + window.scrollY) / States.zoom,
      left: (x - States.offset.left + window.scrollX) / States.zoom,
    }
    const path = this.calcWirePath(this.from, end);
    this.path.setAttribute('d', path);
  }

  private calcWirePath(start: Position, end: Position): string {
    const center = {
      left: (end.left + start.left) / 2,
      top: (end.top + start.top) / 2,
    }
    return `M ${start.left} ${start.top} Q ${(center.left + start.left) / 2} ${start.top}, ${center.left} ${center.top} T ${end.left} ${end.top}`;
  }

}