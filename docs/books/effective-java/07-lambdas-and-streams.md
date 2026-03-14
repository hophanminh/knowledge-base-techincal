---
title: 7. Lambdas and Streams
sidebar_position: 8
---

# 7. Lambdas and Streams

## Chapter overview

This chapter covers effective use of lambdas and streams (Java 8+): prefer lambdas over anonymous classes, prefer method references where they clarify, use standard functional interfaces, avoid streams for char values, write side-effect-free stream code, prefer primitive streams when appropriate, and use collectors wisely. Misuse leads to unclear or incorrect code and performance issues.

---

## Item 42: Prefer lambdas to anonymous classes

**Summary paragraph:** Prefer lambda expressions over anonymous class instances for small function objects. Lambdas are more concise, avoid the “vertical problem” of anonymous classes, and capture only effectively final variables. Use anonymous classes when you need multiple methods, non-final capture, or a named type.

**Context:** Historically, single-method interfaces were implemented with anonymous classes. They are verbose. Lambdas provide a concise syntax for the same thing when the interface is a functional interface (one abstract method).

**Why it matters:** Lambdas are shorter and easier to read. They don’t introduce a new scope in the same way, so name shadowing is less of an issue. The compiler can infer types. Anonymous classes are still needed for interfaces with multiple methods or when you need a concrete class (e.g. with state or multiple methods).

**What to do:** Where you would write `new SomeInterface() { public ReturnType method(Params p) { ... } }`, use a lambda `(p) -> ...` or method reference. Use anonymous classes when you need a class (e.g. multiple methods, constructor, instance fields) or when the lambda would be too long.

**Pitfalls / exceptions:** Lambdas can only implement functional interfaces. In lambdas you can’t use `this` to mean the anonymous instance; `this` is the enclosing class. For very long logic, a named method with a method reference may be clearer than a long lambda.

**Pros and cons:** Pros: concise, readable, type inference. Cons: only one method; no names for `this` or the type.

**Quick example:**

```java
// Before
Collections.sort(words, new Comparator<String>() {
    public int compare(String s1, String s2) { return Integer.compare(s1.length(), s2.length()); }
});

// After
Collections.sort(words, (s1, s2) -> Integer.compare(s1.length(), s2.length()));
```

---

## Item 43: Prefer method references to lambdas

**Summary paragraph:** Where a lambda only calls an existing method (possibly with a simple transformation), prefer a method reference. Method references are often shorter and clearer (e.g. `String::toLowerCase` instead of `s -> s.toLowerCase()`).

**Context:** Many lambdas are one-line delegations to a method. Method references (ClassName::methodName or object::methodName) express “use this method” directly and can be more readable.

**Why it matters:** Method references can be clearer and sometimes enable better optimization. They document that you’re just forwarding to a named method. Lambdas are better when you need to pass arguments in a different order or combine calls.

**What to do:** Use static refs (Integer::parseInt), bound instance refs (str::toLowerCase), unbound instance refs (String::toLowerCase), and constructor refs (ArrayList::new) where they match the functional interface. Use a lambda when you need to tweak arguments (e.g. (x, y) -> x.equals(y) vs Object::equals when args match).

**Pitfalls / exceptions:** When the method name is long or the class is generic, a short lambda can be clearer. Overloaded methods can make method refs ambiguous; use a cast or lambda to resolve.

**Pros and cons:** Pros: brevity, clarity. Cons: overloading ambiguity; sometimes lambda is clearer.

**Quick example:**

```java
map.merge(key, 1, (count, incr) -> count + incr);
map.merge(key, 1, Integer::sum);
```

---

## Item 44: Favor the use of standard functional interfaces

**Summary paragraph:** Use the standard functional interfaces in java.util.function (Function, Predicate, Supplier, Consumer, UnaryOperator, BinaryOperator, etc.) instead of defining your own when they match. This makes APIs consistent and reduces conceptual overhead.

