---
title: 5. Generics
sidebar_position: 6
---

# 5. Generics

## Chapter overview

Generics enable types and methods to be parameterized by type, improving type safety and eliminating many casts. This chapter covers: avoiding raw types, eliminating unchecked warnings, preferring lists over arrays, using generic methods and bounded type parameters, favoring generic types and methods, and using bounded wildcards and safe heterogeneous containers. Misuse of generics leads to unchecked warnings, ClassCastException, and inflexible APIs.

---

## Item 26: Don't use raw types

**Summary paragraph:** Always use parameterized types (e.g. `List<String>`) instead of raw types (e.g. `List`). Raw types lose type safety and exist mainly for compatibility with pre-generics code.

**Context:** Before generics, collections held Object and required casts. Raw types opt out of the generic type system; the compiler can’t check element types and you risk ClassCastException at runtime.

**Why it matters:** Raw types bypass type checking. You can insert the wrong type and only discover it at runtime. Parameterized types catch such errors at compile time.

**What to do:** Use `List<String>`, `Set<MyType>`, `Map<K,V>` instead of `List`, `Set`, `Map`. If you need to accept any type, use unbounded wildcards (e.g. `Set<?>`) or `List<?>` rather than raw `Set` or `List`. Use raw types only when you must interoperate with legacy code that doesn’t use generics.

**Pitfalls / exceptions:** You must use raw types for class literals (`List.class`, not `List<String>.class`), and sometimes when dealing with instanceof (use `o instanceof Set<?>` not `Set`). In those cases, use the raw type only where the language requires it.

**Pros and cons:** Pros of parameterized types: compile-time safety, clearer intent. Cons of raw types: no safety, legacy only.

**Quick example:**

```java
// Bad
Set set = new HashSet();

// Good
Set<Stamp> stamps = new HashSet<>();
```

---

## Item 27: Eliminate unchecked warnings

**Summary paragraph:** Fix every unchecked warning that you can. If you must suppress one, confine the suppression to the smallest scope and document why it’s safe.

**Context:** Unchecked warnings (e.g. unchecked conversion, unchecked cast) indicate that the compiler cannot verify type safety. Most can be fixed by adding proper type parameters or correcting the code; a few require a justified @SuppressWarnings.

**Why it matters:** Unchecked warnings can hide real ClassCastException risks. Fixing them improves type safety; suppressing without fixing can mask bugs.

**What to do:** First try to fix the cause (add type parameters, use correct generic types). If the code is provably safe but the compiler can’t prove it, add @SuppressWarnings("unchecked") on the smallest scope (variable or method), and add a comment explaining why it’s safe. Never suppress on a whole class without good reason.

**Pitfalls / exceptions:** Don’t suppress and forget; treat each suppression as a potential bug. When you suppress, the comment must justify safety (e.g. “list is only ever populated with String”).

**Pros and cons:** Pros of fixing: real type safety. Pros of narrow suppression + comment: documents known-safe cases. Cons of broad suppression: hides real problems.

**Quick example:**

```java
@SuppressWarnings("unchecked")  // set contains only String (validated at entry)
Set<String> set = (Set<String>) rawSet;
```

---

## Item 28: Prefer lists to arrays

**Summary paragraph:** Prefer `List<E>` (and other generic collections) over arrays. Arrays are covariant and reified; generics are invariant and erased. Mixing them causes compile errors and unchecked warnings; arrays don’t mix well with generic types.

**Context:** Arrays are covariant (Sub[] is a subtype of Super[]) and reified (runtime type exists). Generics are invariant (`List<Sub>` is not a subtype of `List<Super>`) and erased. So `List<String>[]` is illegal, and storing generics in arrays is unsafe.

**Why it matters:** Covariance of arrays allows runtime type errors (you can put wrong type in array). Generic types and arrays don’t mix: you can’t create arrays of parameterized types (e.g. `new List<String>[]`). Using lists avoids these issues.

**What to do:** Use List instead of array for public APIs and when you need type safety with generics. Use E[] internally only when you’re sure it’s safe and you’re willing to suppress warnings; often List is clearer. Prefer List for variable-length sequences.

