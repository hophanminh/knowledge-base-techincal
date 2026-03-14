---
title: 8. Methods
sidebar_position: 9
---

# 8. Methods

## Chapter overview

This chapter covers method design: validate parameters, make defensive copies when needed, design method signatures (names, parameter count, interfaces), use overloading sparingly and correctly, use varargs properly, and return optional and collection types appropriately. Good method design makes APIs easy to use correctly and hard to use incorrectly.

---

## Item 49: Check parameters for validity

**Summary paragraph:** Validate method parameters at the start of the method. Throw IllegalArgumentException (or NullPointerException for null) with a descriptive message if validation fails. For public and protected methods, document restrictions in Javadoc with @throws. Fail fast so bugs are caught early and at the boundary.

**Context:** Invalid parameters (null, out-of-range, wrong state) cause failures later in the method or in other code, making bugs hard to trace. Explicit checks at entry give clear errors and document the contract.

**Why it matters:** Failing fast with a clear exception saves debugging time. Documented @throws helps callers understand the contract. For private methods you can rely on the caller (e.g. assert) but still often check for clarity.

**What to do:** At the beginning of the method, check parameters that must be non-null, in range, or otherwise valid. Use Objects.requireNonNull for null, or throw IllegalArgumentException/NullPointerException. Document in Javadoc: @param and @throws. Use @NonNull or similar if your codebase uses such annotations. For private methods, you can use assert for checks that should never fail in correct code.

**Pitfalls / exceptions:** Don’t validate parameters that are used only in paths that are unreachable with invalid input if that’s redundant. Avoid expensive validation in performance-critical inner loops if the caller is trusted (e.g. private or package use). For constructors, validate before assigning to fields so the object is never in an invalid state.

**Pros and cons:** Pros: clear errors, documented contract, fail-fast. Cons: a small amount of boilerplate.

**Quick example:**

```java
public void setInterval(int low, int high) {
    if (low > high) throw new IllegalArgumentException(low + " > " + high);
    this.low = low;
    this.high = high;
}
```

---

## Item 50: Make defensive copies when needed

**Summary paragraph:** If a class has mutable parameters or returns mutable internal state, defensively copy so that the class’s invariants cannot be broken by the caller. Copy on the way in (constructor/setter) and on the way out (getter) so that the class never holds or exposes a reference the caller can mutate.

**Context:** Callers can retain references to objects they pass in or receive. If you store a reference to a mutable parameter, the caller can change it later and corrupt your object. If you return a reference to internal mutable state, the caller can change your object’s state.

**Why it matters:** Without defensive copying, your object’s invariants can be violated from outside. Dates, collections, and arrays are common culprits. Defensive copy ensures the object is in full control of its state.

**What to do:** For every mutable parameter (Date, collection, array, etc.), copy it before storing (e.g. new Date(date.getTime()), List.copyOf(list)). For getters that return mutable fields, return a copy (or an unmodifiable view). Document that the returned value is a copy. For internal use between trusted code, copying can be omitted for performance if documented.

**Pitfalls / exceptions:** Defensive copy can be expensive for large structures; consider immutable types (LocalDateTime, List.of) or unmodifiable views when that’s sufficient. Don’t use clone() for defensive copy when the type is not final (clone can be overridden). For arrays, copy the array and optionally the elements if they’re mutable.

**Pros and cons:** Pros: invariants preserved, safe API. Cons: cost of copying; use immutables when possible to avoid copy.

**Quick example:**

```java
public Period(Date start, Date end) {
    this.start = new Date(start.getTime());
    this.end = new Date(end.getTime());
}
public Date getStart() { return new Date(start.getTime()); }
```

---

## Item 51: Design method signatures carefully

**Summary paragraph:** Choose clear, consistent method names; avoid long parameter lists (use builder, helper type, or split methods); prefer interfaces to classes for parameters; use two-parameter enum types instead of boolean when the meaning isn’t obvious. Good names and short parameter lists make APIs easier to use and remember.

**Context:** Method names and parameter lists are the primary way callers interact with your API. Long lists are hard to get right (order, optional params); boolean parameters are often unclear (what does true mean?). Interfaces as parameter types allow more flexibility than concrete classes.

**Why it matters:** Poor names cause confusion and misuse. Long parameter lists lead to errors and are hard to evolve. Boolean parameters need documentation; enums or two-method variants can be self-documenting.

