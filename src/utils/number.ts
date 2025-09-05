export const romanNumerals = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
] as const;

export const numberToRoman = (num: number): string => {
    let result = "";
    for (const [value, numeral] of romanNumerals) {
        while (num >= Number(value)) {
            result += numeral;
            num -= Number(value);
        }
    }
    return result;
};