**Context:** You could define your own SingleMethodInterface for every callback. The standard set (Function&lt;T,R&gt;, Predicate&lt;T&gt;, Supplier&lt;T&gt;, Consumer&lt;T&gt;, etc.) covers most cases. Custom interfaces are for when you need a distinct type (e.g. Comparable), a different signature, or clearer names.

**Why it matters:** Everyone knows Function and Predicate. Custom interfaces add types to learn and maintain. Standard interfaces work with the rest of the API (streams, Optional, etc.). Use custom when you need a more specific contract (e.g. throws checked exception, or a named domain concept).

**What to do:** Prefer `Function<T,R>`, `Predicate<T>`, `Supplier<T>`, `Consumer<T>`, `UnaryOperator<T>`, `BinaryOperator<T>`, and the primitive variants (IntPredicate, LongFunction, etc.) when they fit. Create your own when you need a distinguishable type (e.g. for overloads), a different arity, or a checked exception.

**Pitfalls / exceptions:** Don’t use a standard interface with a boxed type when a primitive variant exists (e.g. IntPredicate vs `Predicate<Integer>`) if you care about boxing. For comparators, `Comparator<T>` is the standard; don’t replace it with BiFunction.

**Pros and cons:** Pros: familiarity, interoperability. Cons: standard names may be generic; custom can be more domain-specific.

**Quick example:**

```java
// Use standard
Predicate<String> isEmpty = String::isEmpty;
Supplier<Item> itemSupplier = Item::new;
```

---

## Item 45: Use streams judiciously

**Summary paragraph:** Use streams when they improve readability and fit the task (transformations, filters, bulk operations on collections). Avoid streams when they hurt clarity (e.g. complex nested logic, multiple side effects, or when you need to break out of the pipeline). Prefer a simple loop when it’s clearer.

**Context:** Streams provide a declarative way to express bulk operations. They can make code shorter but also harder to follow when overused or when the logic doesn’t fit the pipeline model (e.g. early exit, multiple mutable accumulators).

**Why it matters:** Overuse of streams leads to hard-to-debug, hard-to-read code. Underuse misses conciseness and parallelism opportunities. The right balance depends on the problem and the reader.

**What to do:** Use streams for: filtering, mapping, grouping, searching, and simple reductions. Avoid when: you need to read or modify local variables from inside the pipeline, you need to break or return from the middle, or the pipeline becomes a long chain that’s harder to follow than a loop. Extract helper methods for stream stages to keep pipelines readable.

**Pitfalls / exceptions:** Debugging stream pipelines is harder (stack traces point to lambdas). Performance-critical code may need loops or primitive streams. When in doubt, write both and choose the clearer one.

**Pros and cons:** Pros: declarative, composable, parallelizable. Cons: can be opaque; limited control flow; debugging harder.

**Quick example:**

```java
// Good use of stream
list.stream().filter(x -> x > 0).map(String::valueOf).collect(Collectors.toList());
```

---

## Item 46: Prefer side-effect-free functions in streams

**Summary paragraph:** Stream stages should be pure: no side effects (no mutating external state, no I/O). Side effects in filters or maps make behavior and execution order (especially in parallel) hard to reason about. Do side effects in forEach only when you explicitly want to perform an action per element, not to accumulate results.

**Context:** Streams are designed for transformation and reduction. If lambdas in map/filter mutate shared state, results depend on order and parallelism; bugs are subtle. Accumulation should be done with collectors or reduce, not by mutating a variable from inside the pipeline.

**Why it matters:** Side effects in the middle of a pipeline break the mental model of “transform then collect.” They can cause race conditions in parallel streams and make behavior non-deterministic. Collectors and reduce are the right place for aggregation.

**What to do:** Keep map, filter, and similar stages side-effect-free. Use collectors (toList, groupingBy, etc.) or reduce for aggregation. Use forEach only for explicit per-element actions (e.g. logging, sending), not for building a collection (use collect instead).

