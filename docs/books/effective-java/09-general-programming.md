---
title: 9. General Programming
sidebar_position: 10
---

# 9. General Programming

## Chapter overview

This chapter covers general practices that improve correctness, clarity, and performance: minimizing local variable scope, preferring for-each, knowing and using the libraries, avoiding float/double for exact answers, preferring primitives to boxed types, avoiding strings where other types fit, being wary of string concatenation performance, referring to objects by their interfaces, using reflection and native methods judiciously, optimizing only when needed, following naming conventions, using exceptions appropriately (not for control flow), avoiding redundant type parameters, and using Optional correctly. These items make everyday code more robust and maintainable.

---

## Item 53: Minimize the scope of local variables

**Summary paragraph:** Declare local variables where they are first used and in the smallest scope that fits. Prefer for-each when iterating. This reduces bugs (e.g. using a variable before it’s set or after its intended use) and improves readability.

**Context:** Declaring all variables at the top of a method was common in C; in Java it lengthens scope and can lead to misuse (e.g. reusing a variable for different purposes, or using it before initialization). Narrow scope makes the code easier to understand and refactor.

**Why it matters:** Smaller scope reduces the chance of accidental reuse and makes the relationship between variable and use clear. It also allows earlier GC of temporary objects when the variable goes out of scope.

**What to do:** Declare each variable at the point it’s first used. Keep loop variables in the for loop header when possible (for (int i = 0; ...)). Prefer for-each so iterator/index is not visible outside the loop. If you must declare before use (e.g. different branches assign), keep the scope as small as possible.

**Pitfalls / exceptions:** Sometimes you need a variable that’s assigned in different branches; declare it before the branches and assign in each. Don’t sacrifice clarity for extreme scope minimization.

**Pros and cons:** Pros: clearer intent, fewer bugs, better GC. Cons: none significant.

**Quick example:**

```java
for (Element e : c) {
    doSomething(e);
}
// e not visible here
```

---

## Item 54: Prefer for-each loops to traditional for loops

**Summary paragraph:** Use the for-each loop (enhanced for) when you only need to iterate over elements and don’t need the index or iterator. It’s clearer and eliminates the possibility of index-off-by-one and iterator misuse.

**Context:** Traditional for loops and explicit iterators are error-prone (wrong bound, wrong variable). For-each expresses “do this for each element” and hides the index/iterator.

**Why it matters:** For-each is less verbose and removes a class of bugs. It works with any Iterable and arrays. The only time to avoid it is when you need to remove during iteration (use removeIf or explicit iterator) or replace by index.

**What to do:** Use for (Type e : iterableOrArray) whenever you’re only reading or doing one operation per element. Use traditional for or iterator when you need the index (e.g. to set an array element), need to remove via Iterator.remove(), or need to iterate in parallel over multiple collections with an index.

**Pitfalls / exceptions:** You cannot remove elements via for-each (no remove()). You cannot modify the current slot in an array (e.g. assign to e). For nested loops, for-each can still be used on the inner or outer as appropriate.

**Pros and cons:** Pros: clarity, fewer bugs. Cons: can’t remove or replace by index in the loop.

**Quick example:**

```java
for (String s : list) { process(s); }
```

---

## Item 55: Know and use the libraries

**Summary paragraph:** Use the standard library (and well-maintained libraries) instead of writing your own. You get tested, optimized, and maintained code; your code stays simpler. At least be familiar with java.lang, java.util, java.io, and the collections framework.

**Context:** Reimplementing things (random numbers, dates, collections, I/O) is error-prone and wastes time. The standard library and common libraries (e.g. Guava) already solve many problems.

**Why it matters:** Library code is usually better tested and tuned. Using it reduces bugs and maintenance. Not knowing the library leads to reinventing the wheel and sometimes to subtle bugs (e.g. Random for security-sensitive randomness).

**What to do:** Before implementing something non-trivial, check java.util, java.util.stream, java.time, and common third-party libraries. Read the Javadoc for the main packages. Subscribe to or skim release notes for the JDK and key libraries. Prefer standard solutions (e.g. ThreadLocalRandom over Random for concurrent use).

