import { WebglSlot, WebglTemplate, WebglVariables } from "@/webgl-compute/WebglVariables";
import { Node, SocketType, NodeEvalContext, OutputDisplayType, SocketFlag, InSocket, webglOuts } from "../Node";
import { Overload, OverloadGroup, NodeWithOverloads } from "../Overload";
import * as cm from "../colormanagement";


export enum ChromaticityPlotMode {
  Color = "from color",
  Xy = "from xy",
}
export namespace output {
  enum CssOutputMode {
    RgbVector = "rgbVector",
    Color = "color",
  }
  export class CssOutputNode extends NodeWithOverloads<CssOutputMode> {
    static readonly TYPE = Symbol(this.name);
    static readonly id = "cssOutput";
    static readonly outputDisplayType = OutputDisplayType.Css;

    static readonly overloadGroup = new OverloadGroup(new Map<CssOutputMode, Overload>([
      [CssOutputMode.RgbVector, new Overload(
        "RGB vector",
        node => [
          new InSocket(node, SocketType.Vector, "RGB").flag(SocketFlag.Rgb),
        ],
        node => [],
        (ins, outs, context) => ({
          values: ins[0].inValue(context),
          labels: [],
          flags: [],
        }),
      )],
      [CssOutputMode.Color, new Overload(
        "Color",
        node => [
          new InSocket(node, SocketType.ColorComponents, "Color"),
        ],
        node => [],
        (ins, outs, context) => ({
          values: ins[0].inValue(context),
          labels: [],
          flags: [],
        }),
      )],
    ]));

    constructor() {
      super(CssOutputMode.RgbVector);
      this.width = 275;
    }
  }
  export class ChromaticityPlotNode extends NodeWithOverloads<ChromaticityPlotMode> {
    static readonly TYPE = Symbol(this.name);
    static readonly id = "chromaticityPlot";

    static readonly overloadGroup = new OverloadGroup(new Map<ChromaticityPlotMode, Overload>([
      [ChromaticityPlotMode.Color, new Overload(
        "From colors",
        node => [
          new InSocket(node, SocketType.ColorComponents, "Colors"),
        ],
        node => [],
      )],

      [ChromaticityPlotMode.Xy, new Overload(
        "From xy",
        node => [
          new InSocket(node, SocketType.Float, "x", {
            defaultValue: cm.illuminantsXy["2deg"]["D65"][0],
          }),
          new InSocket(node, SocketType.Float, "y", {
            defaultValue: cm.illuminantsXy["2deg"]["D65"][1],
          }),
        ],
        node => [],
      )],
    ]));

    constructor() {
      super(ChromaticityPlotMode.Color);
      this.width = 200;
    }
  }

  export class ImagePlotNode extends Node {
    static readonly TYPE = Symbol(this.name);
    static readonly id = "imagePlot";
    static readonly outputDisplayType = OutputDisplayType.Custom;

    readonly normalizeCoordsSocket: InSocket<SocketType.Bool>;
    readonly alphaSocket: InSocket<SocketType.Float>;
    readonly widthSocket: InSocket<SocketType.Float>;
    readonly heightSocket: InSocket<SocketType.Float>;

    width = 240;

    private static readonly inputSlots = WebglSlot.ins("val", "alpha");

    constructor() {
      super();

      const {val, alpha} = ImagePlotNode.inputSlots;

      this.ins.push(
        (this.normalizeCoordsSocket = new InSocket(this, SocketType.Bool, "Normalize coordinates", {
          showSocket: false,
          defaultValue: true,
        })),
        new InSocket(this, SocketType.ColorComponents, "Colors", {
          webglOutputMapping: {
            [webglOuts.val]: val,
          },
        }),
        (this.alphaSocket = new InSocket(this, SocketType.Float, "Alpha", {
          defaultValue: 1,
          webglOutputMapping: {
            [webglOuts.val]: alpha,
          },
        })),
        (this.widthSocket = new InSocket(this, SocketType.Float, "Width", {
          defaultValue: 240,
          constant: true,
          sliderProps: {
            hasBounds: false,
            step: 1,
            min: 1,
          },
        })),
        (this.heightSocket = new InSocket(this, SocketType.Float, "Height", {
          defaultValue: 240,
          constant: true,
          sliderProps: {
            hasBounds: false,
            step: 1,
            min: 1,
          },
        })),
      );
    }

    display(context: NodeEvalContext) {
      return {
        values: this.ins[1].inValue(context),
        labels: [],
        flags: [],
      };
    }

    webglBaseVariables(context?: NodeEvalContext): WebglVariables {
      return WebglVariables.empty({node: this});
    }

    webglOutputs() {
      const {val, alpha} = ImagePlotNode.inputSlots;

      return {
        [webglOuts.val]: WebglTemplate.slot(val),
        [webglOuts.alpha]: WebglTemplate.slot(alpha),
      };
    }
  }

  export class SampleHexCodesNode extends Node {
    static readonly TYPE = Symbol(this.name);
    static readonly id = "sampleHexCodes";
    static readonly outputDisplayType = OutputDisplayType.Custom;

    readonly colorsSocket: InSocket<SocketType.ColorComponents>;

    width = 600;

    constructor() {
      super();
      this.ins.push(
        (this.colorsSocket = new InSocket(this, SocketType.ColorComponents, "Colors")),
      );
    }
  }
}