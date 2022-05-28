import {Color, Vec2, Vec3, mod} from "@/util";
import * as math from "mathjs";

import {Col, illuminantE} from "./colormanagement/col-xyz-xyy-illuminants";
import {Lab} from "./colormanagement/lab";

export {Col, Xyz, Xyy, Xy, illuminantsXy} from "./colormanagement/col-xyz-xyy-illuminants";
export {Srgb, LinearSrgb} from "./colormanagement/srgb";
export {AdobeRgb, LinearAdobeRgb} from "./colormanagement/adobe-rgb";
export {Lab, LchAb} from "./colormanagement/lab";

export {spectralPowerDistribution} from "./colormanagement/spectral-power-distribution";


//#region Conversion functions

export const cmyToRgb = (vec: Color) => vec.map(comp => 1 - comp);
export const rgbToCmy = cmyToRgb;

export const hslToRgb = ([hue, sat, lightness]: Color) => {
	if (sat === 0) return [lightness, lightness, lightness];

	const rgbCompDistribFromHue = (p: number, q: number, hue: number) => {
		hue = mod(hue, 1);

		if (hue < 1/6) return p + (q - p) * 6 * hue;
		if (hue < 3/6) return q;
		if (hue < 4/6) return p + (q - p) * (2/3 - hue) * 6;
		return p;
	};

	const q = lightness < 0.5
			? lightness * (1 + sat)
			: lightness * (1 - sat) + sat;
	const p = 2 * lightness - q;

    return [
		rgbCompDistribFromHue(p, q, hue + 1/3),
		rgbCompDistribFromHue(p, q, hue),
		rgbCompDistribFromHue(p, q, hue - 1/3),
	];
};

export const hsvToRgb = ([hue, sat, value]: Color) => {
	hue = mod(hue, 1) * 6;
	const segmentStart = Math.floor(hue);

	const plateau = value;
	const valley = value * (1 - sat);
	const falling = value * (1 - sat * (hue - segmentStart));
	const rising = value * (1 - sat * (1 - (hue - segmentStart)));
 
	if      (hue < 1) return [plateau, rising,  valley];
	else if (hue < 2) return [falling, plateau, valley];
	else if (hue < 3) return [valley,  plateau, rising];
	else if (hue < 4) return [valley,  falling, plateau];
	else if (hue < 5) return [rising,  valley,  plateau];
	else              return [plateau, valley,  falling];
};



export namespace difference {
	export const deltaE1976 = (col1: Vec3 | Col, col2: Vec3 | Col) => {
		const lab1 = Lab.from(col1, col1 instanceof Col ? col1.illuminant : illuminantE);
		const lab2 = Lab.from(col2, col2 instanceof Col ? col2.illuminant : illuminantE);

		return Math.hypot(...lab1.map((comp, i) => lab2[i] - lab1[i]));
	}
}