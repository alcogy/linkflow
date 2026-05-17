import { makeId, States, NodeProps } from './utils';
import { Output } from './io';

export default class Node {
  id: string;
  type: string = 'Node';
  left: number;
  top: number;
  element: HTMLElement | null = null;
  props: NodeProps;
  onSelected?: (node: Node) => void;

  constructor() {
    this.id = makeId();
    this.left = 30;
    this.top = 30;
    
    // ...override your props for io.
    this.props = {
      label: 'node',
      ios: [
        { io: new Output(this.id), value: 'value', label: 'output' },
      ],
    };
  }

  // abstruct for update node params.
  update(props: NodeProps) {
    this.props = props;
    // Label
    const title = this.element?.querySelector('.node-title') as HTMLElement;
    if (title !== null) {
      title.innerText = this.props.label;
    }

    for (const prop of this.props.ios) {
      prop.io.updateLabel(prop.label);
      if (prop.io.type === 'output') {
        prop.io.update(prop.value);
      }
    }
  }

  bindOnSelected(fn: (node: Node) => void) {
    this.onSelected = fn;
  }

  move(difX: number, difY: number) {
    this.left += difX;
    this.top += difY;
    if (this.element === null) return;
    this.element.style.left = this.left + 'px';
    this.element.style.top = this.top + 'px';
  }

  remove() {
    if (this.element === null) return;
    this.element.remove();
    this.element = null;
  }
  
  render() {
    // Node wrap
    const node = this.makeNodeBase();
    const nodeIOs = this.makeNodeIOConainer();
    
    const ios = this.makeIOs();
    for (const io of ios) {
      nodeIOs.appendChild(io);
    }
    node.appendChild(nodeIOs);

    this.element = node;
    return node;
  }

  private makeIOs(): HTMLElement[] {
    const render: HTMLElement[] = [];

    for (const io of this.props.ios) {
      io.io.label = io.label;
      if (io.io.type === 'output') {
        io.io.value = io.value;
      }
      render.push(io.io.render());
    }
    // return must array for up to down.
    return render;
  }


  private makeNodeBase() {
    // node base.
    const node = document.createElement('div');
    node.id = this.id;
    node.classList.add('node');
    node.tabIndex = 1;
    node.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e));
    node.addEventListener('focus', (e: FocusEvent) => this.onFocus(e));
    node.addEventListener('blur', (e: FocusEvent) => this.onBlur(e));

    // Title
    const title = document.createElement('h3');
    title.classList.add('node-title');
    title.innerText = this.props.label;

    // Header
    const header = document.createElement('div');
    header.classList.add('node-header');
    
    // Append elements.
    header.appendChild(title);
    node.appendChild(header);

    return node;
  }

  private makeNodeIOConainer() {
    const nodeIOs = document.createElement('div');
    nodeIOs.classList.add('node-ios');
    return nodeIOs;
  }

  private onMouseDown(e: MouseEvent) {
    e.stopPropagation();
    States.holdingNode = this;
    States.mouse.x = e.clientX;
    States.mouse.y = e.clientY;
  }

  private onFocus(e: FocusEvent) {
    States.selectedNode = this;
    const selected = document.querySelectorAll('div.node.selected');
    for (const sel of selected) {
      sel.classList.remove('selected');
    }
    const editing = document.querySelector('div.node.editing');
    editing?.classList.remove('editing');
    
    if (this.element === null) return;
    this.element.classList.add('selected');
    this.onSelected && this.onSelected(this);
  }

  private onBlur(e: FocusEvent) {
    States.selectedNode = null;
    this.element?.classList.remove('selected');
  }

}
