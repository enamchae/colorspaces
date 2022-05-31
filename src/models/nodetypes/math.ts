import {Node, Socket, SocketType as St, NodeEvalContext} from "../Node";
import * as cm from "../colormanagement";

import {Color, Vec2, Vec3, lerp} from "@/util";

export namespace math {
	export class LerpNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "RGB blend";

		private readonly methodSocket: Socket<St.Dropdown>;
		private readonly facSocket: Socket<St.Float>;
		private readonly colorSockets: Socket<St.RgbRawOrColTransformed>[];

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				(this.methodSocket = new Socket(this, true, Socket.Type.Dropdown, "", false, {
					options: [
						{value: "mix", text: "Mix"},
						{value: "add", text: "Add"},
						{value: "multiply", text: "Multiply"},
					],
					defaultValue: "mix",
				})),
				(this.facSocket = new Socket(this, true, Socket.Type.Float, "Blend amount")),
				...(this.colorSockets = [
					new Socket(this, true, Socket.Type.RgbRawOrColTransformed, "RGB or color"),
					new Socket(this, true, Socket.Type.RgbRawOrColTransformed, "RGB or color"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.RgbRaw, "RGB"),
			);
		}

		output(context: NodeEvalContext): Color {
			const fac = this.facSocket.inValue(context);

			// TODO check that inputs are of same type
			const col0 = this.colorSockets[0].inValue(context);
			const col1 = this.colorSockets[1].inValue(context);

			// and make output the same type as the inputs

			switch (this.methodSocket.inValue(context)) {
				case "mix":
					return col0.map((_, i) => lerp(col0[i], col1[i], fac)) as Color;

				case "add":
					return col0.map((_, i) => col0[i] + col1[i] * fac) as Color;

				case "multiply":
					return col0.map((_, i) => col0[i] * ((1 - fac) + col1[i] * fac)) as Color;
					
				default:
					throw new TypeError("Unknown blend mode");
			}

		}
	}

	export class GetComponentsNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Explode";

		private readonly inSocket: Socket<St.RgbRawOrColTransformed>;

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				(this.inSocket = new Socket(this, true, Socket.Type.RgbRawOrColTransformed, "Color or vector")),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.Float, "1"),
				new Socket(this, false, Socket.Type.Float, "2"),
				new Socket(this, false, Socket.Type.Float, "3"),
			);
		}

		output(context: NodeEvalContext): number {
			const value = this.inSocket.inValue(context);
			return value[this.outs.indexOf(context.socket!)];
		}

		// output(context: NodeEvalContext): Color {
		// 	return this.ins.map(socket => socket.inValue(context)) as Color;
		// }
	}

	export class DeltaE1976Node extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Color difference (ΔE* 1976)";

		private readonly colorSockets: Socket<St.RgbRawOrColTransformed>[];

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				...(this.colorSockets = [
					new Socket(this, true, Socket.Type.RgbRawOrColTransformed, "L*a*b* or color"),
					new Socket(this, true, Socket.Type.RgbRawOrColTransformed, "L*a*b* or color"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.Float, "Difference"),
			);
		}

		output(context: NodeEvalContext): number {
			// TODO check that inputs are of same type
			const col0 = this.colorSockets[0].inValue(context);
			const col1 = this.colorSockets[1].inValue(context);

			return cm.difference.deltaE1976(col0, col1);
		}
	}
}