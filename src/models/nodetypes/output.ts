import {Tree, Node, Socket, SocketType as St, Link, NodeEvalContext, OutputDisplayType, SocketFlag, NodeWithOverloads, InSocket} from "../Node";
import { Overload, OverloadGroup } from "../Overload";
import * as cm from "../colormanagement";

import {Color, Vec2, Vec3, pipe} from "@/util";


export enum ChromaticityPlotMode {
    Xy = "from xy",
    Color = "from color",
}
export namespace output {
    enum CssOutputMode {
        RgbVector = "rgbVector",
        Color = "color",
    }
    export class CssOutputNode extends NodeWithOverloads<CssOutputMode> {
        static readonly TYPE = Symbol(this.name);
        static readonly LABEL = "CSS output";
        static readonly DESC = "desc.node.cssOutput";
        static readonly outputDisplayType = OutputDisplayType.Css;

        static readonly overloadGroup = new OverloadGroup(new Map<CssOutputMode, Overload<void>>([
            [CssOutputMode.RgbVector, new Overload(
                "RGB vector",
				node => [
                    new InSocket(node, Socket.Type.Vector, "RGB").flag(SocketFlag.Rgb),
                ],
				node => [],
				(ins, outs, context) => ins[0].inValue(context),
            )],
            [CssOutputMode.Color, new Overload(
                "Color",
				node => [
                    new InSocket(node, Socket.Type.ColorCoords, "Color"),
                ],
				node => [],
				(ins, outs, context) => ins[0].inValue(context),
            )],
        ]));

        constructor() {
            super(CssOutputMode.RgbVector);
            this.width = 275;
        }
    }
    export class ChromaticityPlotNode extends NodeWithOverloads<ChromaticityPlotMode> {
        static readonly TYPE = Symbol(this.name);
        static readonly LABEL = "Chromaticity plot";
        static readonly DESC = "desc.node.chromaticity";

        static readonly overloadGroup = new OverloadGroup(new Map<ChromaticityPlotMode, Overload<void>>([
            [ChromaticityPlotMode.Xy, new Overload(
                "From xy",
                node => [
                    new InSocket(node, Socket.Type.Float, "x", true, {
                        defaultValue: cm.illuminantsXy["2deg"]["D65"][0],
                    }),
                    new InSocket(node, Socket.Type.Float, "y", true, {
                        defaultValue: cm.illuminantsXy["2deg"]["D65"][1],
                    }),
                ],
                node => [],
                () => {},
            )],

            [ChromaticityPlotMode.Color, new Overload(
                "From colors",
                node => [
                    new InSocket(node, Socket.Type.ColorCoords, "Colors"),
                ],
                node => [],
                () => {},
            )],
        ]));

        constructor() {
            super(ChromaticityPlotMode.Xy);
        }
    }
}