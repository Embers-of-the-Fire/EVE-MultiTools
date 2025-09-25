/**
 * Remove all duplicates from an array.
 *
 * This function iterates through the array and returns a new array with only unique elements.
 */
export function removeDuplicate<T>(iter: T[]): T[] {
    const seen = new Set<T>();
    return iter.filter((item) => {
        if (seen.has(item)) {
            return false;
        } else {
            seen.add(item);
            return true;
        }
    });
}

/**
 * Sort the array as number.
 *
 * This function sorts the array in ascending order based on numerical value.
 *
 * The `T` must be a number or the key returns a number
 */
export function sort<T>(arr: T[], key = (num: T) => num as number): T[] {
    return arr.slice().sort((a, b) => key(a) - key(b));
}
