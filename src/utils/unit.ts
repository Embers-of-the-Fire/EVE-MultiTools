import { PA_IN_ATM } from "@/constant/unit";

export const displayPressure = (atm: number): string => {
    if (atm < 0.01) {
        return `${(atm * PA_IN_ATM).toFixed(2)} Pa`;
    }
    return `${atm.toFixed(2)} atm`;
};

export const displayPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
};
