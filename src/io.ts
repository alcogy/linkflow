import { makeId, States, IOType } from './utils';
import { Connecting } from './edge';

export class IO {
  id: string;
  nodeId: string;
  type: IOType;
  label: string;
  labelElement: HTMLElement | null;
  value: any;
  gate: HTMLButtonElement | null;  
  element: HTMLElement | null;
  
  constructor(nodeId: string, value: any, label: string, type: IOType) {
    this.id = makeId();
    this.nodeId = nodeId;
    this.type = type;
    this.label = label;
    this.labelElement = null;
    this.value = value;
    this.gate = null;
    this.element = null;
  }

  render(): HTMLDivElement {
    // io wrap
    const io = document.createElement('div');
    io.classList.add('io');
  
    // Gate
    const circle = document.createElement('button');
    circle.classList.add('circle');
    circle.id = this.id;
    circle.dataset.parentId = this.nodeId;
    circle.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDownCircle(e, circle));
    circle.addEventListener('mouseenter', (e: MouseEvent) => this.onMouseEnterCircle(e));
    circle.addEventListener('mouseleave', this.onMouseLeaveCircle);
    this.gate = circle;

    if (this.type === 'input') {
      io.appendChild(circle);
    }

    const label = document.createElement('p');
    label.classList.add('io-label');
    if (this.type === 'output') {
      label.classList.add('right');
    }
    label.innerText = this.label;
    this.labelElement = label;
    io.appendChild(label);

    if (this.type === 'output') {
      io.appendChild(circle);
    }

    this.element = io;

    return io;
  }

  update(v: any) {
    this.value = v;
  }

  updateLabel(v: string) {
    this.label = v;
    if (this.labelElement !== null) {
      (this.labelElement as HTMLElement).innerText = this.label;
    }
  }

  private onMouseDownCircle(e: MouseEvent, gate: HTMLElement) {
    e.stopPropagation();
    
    const rect = gate.getBoundingClientRect();
    const start = {
      top: (rect.top - States.offset.top + window.scrollY + rect.height / 2) / States.zoom,
      left: (rect.left - States.offset.left + window.scrollX - rect.width / 2) / States.zoom,
    }
    States.connecting = new Connecting(this, start);
    States.selectedIO.from = this;
    States.mouse.x = e.clientX;
    States.mouse.y = e.clientY;
  }

  private onMouseEnterCircle(e: MouseEvent) {
    States.selectedIO.to = this;
  }
  
  private onMouseLeaveCircle(e: MouseEvent) {
    States.selectedIO.to = null
  }

}

export class Input extends IO {
  notice?: (v: Input) => any;

  constructor(nodeId: string, notice: (v: any) => any) {
    super(nodeId, '', 'input', 'input');
    this.notice = notice;
  }

  update(v: any) {
    super.update(v);
    this.notice && this.notice(this);
  }
}

export class Output extends IO {
  connectTo: IO[];

  constructor(nodeId: string) {
    super(nodeId, '', 'output', 'output');
    this.connectTo = [];
  }

  addConnect(io: IO) {
    if (!this.connectTo.includes(io)) {
      this.connectTo.push(io);
    }
  }

  removeConnect(io: IO) {
    this.connectTo = this.connectTo.filter(c => c !== io);
  }

  update(v: any) {
    super.update(v);
    for (const io of this.connectTo) {
      io.update(this.value);
    }
    if (this.connectTo.length > 0) {
      for (const edge of States.edges) {
        edge.move();
      }
    }
  }
}