**What to do:** Name methods to match naming conventions (e.g. get/set/is for accessors) and to be consistent with the rest of the API. Keep parameter count low (four or fewer); use builder, parameter object, or overloads for more. Prefer Map over Hashtable, etc. Use enum or split methods instead of a boolean when the meaning isn’t obvious (e.g. warmup(true) vs warmupForPlayback()).

**Pitfalls / exceptions:** Don’t abbreviate names unless the abbreviation is standard (e.g. max, min). When adding parameters, avoid long lists of the same type (easy to swap by mistake). Consider method object (extract method to a class that takes parameters in constructor) for very complex methods.

**Pros and cons:** Pros of good design: easier to use, fewer bugs. Cons of long lists/booleans: confusion, errors.

**Quick example:**

```java
// Prefer
public enum TemperatureScale { FAHRENHEIT, CELSIUS }
void setTemperature(double value, TemperatureScale scale);

// Over
void setTemperature(double value, boolean fahrenheit);
```

---

## Item 52: Use overloading judiciously

**Summary paragraph:** Overloading is resolved at compile time based on static types; overriding is resolved at runtime. Avoid overloading with the same number of parameters of similar types (e.g. multiple Object or functional interface parameters); it confuses which overload is chosen. Prefer distinct names or a single method with a parameter object when overloads would be ambiguous or confusing.

**Context:** Overloading lets you provide multiple methods with the same name but different parameter lists. The choice of which overload to call is made by the compiler using the static types of the arguments. So removing or adding autoboxing, or passing null, can change which overload is selected in surprising ways.

**Why it matters:** Overloads with similar parameter types (e.g. int and Integer, or two functional interfaces) can make calls ambiguous or select the “wrong” overload. The remedy is often to give methods different names (e.g. writeInt, writeLong) or to avoid such overloads.

**What to do:** Avoid overloading methods with the same number of parameters when types are “similar” (e.g. primitive and boxed, or two different functional interfaces). Use distinct names instead (e.g. valueOfPrimitive vs valueOf). If you do overload, ensure the overloads are clearly distinguishable. Constructors can’t have different names—use static factories with different names, or avoid ambiguous constructor overloads.

**Pitfalls / exceptions:** Varargs can make overloading worse (many overloads with Object...). When using lambdas, overloads that take different functional interface types can be ambiguous; fix by casting or using different names. Don’t add overloads that only add optional parameters if it makes existing call sites ambiguous.

**Pros and cons:** Pros of clear overloads: convenience. Cons of ambiguous overloads: subtle bugs, confusion.

**Quick example:**

```java
// Confusing: which overload?
public void run(Executor e) {}
public void run(Runnable r) {}
run(() -> {});  // ambiguous

// Clearer: different names
public void runWith(Runnable r) {}
public void runOn(Executor e) {}
```

---

## Item 53: Use varargs judiciously

**Summary paragraph:** Varargs (Type... args) are convenient for methods that take zero or more arguments of a type. Use them when the method truly accepts a variable number of arguments. For performance-critical code that accepts 0–3 arguments, consider overloads for 0, 1, 2, 3 and then varargs to avoid array allocation. Don’t use varargs for parameters that aren’t logically “variable.”

**Context:** Varargs creates an array of the arguments. It’s flexible but can hide performance cost (array creation) and misuse (e.g. passing an array where you meant multiple args). When you need at least one argument, validate and document.

**Why it matters:** Varargs simplifies call sites (no explicit array). But it can encourage bad APIs (e.g. mixing optional and required in one list). Performance: every call allocates an array unless you provide fixed-arity overloads.

**What to do:** Use varargs when the method is a true “zero or more” API (e.g. printf, List.of). If you need at least one argument, check the array length at the start and throw if length == 0. For hot paths with 0–3 args, provide overloads that take 0, 1, 2, 3 parameters and delegate to a single method that takes the array; this avoids array allocation for the common cases.

**Pitfalls / exceptions:** Don’t use varargs for a single array parameter; that’s confusing (caller might pass multiple args or one array). With generic varargs, see Item 32 (SafeVarargs, heap pollution). Return type should not be varargs.

**Pros and cons:** Pros: flexible, convenient. Cons: array allocation; can be misused. Fixed-arity overloads reduce cost for common cases.

**Quick example:**

```java
public void foo(int a1) { foo(new int[] { a1 }); }
public void foo(int a1, int a2) { foo(new int[] { a1, a2 }); }
public void foo(int... args) { ... }
```
