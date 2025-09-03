import type React from "react";
import type { UniversePoint } from "@/data/schema";

export interface UniversePointProps {
    point: UniversePoint;
}

export const UniversePointDisplay: React.FC<UniversePointProps> = ({ point }) => {
    return (
        <span>
            X: <span className="text-sm">{point.x.toLocaleString()}</span>
            <br />
            Y: <span className="text-sm">{point.y.toLocaleString()}</span>
            <br />
            Z: <span className="text-sm">{point.z.toLocaleString()}</span>
        </span>
    );
};