**Pitfalls / exceptions:** forEach is acceptable for debugging (e.g. peek) or when the whole point is the side effect (e.g. writing to a sink). Don’t use forEach to populate an external list; use collect(toList()) or similar.

**Pros and cons:** Pros of side-effect-free: predictable, parallel-safe, testable. Cons of side effects in pipeline: bugs, non-determinism.

**Quick example:**

```java
// Bad: side effect in forEach to build list
List<String> result = new ArrayList<>();
stream.forEach(s -> result.add(s.toUpperCase()));

// Good
List<String> result = stream.map(String::toUpperCase).collect(Collectors.toList());
```

---

## Item 47: Prefer Collection to Stream as a return type

**Summary paragraph:** When returning a sequence of elements from a public API, prefer returning a Collection (or Iterable) rather than a Stream. Collections support iteration multiple times and the for-each loop; Stream is single-use. Return Stream only when you know the caller needs stream operations or when the sequence is too large to materialize.

**Context:** Stream is single-use; after a terminal operation it’s consumed. Many callers want to iterate multiple times or use for-each. Collection supports both iteration and stream(). Returning Stream forces callers to either use it once or call stream().collect(toList()) to iterate again.

**Why it matters:** Returning Collection (or Iterable) gives maximum flexibility: callers can iterate, use for-each, or call .stream(). Returning Stream is appropriate when the data is expensive to materialize or when the API is stream-oriented (e.g. I/O). For in-memory sequences, Collection is usually better.

**What to do:** Public API that returns a sequence: prefer `Collection<T>` (or List/Set as appropriate), or `Iterable<T>` if you don’t want to support size/contains. Return Stream only when the sequence is lazy or very large and the primary use is stream processing. Document if iteration is single-use (e.g. iterator from I/O).

**Pitfalls / exceptions:** Don’t store a Stream and return it from a method that creates it; the stream will be used once. If you return Iterable, document whether repeated iteration is supported. For very large or infinite sequences, Stream is the right return type.

**Pros and cons:** Pros of Collection: multiple iteration, for-each, size. Pros of Stream: lazy, good for large/infinite data. Cons of Stream: single-use, no for-each.

**Quick example:**

```java
// Prefer
public List<Item> getItems() { return new ArrayList<>(items); }

// Or for lazy/stream-oriented API
public Stream<Item> streamItems() { return items.stream(); }
```

---

## Item 48: Use caution when making streams parallel

**Summary paragraph:** Parallel streams can improve performance for CPU-bound, large, and easily splittable workloads. They can hurt performance (overhead, contention) for small or I/O-bound tasks. Measure before and after; use parallel only when you have evidence of benefit.

**Context:** Calling .parallel() on a stream uses the common ForkJoinPool and splits work across threads. Parallelism has overhead (splitting, merging, thread coordination). For small streams or when the work per element is I/O or locks, parallel can be slower.

**Why it matters:** Blind use of parallel() can slow down programs and increase CPU usage. Correct use can speed up bulk operations on large in-memory data. The only way to know is to measure.

**What to do:** Use parallel streams for large, CPU-bound, easily splittable workloads (e.g. heavy computation on large collections). Avoid for small streams, I/O-bound work, or when the pipeline has operations that don’t parallelize well (e.g. stateful). Measure with a realistic workload. Prefer parallel streams over manual ForkJoinPool use for simple cases.

**Pitfalls / exceptions:** Shared mutable state in the pipeline breaks parallel correctness. Avoid side effects. The default pool is shared (ForkJoinPool.commonPool()); don’t run blocking I/O in parallel stream tasks. For specialized needs, use a custom pool or parallel array/collection APIs.

**Pros and cons:** Pros: potential speedup for CPU-bound bulk ops. Cons: overhead, contention, wrong use can slow things down.

**Quick example:**

```java
// Only after measuring
list.parallelStream().filter(...).map(...).collect(toList());
```
