import { WebglVariables } from "$/webgl-compute/WebglVariables";
import { InSocket, Node, NodeDisplay, NodeEvalContext, OutSocket, SocketType, WebglOutputs } from ".";
import { NO_DESC, StringKey } from "$/strings";

/** A collection of input/output sockets, as well as a function to compute outputs from the inputs' values */
export class Overload<NodeType extends Node=any, InSockets extends InSocket[]=any, OutSockets extends OutSocket[]=any> {
  constructor(
    readonly label: StringKey,
    readonly buildInSockets: (node: NodeType) => [...InSockets],
    readonly buildOutSockets: (node: NodeType, ins: InSockets) => [...OutSockets],
    readonly nodeDisplay: (ins: InSockets, outs: OutSockets, context: NodeEvalContext, node: NodeType) => NodeDisplay=() => { throw new Error("not implemented") },
    readonly webglBaseVariables: (ins: InSockets, outs: OutSockets, context: NodeEvalContext, node: NodeType) => WebglVariables=() => { throw new Error("not implemented"); },
    readonly webglOutputs: () => WebglOutputs=() => ({}),
    private readonly maintainExistingLinks = false,
  ) {}
}

/** Descriptor of a set of overloads, usually to store those specific to a certain subclass of Node */
export class OverloadGroup<Mode extends string, NodeType extends Node=any> {
  constructor(
    private readonly modes: Map<Mode, Overload<NodeType>>,
  ) {}

  buildDropdown(node: NodeType, defaultMode: Mode, overloadManager: OverloadManager<Mode>) {
    return new InSocket(node, SocketType.Dropdown, NO_DESC, {
      showSocket: false,
      options: [...this.modes].map(([mode, overload]) => (
        {value: mode, text: overload.label}
      )),
      defaultValue: defaultMode,
      onValueChange: () => overloadManager.handleModeChange(),
    });
  }

  getOverload(mode: Mode) {
    return this.modes.get(mode)!;
  }
}

/** Stores the currently selected overload of a Node instance, as well as obtains the current output evaluation
 * function when needed and updates the sockets when the selected overload changes
 */
export class OverloadManager<OverloadMode extends string> {
  readonly dropdown: InSocket<SocketType.Dropdown>;
  private ins: InSocket[];
  private outs: OutSocket[];

  constructor(
    private readonly node: Node,
    defaultMode: OverloadMode,
    private readonly overloadGroup: OverloadGroup<OverloadMode>,
  ) {
    this.dropdown = overloadGroup.buildDropdown(node, defaultMode, this);

    const overload = overloadGroup.getOverload(defaultMode);
    this.ins = overload.buildInSockets(node);
    this.outs = overload.buildOutSockets(node, this.ins);
  }

  setSockets() {
    this.node.ins.push(this.dropdown);
    this.node.ins.push(...this.ins);
    this.node.outs.push(...this.outs);
  }

  nodeDisplay(context: NodeEvalContext) {
    return this.overload.nodeDisplay(this.ins, this.outs, context, this.node);
  }

  webglBaseVariables(context: NodeEvalContext) {
    return this.overload.webglBaseVariables(this.ins, this.outs, context, this.node);
  }

  webglOutputs() {
    return this.overload.webglOutputs();
  }

  handleModeChange() {
    /* 
    const deleteSocketsUntilLength = (targetLength: number) => {
      while (this.valueSockets.length > targetLength) {
        this.ins.pop();
        const oldSocket = this.valueSockets.pop();
        oldSocket?.links.forEach(link => tree.unlink(link));
      }
    };
    */

    const nIns = this.ins.length;
    const nOuts = this.outs.length;
    for (let i = 0; i < nIns; i++) {
      const oldSocket = this.node.ins.pop();
      oldSocket?.unlinkAllLinks();
    }

    for (let i = 0; i < nOuts; i++) {
      const oldSocket = this.node.outs.pop();
      oldSocket?.unlinkAllLinks();
    }

    this.ins = this.overload.buildInSockets(this.node);
    this.outs = this.overload.buildOutSockets(this.node, this.ins);
    this.node.ins.push(...this.ins);
    this.node.outs.push(...this.outs);
  }

  get mode() {
    return this.dropdown.inValue() as OverloadMode;
  }

  get overload() {
    return this.overloadGroup.getOverload(this.mode);
  }
}

export abstract class NodeWithOverloads<OverloadMode extends string> extends Node {
  static readonly overloadGroup: OverloadGroup<any>;

  readonly overloadManager: OverloadManager<OverloadMode>;

  constructor(defaultMode: OverloadMode) {
    super();
    this.overloadManager = new OverloadManager(this, defaultMode, new.target.overloadGroup);
    this.overloadManager.setSockets();
  }

  display(context: NodeEvalContext): NodeDisplay {
    return this.overloadManager.nodeDisplay(context);
  }

  webglBaseVariables(context: NodeEvalContext={}) {
    return this.overloadManager.webglBaseVariables(context);
  }

  webglOutputs() {
    return this.overloadManager.webglOutputs();
  }
}