**Pitfalls / exceptions:** Don’t use a library for a one-line need if it pulls in heavy dependencies. For security-sensitive code (e.g. crypto, random), use the right API (e.g. SecureRandom, not Random).

**Pros and cons:** Pros: quality, speed of development, fewer bugs. Cons: dependency, learning curve.

**Quick example:** Use `ThreadLocalRandom.current().nextInt(n)` instead of writing your own RNG.

---

## Item 56: Avoid float and double for exact answers

**Summary paragraph:** float and double are binary floating-point; they cannot represent many decimal values exactly (e.g. money). For exact arithmetic (currency, quantities), use BigDecimal, int, or long (e.g. cents). Use float/double only for scientific or approximate computation.

**Context:** Binary floating-point (IEEE 754) cannot exactly represent 0.1, 0.2, etc. So 0.1 + 0.2 != 0.3 in float/double. For money or other exact quantities, this leads to rounding errors and wrong totals.

**Why it matters:** Using float/double for money is a classic bug. BigDecimal (or integer cents) gives exact decimal behavior. Performance and convenience of float/double don’t justify wrong answers.

**What to do:** For money and other exact decimal values, use BigDecimal (and be aware of its performance and constructor choices) or represent as integer in the smallest unit (e.g. cents). Use float/double for scientific/engineering or when approximation is acceptable. Document when you use float/double for approximate values.

**Pitfalls / exceptions:** BigDecimal is slower and more verbose. For very high performance with bounded precision, fixed-point integer arithmetic can be used. When using BigDecimal, prefer the constructor that takes String, not double, to avoid double’s representation errors.

**Pros and cons:** Pros of BigDecimal/int: exact. Cons: slower, more code. Pros of float/double: fast, convenient. Cons: not exact for decimal.

**Quick example:**

```java
// Wrong
double price = 1.03 - 0.42;  // not exactly 0.61

// Right
BigDecimal price = BigDecimal.valueOf(1.03).subtract(BigDecimal.valueOf(0.42));
```

---

## Item 57: Prefer primitive types to boxed primitives

**Summary paragraph:** Prefer int, long, boolean, etc., over Integer, Long, Boolean when you can. Primitives are faster and avoid null and subtle bugs (e.g. == on boxed types compares references). Use boxed types only when you need null, in generics (e.g. List&lt;Integer&gt;), or when an API requires Object.

**Context:** Autoboxing and unboxing hide the distinction but don’t remove it. Boxed types have identity (reference), can be null, and have overhead. Mixing primitives and boxed types in == and in collections can cause bugs.

**Why it matters:** Unnecessary boxing causes performance cost and NPE risk (unboxing null). Using == on boxed types is reference equality, not value equality. Primitives are simpler and faster.

**What to do:** Use primitives by default. Use boxed types when: the value can be null and you need to represent “absent,” you’re using generics (e.g. `Optional<Integer>`, `List<Integer>`), or an API requires Object. Be careful with == on boxed types; use equals or unbox. Prefer IntStream, LongPredicate, etc., over `Stream<Integer>` when you have primitives.

**Pitfalls / exceptions:** Repeated boxing/unboxing in loops can be expensive; use primitive streams or arrays when performance matters. Don’t use Boolean, Integer, etc., as locks (identity can change with caching).

**Pros and cons:** Pros of primitives: performance, no null, clear semantics. Pros of boxed: null, generics. Cons of boxed: cost, == vs equals, NPE on unbox.

**Quick example:**

```java
Integer a = 127;
Integer b = 127;
if (a == b) { }  // May be true due to cache, but don't rely on it
if (a.equals(b)) { }  // Correct
```

---

## Item 58: Avoid strings where other types are more appropriate

**Summary paragraph:** Don’t use strings to represent other types of data: use enums for fixed sets of values, use numeric types for numbers, use appropriate types for aggregate data (class, record) or keys (typed keys). Strings are for text; using them for everything loses type safety and invites parsing errors.

