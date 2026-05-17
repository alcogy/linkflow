import { Input, Output } from './io';
import Node from './node';

export class NodeTextBox extends Node {
  constructor() {
    super();
    this.type = 'NodeTextBox';
    this.props = {
      label: 'Textbox',
      ios: [
        { io: new Output(this.id), value: 'Hello Linkflow!', label: 'output' },
      ],
    };
  }
}

export class NodeDisplay extends Node {
  constructor() {
    super();
    this.type = 'NodeDisplay';
    this.props = {
      label: 'Display',
      ios: [
        { io: new Input(this.id, (e) => this.noticeHandler(e)), value: '', label: 'Display' },
      ],
    };
  }

  private noticeHandler(e: Input) {
    this.props.ios[0].label = e.value;
    this.props.ios[0].value = e.value;
    this.props.ios[0].io.updateLabel(e.value);
  }
}


export class NodeNumberBox extends Node {
  constructor() {
    super();
    this.type = 'NodeNumberBox';
    this.props = {
      label: 'Number',
      ios: [
        { io: new Output(this.id), value: 0, label: 'output' },
      ],
    };
  }
}


export class NodeCondition extends Node {
  constructor() {
    super();
    this.type = 'NodeCondition';
    this.props = {
      label: 'Condition',
      ios: [
        { io: new Input(this.id, (e) => this.noticeHandler(e)), value: '', label: 'input1' },
        { io: new Input(this.id, (e) => this.noticeHandler(e)), value: '', label: 'input2' },
        { io: new Output(this.id), value: 'True', label: 'true' },
        { io: new Output(this.id), value: 'False', label: 'false' },
      ],
    };
  }
 
  private noticeHandler(e: Input) {
    // Update own props.
    const ioProps = e.id === this.props.ios[0].io.id ? this.props.ios[0] : this.props.ios[1];
    ioProps.label = e.label;
    ioProps.value = e.value;
    
    // update output values.
    if (this.props.ios[0].value === this.props.ios[1].value) {
      this.props.ios[2].io.update(this.props.ios[2].value);
      this.props.ios[3].io.update('--');
    } else {
      this.props.ios[2].io.update('--');
      this.props.ios[3].io.update(this.props.ios[3].value);
    }
  }
}

export class NodeCalc extends Node {
  constructor() {
    super();
    this.type = 'NodeCalc';
    this.props = {
      label: 'Calculation',
      ios: [
        { io: new Input(this.id, (e) => this.calcuration(e)), value: 0, label: 'input1' },
        { io: new Input(this.id, (e) => this.calcuration(e)), value: 0, label: 'input2' },
        { io: new Output(this.id), value: 0, label: 'Result' },
      ],
    };
  }
   
  private calcuration(e: Input) {
    // Update own props.
    const ioProps = e.id === this.props.ios[0].io.id ? this.props.ios[0] : this.props.ios[1];
    ioProps.label = e.label;
    ioProps.value = Number(e.value);

    this.props.ios[2].io?.update(this.props.ios[0].value + this.props.ios[1].value);
  }
}