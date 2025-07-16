import type { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};

export type { Theme, Language, GlobalSettings, ConfigAPI } from "./config";