**Context:** Strings are versatile but overloaded. Using them for enums (e.g. "ACTIVE"), numbers, or compound keys (e.g. "part1#part2") leads to typos, parsing bugs, and no type checking.

**Why it matters:** Type safety and clarity. Enums and numeric types are checked at compile time. Strings for non-text data require parsing and validation at runtime and are easy to misuse.

**What to do:** Use enum for fixed sets of constants. Use int/long/BigDecimal for numbers. Use a proper type (class, record) or typed key for compound data. Use strings only for genuine text. If you must use a string for an external format (e.g. config), parse early into a typed representation and use that in your code.

**Pitfalls / exceptions:** When interfacing with systems that only accept strings (e.g. JSON, config files), convert at the boundary; keep the rest of the code typed.

**Pros and cons:** Pros of proper types: safety, clarity. Cons of strings for non-text: no checking, parsing, fragility.

**Quick example:** Use `enum Status { ACTIVE, INACTIVE }` instead of `String status = "ACTIVE"`.

---

## Item 59: Beware the performance of string concatenation

**Summary paragraph:** Do not use string concatenation (+ or +=) in loops to build a large string. It produces a new string each time and is O(n²). Use StringBuilder (or StringBuffer if thread safety is needed) for repeated concatenation.

**Context:** String is immutable. Each + creates a new string and copies characters. In a loop, that’s quadratic in the number of concatenations. StringBuilder maintains a buffer and appends without copying the whole string each time.

**Why it matters:** Concatenation in loops can make code very slow for large inputs. StringBuilder gives linear behavior. For a single expression with a few concatenations, + is fine; the compiler may optimize.

**What to do:** For building a string in a loop, use StringBuilder and append(). For a small number of concatenations in one expression, + is acceptable. Use String.join or String.format when they express intent (e.g. joining with delimiter). For logging, many frameworks accept format strings and avoid concatenation when the level is disabled.

**Pitfalls / exceptions:** Don’t use StringBuilder for a single concatenation or a few; + is clearer. Thread safety: use StringBuffer only when the buffer is shared across threads; usually StringBuilder in a local variable is enough.

**Pros and cons:** Pros of StringBuilder: linear time. Cons of + in loop: quadratic. Pros of +: simple for few ops.

**Quick example:**

```java
StringBuilder sb = new StringBuilder();
for (String s : list) sb.append(s);
String result = sb.toString();
```

---

## Item 60: Refer to objects by their interfaces

**Summary paragraph:** Prefer types that are interfaces (e.g. List, Set, Map) rather than implementation classes (ArrayList, HashSet, HashMap) when declaring variables, parameters, and return types. This gives flexibility to change implementations and emphasizes the contract, not the implementation.

**Context:** If you declare ArrayList, your code is tied to that implementation. If you declare List, you can switch to LinkedList or another implementation without changing the rest of the code. Same for Set, Map, and other abstractions.

**Why it matters:** Program to the interface keeps code flexible and documents that you only depend on the interface contract. It makes it easier to substitute implementations (e.g. for testing or performance).

**What to do:** Use List, Set, Map, etc., in variable and parameter types. Use implementation types only when you need a specific API (e.g. LinkedHashMap, NavigableMap). Prefer returning interfaces from methods. When creating, you still instantiate a concrete class (e.g. `new ArrayList<>()`) but assign to the interface type.

**Pitfalls / exceptions:** If you need a class-specific method (e.g. LinkedList.getFirst()), you must use that type. For framework or callback APIs that require a concrete type, you have no choice. Base classes (e.g. AbstractList) are for implementation, not for variable types.

**Pros and cons:** Pros: flexibility, clear contract. Cons: can’t use implementation-specific methods without casting.

**Quick example:**

```java
List<String> list = new ArrayList<>();
void process(List<String> items) { ... }
```

---

## Item 61: Prefer interfaces to reflection

**Summary paragraph:** Reflection (java.lang.reflect) allows inspection and invocation of code at runtime but has drawbacks: verbose, no compile-time checking, and performance cost. Prefer interfaces and normal invocation when you can; use reflection only when you need to work with unknown classes at runtime (e.g. plugins, frameworks).

