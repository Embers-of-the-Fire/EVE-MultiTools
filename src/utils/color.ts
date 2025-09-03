export const COLORCURVE_SECURITY = [
    [0.553, 0.196, 0.392],
    [0.451, 0.125, 0.125],
    [0.737, 0.067, 0.09],
    [0.808, 0.267, 0.059],
    [0.863, 0.427, 0.027],
    [0.961, 1.0, 0.514],
    [0.447, 0.906, 0.333],
    [0.38, 0.859, 0.643],
    [0.306, 0.808, 0.973],
    [0.227, 0.604, 0.922],
    [0.173, 0.459, 0.886],
] as const;

export const getSecurityStatusColor = (securityStatus: number): string => {
    const index = Math.floor(Math.max(securityStatus, 0.0) * 10);
    const color = COLORCURVE_SECURITY[index];
    const [r, g, b] = color;
    return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
};
