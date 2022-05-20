import {Node, Socket, SocketType} from "./Node";
import {Color, Vec2, Vec3} from "../util";
import * as cm from "./colormanagement";
import { e } from "mathjs";

export namespace images {
	export class GradientNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Value range";

		constructor(pos?: Vec2) {
			super(pos);
		}
	}
}

export namespace rgbModels {
	//TODO code duplication
	export class RgbNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "RGB";

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Float, "Red"),
				new Socket(this, true, Socket.Type.Float, "Green"),
				new Socket(this, true, Socket.Type.Float, "Blue"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.RgbRaw, "RGB data"),
			);
		}

		output(): Color {
			return this.ins.map(socket => socket.inValue) as Color;
		}
	}

	export class HslNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "HSL";

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Float, "Hue"),
				new Socket(this, true, Socket.Type.Float, "Saturation"),
				new Socket(this, true, Socket.Type.Float, "Lightness"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.RgbRaw, "RGB data"),
			);
		}

		output(): Color {
			return cm.hslToRgb(this.ins.map(socket => socket.inValue) as Color) as Color;
		}
	}

	export class HsvNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "HSV";

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Float, "Hue"),
				new Socket(this, true, Socket.Type.Float, "Saturation"),
				new Socket(this, true, Socket.Type.Float, "Value"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.RgbRaw, "RGB data"),
			);
		}

		output(): Color {
			return cm.hsvToRgb(this.ins.map(socket => socket.inValue) as Color) as Color;
		}
	}

	export class CmyNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "CMY";

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Float, "Cyan"),
				new Socket(this, true, Socket.Type.Float, "Magenta"),
				new Socket(this, true, Socket.Type.Float, "Yellow"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.RgbRaw, "RGB data"),
			);
		}

		output(): Color {
			return cm.cmyToRgb(this.ins.map(socket => socket.inValue) as Color) as Color;
		}
	}
}

export namespace math {
	export class LerpNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "RGB blend";

		private readonly methodSocket: Socket<SocketType.Dropdown>;
		private readonly facSocket: Socket<SocketType.Float>;
		private readonly colorSockets: Socket<SocketType.RgbRaw>[];

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
					new Socket(this, true, Socket.Type.RgbRaw, "RGB"),
					new Socket(this, true, Socket.Type.RgbRaw, "RGB"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.RgbRaw, "RGB"),
			);
		}

		output(): Color {
			const fac = this.facSocket.inValue;

			const col0 = this.colorSockets[0].inValue;
			const col1 = this.colorSockets[1].inValue;

			switch (this.methodSocket.inValue) {
				case "mix":
					return col0.map((_, i) => col0[i] * (1 - fac) + col1[i] * fac) as Color;

				case "add":
					return col0.map((_, i) => col0[i] + col1[i] * fac) as Color;

				case "multiply":
					return col0.map((_, i) => col0[i] * ((1 - fac) + col1[i] * fac)) as Color;
					
				default:
					throw new TypeError("Unknown blend mode");
			}

		}
	}
}