**Context:** Reflection breaks encapsulation and compile-time checks. It’s used by frameworks (e.g. dependency injection, serialization) that need to work with classes they don’t know at compile time. Application code usually doesn’t need it.

**Why it matters:** Reflection is slow and fragile. Refactoring can break reflective code without compile errors. Use it only when the benefit (e.g. plugin loading) outweighs the cost. Prefer interface-based APIs (e.g. a known interface implemented by loaded classes).

**What to do:** Avoid reflection in application code. If you must use it, isolate it (e.g. in a factory that returns an interface type) and catch ReflectiveOperationException. Prefer interface types for the result so the rest of the code doesn’t depend on reflection. Consider code generation or annotation processing as alternatives. For object creation of unknown classes, prefer a factory interface that implementations register.

**Pitfalls / exceptions:** Reflection can fail under security managers or when the class isn’t present. Performance: cache Method/Constructor/Field objects; avoid looking them up in hot paths. Use setAccessible sparingly; it can break assumptions.

**Pros and cons:** Pros of interfaces: type-safe, fast. Pros of reflection: works with unknown classes. Cons of reflection: slow, no compile-time checks.

**Quick example:** Use a `ServiceLoader<MyInterface>` or a factory that returns `MyInterface` rather than reflecting on class names.

---

## Item 62: Use native methods judiciously

**Summary paragraph:** Native methods (JNI) allow calling C/C++ from Java but add complexity, portability issues, and safety risks. Use them only when you need access to low-level resources, legacy native libraries, or performance-critical code that has been measured and cannot be achieved in Java. Prefer pure Java or existing native libraries (e.g. via JNA) when possible.

**Context:** Native code is used for OS APIs, legacy code, or extreme performance. It requires a separate native library per platform, can crash the JVM, and is harder to debug and maintain.

**Why it matters:** Native code is not portable, can introduce security and stability issues, and complicates builds and deployment. Use only when necessary and isolate it behind a thin Java API.

**What to do:** Prefer Java libraries and the JDK. If you need native code, keep the interface small and well-defined. Document platform support and build requirements. Consider alternatives (e.g. ProcessBuilder for OS calls, optimized Java or Graal, or existing native wrappers).

**Pitfalls / exceptions:** GC and threading: native code must respect JNI rules (e.g. not holding references across critical sections). Performance: the JNI boundary has cost; ensure the native work dominates. Safety: validate all data passed to native code.

**Pros and cons:** Pros: access to OS/legacy, potential performance. Cons: complexity, portability, safety, debugging.

**Quick example:** Use native only for a small, well-tested layer (e.g. crypto, media) and expose a Java API.

---

## Item 63: Optimize judiciously

**Summary paragraph:** Don’t optimize prematurely. Write clear, correct code first; measure; then optimize only the parts that measurements show are hot. Avoid designs that make good performance impossible, but don’t sacrifice clarity for minor gains without evidence.

**Context:** Premature optimization wastes time and can make code complex and buggy. Many “optimizations” don’t help or even hurt (e.g. due to JIT). Real bottlenecks are often in a small part of the code; optimize that part after measuring.

**Why it matters:** Clear code is easier to maintain and refactor. Optimization should be driven by profiling and realistic workloads. Wrong optimizations can make code slower (e.g. breaking inlining, adding contention).

**What to do:** Write clear, idiomatic code. Use a profiler on realistic data to find hot spots. Optimize only those spots and measure again. Prefer better algorithms over micro-optimizations. Document the reason for any non-obvious optimization. Avoid optimization that hurts readability unless measurements show significant benefit.

**Pitfalls / exceptions:** Don’t rely on intuition for performance; measure. The JVM optimizes well; trust it for most code. Low-level tricks (e.g. avoiding method calls) often don’t help and hurt readability.

**Pros and cons:** Pros of measuring: focus effort where it matters. Pros of clear code: maintainability. Cons of premature optimization: complexity, wrong focus.

