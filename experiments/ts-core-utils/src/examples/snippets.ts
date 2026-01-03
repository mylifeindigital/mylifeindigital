/**
 * Generic memoize function for caching function results
 */
function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result
): (...args: Args) => Result {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`Cache hit for: ${key}`);
      return cache.get(key)!;
    }

    console.log(`Cache miss for: ${key}`);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// basic understanding of memoization function
// it accepts a function that returns a type Result
// the return type of the function is a function that accepts any arguments and returns a Result
// the returned function is scoped to the outer function. declaring a cache object within the outer function is scoped to the outer function.
// the cached object in the outer function is initialized when the outer function is called.
// subsequent calls to the returned function will have access to the initialized cache object.

// Example: Expensive fibonacci calculation
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Memoized version - much faster for repeated calls
const memoizedFib = memoize((n: number): number => {
  if (n <= 1) return n;
  return memoizedFib(n - 1) + memoizedFib(n - 2);
});

// Demo
console.log("--- Standard fibonacci (slow for large n) ---");
console.time("fib(30)");
console.log(`fib(30) = ${fibonacci(30)}`);
console.timeEnd("fib(30)");

console.log("\n--- Memoized fibonacci (fast!) ---");
console.time("memoizedFib(30)");
console.log(`memoizedFib(30) = ${memoizedFib(30)}`);
console.timeEnd("memoizedFib(30)");

console.log("\n--- Second call uses cache ---");
console.time("memoizedFib(30) again");
console.log(`memoizedFib(30) = ${memoizedFib(30)}`);
console.timeEnd("memoizedFib(30) again");

// Example with multiple arguments
const memoizedAdd = memoize((a: number, b: number) => {
  console.log(`  Computing ${a} + ${b}...`);
  return a + b;
});

console.log("\n--- Memoized with multiple args ---");
console.log(`add(2, 3) = ${memoizedAdd(2, 3)}`);
console.log(`add(2, 3) = ${memoizedAdd(2, 3)}`); // cached
console.log(`add(5, 7) = ${memoizedAdd(5, 7)}`); // new computation
