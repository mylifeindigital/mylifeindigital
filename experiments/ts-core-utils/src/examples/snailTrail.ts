export {};

declare global {
    interface Array<T> {
        snail(rowsCount: number, colsCount: number): number[][];
    }
}


Array.prototype.snail = function(rowsCount: number, colsCount: number): number[][] {
    if(rowsCount * colsCount !== this.length) {
        return [];
    }

    const result: number[][] = Array.from({ 
        length: rowsCount }, () => Array.from({ 
            length: colsCount }, () => 0)
        );

    let index = 0;
    for(let col = 0; col < colsCount; col++) {
        if(col % 2 === 0) {
            for(let row = 0; row < rowsCount; row++) {
                result[row][col] = this[index++];
            }
        }
        else {
            for(let row = rowsCount - 1; row >= 0; row--) {
                result[row][col] = this[index++];
            }
        }
    }
    return result;
}


// Test cases
const arr1 = [19, 10, 3, 7, 9, 8, 5, 2, 1, 17, 16, 14, 12, 18, 6, 13, 11, 20, 4, 15];
console.log(arr1.snail(5, 4));  // [[1, 2, 3, 4]]