**Quick example:** Use a profiler; optimize the 10% of code that dominates time; leave the rest readable.

---

## Item 64: Adhere to generally accepted naming conventions

**Summary paragraph:** Follow Java naming conventions: packages lowercase; classes/interfaces PascalCase; methods, fields, variables camelCase; constants UPPER_SNAKE_CASE; type parameters single uppercase letter (T, E, K, V). Consistent naming makes code readable and matches tool and developer expectations.

**Context:** The Java Language Specification and long-standing practice define these conventions. IDEs and style checkers assume them. Deviating confuses readers and tools.

**Why it matters:** Consistent naming helps others (and you later) understand the code. Conventions also distinguish kinds of names (e.g. constant vs variable) at a glance.

**What to do:** Use the standard conventions for packages, classes, methods, fields, constants, and type parameters. Don’t use abbreviations unless widely known (e.g. max, min). Name methods to describe what they do (e.g. get, set, is, has). Use plural for collections (e.g. getItems()).

**Pitfalls / exceptions:** Legacy code may not follow conventions; when changing it, consider scope (whole project vs local). Some APIs use historical names (e.g. hashCode); keep those.

**Pros and cons:** Pros: readability, consistency, tool support. Cons: none.

**Quick example:** `getUserName()`, `MAX_SIZE`, `List<T>`.

---

## Item 65: Prefer alternatives to Java serialization

**Summary paragraph:** Java’s built-in serialization (Serializable, ObjectInputStream/ObjectOutputStream) is brittle and has had security issues. Prefer cross-platform formats (JSON, Protocol Buffers, etc.) for persistence and network. Use serialization only when you need to interoperate with legacy Java serialization or when the format is constrained to it.

**Context:** Serialization was designed for Java-to-Java RPC and persistence. It’s tied to class structure, has had many security issues (gadget chains), and is not human-readable or cross-language. New systems usually use JSON, XML, or binary formats like protobuf.

**Why it matters:** Security: deserializing untrusted data can lead to remote code execution. Evolution: changing classes breaks compatibility. Debugging: binary format is hard to inspect. Cross-language: other languages can’t read Java serialized form.

**What to do:** Prefer JSON (e.g. Jackson, Gson), Protocol Buffers, or similar for new code. Use Java serialization only for legacy compatibility. If you must use it, don’t deserialize untrusted data; use a whitelist of allowed classes; consider a serialization filter (ObjectInputFilter). Prefer serialization proxy (Item 90) when you do use serialization.

**Pitfalls / exceptions:** Some frameworks (e.g. RMI, JMX) use serialization; understand the risk. Removing serialization from a class is a breaking change for existing persisted data.

**Pros and cons:** Pros of JSON/protobuf: portable, debuggable, often safer. Cons of Java serialization: security, brittleness, Java-specific.

**Quick example:** Use `ObjectMapper.writeValueAsString(obj)` (JSON) instead of `ObjectOutputStream` for new storage.

---

## Item 66: Use Optional judiciously

**Summary paragraph:** Use `Optional<T>` to represent a value that might be absent, primarily as a return type. It signals “may be empty” and discourages null. Don’t use Optional for fields, collection elements, or parameters as a replacement for overloading or nullable parameters; avoid Optional of boxed primitives (use OptionalInt etc. or just null for primitives in APIs).

**Context:** Optional was introduced to reduce NPEs and make “optional return” explicit. It’s not a replacement for all nulls: it has cost (extra object), and misuse (Optional in fields, in collections, or as parameters) can make APIs noisy without clear benefit.

**Why it matters:** Optional return types document “might be empty” and force the caller to handle absence. Using Optional everywhere (fields, parameters) is verbose and not the intended use. Optional of boxed types (`Optional<Integer>`) doubles boxing; prefer OptionalInt or a different design.

**What to do:** Use Optional as a return type when the method might have no result and the caller should handle that (e.g. findFirst()). Don’t use Optional for fields; use null or a different design. Don’t use Optional as a method parameter to mean “optional argument”; use overloading or a builder. Don’t use Optional in collections (use an empty collection or omit the element). Prefer OptionalInt, OptionalLong, OptionalDouble for primitives when you need Optional semantics. Never return null from a method that returns Optional; return Optional.empty().