**Pitfalls / exceptions:** When performance is critical and you’ve profiled, arrays can be faster for primitive or concrete types. Varargs are arrays, so they have the same generic limitations; use @SafeVarargs and don’t expose the array. When you must expose an array (e.g. for interoperability), document that clients must not modify it.

**Pros and cons:** Pros of lists: type-safe, flexible, no covariance bugs. Cons: slight overhead vs arrays. Pros of arrays: performance in hot loops, interoperability. Cons: covariance, no generic arrays.

**Quick example:**

```java
// Prefer
List<String> list = new ArrayList<>();

// Avoid mixing generics and arrays
// List<String>[] array = new List<String>[1];  // Illegal
```

---

## Item 29: Favor generic types

**Summary paragraph:** When you write a type that can be parameterized by another type (e.g. a stack of elements), make it generic from the start. Use type parameters (e.g. `Stack<E>`) so clients get type-safe APIs without casts.

**Context:** It’s easy to write a stack that holds Object and require casts when popping. Making the class generic (`Stack<E>`) lets the compiler enforce element type and eliminates casts.

**Why it matters:** Generic types provide type safety and better APIs. Converting a raw type to a generic type later can be disruptive; doing it up front is easier.

**What to do:** Add type parameters to classes that conceptually hold or operate on a type (e.g. Stack&lt;E&gt;, Map&lt;K,V&gt;). Use the type parameter in fields, method parameters, and return types. If you need to create arrays of the type parameter, use Object[] and cast (with suppression) or use `List<E>` internally.

**Pitfalls / exceptions:** You cannot create arrays of non-reifiable types (e.g. new E[]). Use Object[] and cast, or use List. For primitive-backed performance, consider exposing a primitive-specific API in addition to the generic one (e.g. IntStack).

**Pros and cons:** Pros: type safety, no casts, clearer API. Cons: can’t use E in array creation (use Object[] or List).

**Quick example:**

```java
public class Stack<E> {
    private E[] elements;
    public Stack() { elements = (E[]) new Object[16]; }
    public void push(E e) { ... }
    public E pop() { ... }
}
```

---

## Item 30: Favor generic methods

**Summary paragraph:** Make methods generic when they can operate on more than one type in a type-safe way. Static utility methods are good candidates (e.g. union of two sets, binary search). Generic methods keep the API flexible and type-safe.

**Context:** A method that works on any type (e.g. merging two sets) can be written to accept and return parameterized types. Without generics you’d use Object and casts; with generics the compiler infers types.

**Why it matters:** Generic methods provide the same benefits as generic types: type safety and elimination of casts. They also allow type inference so callers often don’t need to specify type parameters.

**What to do:** Add type parameters before the return type (e.g. `<E> Set<E> union(Set<E> s1, Set<E> s2)`). Use the type parameter in parameters and return type. Let the compiler infer type arguments when possible. For static utilities, this is the standard pattern.

**Pitfalls / exceptions:** Bounded type parameters (e.g. `<E extends Comparable<E>>`) when you need to call methods on the type. Recursive type bounds for more complex constraints.

**Pros and cons:** Pros: type-safe utilities, inference. Cons: slightly more complex signatures.

**Quick example:**

