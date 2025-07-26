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