**Pitfalls / exceptions:** Optional is not Serializable; use a serialization proxy or a different type for serialized fields. Don’t use Optional just to chain map/flatMap if a simple null check or if-present is clearer.

**Pros and cons:** Pros: explicit optional return, avoids null. Cons: overhead, misuse (fields, params, collections) adds noise.

**Quick example:**

```java
public Optional<User> findUser(String id) {
    return Optional.ofNullable(store.get(id));
}
// Caller: findUser(id).orElseThrow(() -> new NotFound());
```

---

## Item 67: Prefer exceptions to return codes

**Summary paragraph:** Use exceptions rather than return codes (or sentinel values) to signal failure or exceptional conditions. Exceptions separate normal flow from error handling, can’t be ignored by default, and carry context. Reserve return codes for expected outcomes that are part of the normal contract (e.g. “found” vs “not found” when both are valid).

**Context:** C-style return codes (e.g. -1, false) require every caller to check. It’s easy to forget and proceed with invalid data. Exceptions force explicit handling (or propagation) and keep the main path clear.

**Why it matters:** Return codes are easy to ignore; exceptions are visible. Exceptions can carry detail (message, cause) and propagate up the call stack. Using return codes for exceptional conditions leads to buggy, hard-to-read code.

**What to do:** Throw a checked or unchecked exception when an operation cannot fulfill its contract (e.g. file not found, invalid argument). Use return values only for expected, non-exceptional outcomes (e.g. “not found” when that’s a valid result and callers are expected to handle it). Document thrown exceptions in Javadoc (@throws). Prefer standard exceptions (IllegalArgumentException, IllegalStateException, etc.) when they fit.

**Pitfalls / exceptions:** Don’t use exceptions for control flow (e.g. expected “no more elements”); use Optional or a sentinel that’s part of the API. Don’t throw for conditions that are part of normal operation and that every caller must handle; that’s a return value or Optional.

**Pros and cons:** Pros of exceptions: can’t be ignored, carry context, separate path. Cons: cost (when thrown), more code. Pros of return codes: cheap, explicit in signature. Cons: easy to ignore.

**Quick example:** Throw `FileNotFoundException` instead of returning null or -1 when a required file is missing.

---

## Item 68: Use checked exceptions for recoverable conditions and runtime exceptions for programming errors

**Summary paragraph:** Use checked exceptions when the caller can reasonably be expected to recover (e.g. retry, prompt user). Use unchecked (runtime) exceptions for programming errors (e.g. precondition violation, bug). Don’t force callers to catch exceptions they can’t handle; avoid overuse of checked exceptions in APIs.

**Context:** Checked exceptions must be declared or caught; they force the caller to handle or propagate. Unchecked exceptions (RuntimeException and subclasses) don’t. Use checked when recovery is plausible; use unchecked for bugs and when recovery doesn’t make sense.

**Why it matters:** Misuse leads to empty catch blocks (swallowing) or unnecessary “throws” in every method. Too many checked exceptions make APIs painful. Right choice improves clarity and forces handling only where it’s useful.

**What to do:** Throw checked exceptions for conditions the caller might recover from (e.g. network timeout, parse error). Throw unchecked (IllegalArgumentException, IllegalStateException, NullPointerException) for precondition violations and programming errors. Don’t throw checked exceptions that most callers can’t handle; consider returning Optional or a result type instead. Provide methods that do and don’t throw for the same operation when some callers can’t handle the exception (e.g. parse vs parseOrThrow).

**Pitfalls / exceptions:** Don’t catch Exception and ignore it. Don’t make every method throw Exception. When wrapping exceptions, preserve the cause (initCause or constructor with cause).

**Pros and cons:** Checked: forces handling; can be overused. Unchecked: flexible; use for bugs. Each has its place.

**Quick example:** Use `IllegalArgumentException` for bad args; use a checked exception for “file locked, retry?”.