```java
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

---

## Item 31: Use bounded wildcards to increase API flexibility

**Summary paragraph:** Use bounded wildcards (e.g. `? extends T`, `? super T`) in method parameters to make APIs accept more types while remaining type-safe. PECS: producer extends, consumer super—use `extends` when you only read, `super` when you only write.

**Context:** Parameterized types are invariant: `List<String>` is not a subtype of `List<Object>`. So a method that takes `List<Object>` won’t accept `List<String>`. Bounded wildcards allow subtyping: `List<? extends Object>` can accept `List<String>`.

**Why it matters:** With only invariant types, APIs are too restrictive. Wildcards let you write methods that work on collections of any subtype (producer) or that accept comparisons with any supertype (consumer), improving flexibility without losing safety.

**What to do:** For types that produce (you read from them), use `? extends T`. For types that consume (you write to them), use `? super T`. Don’t use wildcards for both reading and writing in the same parameter. Use wildcards in return types only when it really helps the user (e.g. returning a collection that will only be read).

**Pitfalls / exceptions:** You can’t put anything (except null) into a `List<? extends T>`. You can’t get anything useful out of a `List<? super T>` except as Object. If a type is both producer and consumer, don’t use a wildcard for that parameter.

**Pros and cons:** Pros: more flexible, still type-safe APIs. Cons: wildcard types are harder to read and write.

**Quick example:**

```java
public void pushAll(Iterable<? extends E> src) {
    for (E e : src) push(e);
}
public void popAll(Collection<? super E> dst) {
    while (!isEmpty()) dst.add(pop());
}
```

---

## Item 32: Combine generics and varargs judiciously

**Summary paragraph:** Varargs and generics don’t mix cleanly: varargs creates an array, and generic arrays are problematic. Methods with generic varargs can generate confusing warnings. Use @SafeVarargs when the method doesn’t expose the array to the caller in an unsafe way, and avoid leaking the varargs array.

**Context:** Varargs is implemented by creating an array of the arguments. With a type like T..., that’s effectively T[], which is a generic array—something the language discourages. So you get unchecked warnings, and if the array escapes in an unsafe way, you get heap pollution.

**Why it matters:** Generic varargs can cause heap pollution (wrong type in the array at runtime) if the array is stored or passed somewhere that assumes a different type. Warnings can be confusing; @SafeVarargs documents that you’ve ensured safety.

**What to do:** Avoid mixing generics and varargs when you can (e.g. use List.of or overloads). When you do use generic varargs, ensure the method doesn’t store the array in a place where another thread or caller can see it with a wrong type, and doesn’t pass it to a method that expects a different parameterized type. Then annotate with @SafeVarargs and keep the comment. Prefer List-based APIs for variable-length parameter lists when possible.

**Pitfalls / exceptions:** @SafeVarargs is only for methods that don’t allow the varargs array to escape in an unsafe way. Don’t return the array or assign it to a static field of a generic type. Safe pattern: use the array only to pass elements to a generic collection or to another @SafeVarargs method.

**Pros and cons:** Pros of generic varargs: convenient. Cons: warnings, risk of heap pollution. Pros of List/overloads: no varargs issues. Cons: less convenient call sites.

**Quick example:**

```java
@SafeVarargs
static <T> List<T> flatten(List<? extends T>... lists) {
    List<T> result = new ArrayList<>();
    for (List<? extends T> list : lists) result.addAll(list);
    return result;
}
```

---

## Item 33: Consider typesafe heterogeneous containers

**Summary paragraph:** When you need a container that maps keys to values of different types (e.g. a type per “key”), use a Class object as the key and store values in a generic type like `Map<Class<?>, Object>`, with a type-safe put and get that use the Class to cast. This gives a typesafe heterogeneous container.

**Context:** Normal generics fix one type for the whole container (e.g. `Set<String>`). Sometimes you want one “map” that holds values of different types keyed by their Class (e.g. get(Integer.class) returns Integer). You can do this with Class as key and careful casting.

**Why it matters:** Allows type-safe storage and retrieval of multiple types in one container without losing type information. Useful for preferences, services, or registries keyed by type.

**What to do:** Use `Class<T>` as the key. In put, store `Class<T>` -> value. In get, take `Class<T>` and return T by casting the stored value to T. Ensure you only store values that match their key (e.g. value must be instance of key). For subtypes (e.g. Integer.class when key is Number.class), you need a different design (e.g. getSubtypeOrDefault).

**Pitfalls / exceptions:** Raw types used as keys (e.g. raw Class) can break type safety. You can’t use non-reifiable types (e.g. `List<String>.class` doesn’t exist). For parameterized type keys you need something like TypeLiteral or super type tokens.

**Pros and cons:** Pros: one container, many types, type-safe access. Cons: more complex, limited to reifiable types as keys.

**Quick example:**

```java
public class Favorites {
    private final Map<Class<?>, Object> map = new HashMap<>();
    public <T> void putFavorite(Class<T> type, T instance) {
        map.put(Objects.requireNonNull(type), type.cast(instance));
    }
    public <T> T getFavorite(Class<T> type) {
        return type.cast(map.get(type));
    }
}
```