export namespace spaces {
	export class LinearNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Linear sRGB";

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.RgbRaw, "RGB"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.ColTransformed, "Color"),
			);
		}

		output() {
			return new cm.LinearSrgb(this.ins[0].inValue as any as Vec3);
		}
	}

	export class SrgbNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "sRGB";

		readonly inSocket: Socket<SocketType.RgbRaw>;

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				(this.inSocket = new Socket(this, true, Socket.Type.RgbRaw, "RGB")),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.ColTransformed, "Color"),
			);
		}

		output() {
			return new cm.Srgb(this.inSocket.inValue);
		}
	}

	const whitePointSocketOptions = {
		options: [
			{value: "2deg/A", text: "CIE 2° / A"},
			{value: "2deg/B", text: "CIE 2° / B"},
			{value: "2deg/C", text: "CIE 2° / C"},
			{value: "2deg/D50", text: "CIE 2° / D50"},
			{value: "2deg/D55", text: "CIE 2° / D55"},
			{value: "2deg/D60", text: "CIE 2° / D60"},
			{value: "2deg/D65", text: "CIE 2° / D65"},
			{value: "2deg/D75", text: "CIE 2° / D75"},
			{value: "2deg/E", text: "CIE 2° / E"},
			{value: "10deg/A", text: "CIE 10° / A"},
			{value: "10deg/B", text: "CIE 10° / B"},
			{value: "10deg/C", text: "CIE 10° / C"},
			{value: "10deg/D50", text: "CIE 10° / D50"},
			{value: "10deg/D55", text: "CIE 10° / D55"},
			{value: "10deg/D60", text: "CIE 10° / D60"},
			{value: "10deg/D65", text: "CIE 10° / D65"},
			{value: "10deg/D75", text: "CIE 10° / D75"},
			{value: "10deg/E", text: "CIE 10° / E"},
		],
		defaultValue: "2deg/D65",
	};
	const getIlluminant = (socket: Socket<SocketType.Dropdown>) => {
		const illuminantId = socket.inValue;
		let illuminant: Vec2;
		if (illuminantId !== "custom") {
			const [standard, illuminantName] = illuminantId.split("/"); 
			return cm.illuminantsXy[standard][illuminantName];
		} else {
			throw new Error("not implemented");
		}
	};

	export class XyzNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "XYZ";

		private readonly whitePointSocket: Socket<SocketType.Dropdown>;
		private readonly primariesSockets: Socket<SocketType.Float>[];

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				(this.whitePointSocket = new Socket(this, true, Socket.Type.Dropdown, "White point", false, whitePointSocketOptions)),
				...(this.primariesSockets = [
					new Socket(this, true, Socket.Type.Float, "X"),
					new Socket(this, true, Socket.Type.Float, "Y"),
					new Socket(this, true, Socket.Type.Float, "Z"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.ColTransformed, "Color"),
			);
		}

		output() {
			const illuminant = getIlluminant(this.whitePointSocket);

			return cm.linearToSrgb(
				cm.xyzToLinear(
					this.primariesSockets.map(socket => socket.inValue) as cm.Xyz,
					illuminant,
				),
			);
		}
	}

	export class XyyNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "xyY";

		private readonly whitePointSocket: Socket<SocketType.Dropdown>;
		private readonly primariesSockets: Socket[];

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				(this.whitePointSocket = new Socket(this, true, Socket.Type.Dropdown, "White point", false, whitePointSocketOptions)),
				...(this.primariesSockets = [
					new Socket(this, true, Socket.Type.Float, "x (chromaticity 1)"),
					new Socket(this, true, Socket.Type.Float, "y (chromaticity 2)"),
					new Socket(this, true, Socket.Type.Float, "Y (luminance)"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.ColTransformed, "Color"),
			);
		}

		output() {
			const illuminant = getIlluminant(this.whitePointSocket);

			return cm.linearToSrgb(
				cm.xyzToLinear(
					cm.xyyToXyz(this.primariesSockets.map(socket => socket.inValue) as cm.Xyy),
					illuminant,
				),
			);
		}
	}

	export class LabNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "L*a*b*";

		private readonly whitePointSocket: Socket<SocketType.Dropdown>;
		private readonly primariesSockets: Socket<SocketType.Float>[];

		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				(this.whitePointSocket = new Socket(this, true, Socket.Type.Dropdown, "White point", false, whitePointSocketOptions)),
				...(this.primariesSockets = [
					new Socket(this, true, Socket.Type.Float, "L*"),
					new Socket(this, true, Socket.Type.Float, "a*"),
					new Socket(this, true, Socket.Type.Float, "b*"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.ColTransformed, "Color"),
			);
		}

		output(): cm.Lab {
			const illuminant = getIlluminant(this.whitePointSocket);

			return new cm.Lab(this.primariesSockets.map(socket => socket.inValue) as Vec3, illuminant);
			
			cm.linearToSrgb(
				cm.xyzToLinear(
					cm.labToXyz(
						this.primariesSockets.map(socket => socket.inValue) as Color,
						cm.xyyToXyz(illuminant),
					),
					illuminant,
				),
			);
		}
	}
}

export namespace externals {
	export class DeviceTransformNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Device buffer";

		readonly colorSockets: Socket<SocketType.ColTransformed>[];
		
		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Dropdown, "Device color space", false, {
					options: [
						{value: "srgb", text: "sRGB"},
					],
					defaultValue: "srgb",
				}),
				...(this.colorSockets = [
					new Socket(this, true, Socket.Type.ColTransformed, "Color"),
				]),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.Unknown, "Color data"),
			);
		}

		output(): cm.Srgb[] {
			return this.colorSockets.filter(socket => socket.links[0])
					.map(socket => socket.links[0].srcNode.output().toSrgb());
		}

		onSocketLink(socket: Socket) {
			if (!socket.isInput) return;

			const newSocket = new Socket(this, true, Socket.Type.ColTransformed, "Color");

			this.ins.push(newSocket);
			this.colorSockets.push(newSocket);
		}

		onSocketUnlink(socket: Socket): void {
			if (!socket.isInput) return;

			this.ins.splice(this.ins.indexOf(socket), 1);
			this.colorSockets.splice(this.colorSockets.indexOf(socket), 1);
		}
	}

	export class DevicePostprocessingNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Device postprocessing";
		
		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Unknown, "Color data"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.Unknown, "Screen image"),
			);
		}
	}

	export class EnvironmentNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Environmental conditions";
		
		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Unknown, "Radiation"),
			);

			this.outs.push(
				new Socket(this, false, Socket.Type.Unknown, "Radiation"),
			);
		}
	}

	export class VisionNode extends Node {
		static readonly TYPE = Symbol(this.name);
		static readonly LABEL = "Human vision";
		
		constructor(pos?: Vec2) {
			super(pos);

			this.ins.push(
				new Socket(this, true, Socket.Type.Unknown, "Light"),
			);
		}
	}
}