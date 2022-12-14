import {Tree, Node, Socket, SocketType as St, Link, NodeEvalContext} from "../Node";

import {Vec2} from "@/util";

export namespace organization {
	export class RerouteNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Reroute";
		
		constructor() {
			super();

			this.ins.push(
				new Socket(this, true, Socket.Type.Any, ""),
			);

			this.width = 30;
		}

		output(context: NodeEvalContext) {
			return this.ins[0].inValue(context);
		}

		onSocketLink(socket: Socket, link: Link, tree: Tree) {
			super.onSocketLink(socket, link, tree);

			if (socket.isOutput) return;
			const type = link.src.type;
			this.ins[0].type = type;

			this.outs.push(new Socket(this, false, type, ""));
		}

		onSocketUnlink(socket: Socket, link: Link, tree: Tree) {
			super.onSocketUnlink(socket, link, tree);

			if (socket.isOutput) return;

			this.outs[0].links.forEach(link => tree.unlink(link));
			this.outs.pop();
			this.ins[0].type = St.Any;
		}
	}
}