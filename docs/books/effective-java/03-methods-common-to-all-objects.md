---
title: 3. Methods Common to All Objects
sidebar_position: 4
---

# 3. Methods Common to All Objects

## Chapter overview

Object provides several methods that all classes inherit: `equals`, `hashCode`, `toString`, `clone`, and (via `Comparable`) `compareTo`. This chapter explains when and how to override them so that your classes behave correctly in collections, with sorting, and in everyday use. Violating the contracts of these methods leads to subtle bugs in hash-based collections, ordering, and debugging.

---

## Item 10: Obey the general contract when overriding equals

**Summary paragraph:** Override `equals` only when a class has a notion of logical equality distinct from object identity, and then satisfy the contract: reflexive, symmetric, transitive, consistent, and non-null (x.equals(null) is false). Violations break hash-based collections and assumptions other code makes about equality.

**Context:** The default `equals` is reference equality. For value-like classes (e.g. point, phone number, date), you want two instances to be equal if they represent the same value. If you override `equals` incorrectly, collections and other logic that depend on equality can misbehave.

**Why it matters:** `HashMap`, `HashSet`, and other code rely on the equals contract. Violating reflexivity, symmetry, or transitivity causes unpredictable behavior. Consistency (same result for same inputs) is required for stable behavior. Throwing on null or returning true for null breaks the contract.

**What to do:** Don’t override `equals` if each instance is inherently unique, or if there’s no need for logical equality, or if a superclass already has an appropriate `equals`. When you do override: use `==` for reference equality first; use `instanceof` for type check (and handle null); cast and compare significant fields. Prefer composition over inheritance when adding a value component to avoid breaking transitivity. Use IDE or `Objects.equals` for field comparisons.

**Pitfalls / exceptions:** Do not make `equals` depend on unreliable resources (e.g. network, `URL.equals`). Subclassing an instantiable class and adding a value component often breaks transitivity; composition avoids this. Overriding `equals` on enums is unnecessary (identity is enough).

**Pros and cons:** Pros: correct behavior in collections and APIs. Cons: must maintain the contract when fields or hierarchy change; performance matters for large or expensive comparisons.

**Quick example:**

```java
@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof PhoneNumber)) return false;
    PhoneNumber pn = (PhoneNumber) o;
    return areaCode == pn.areaCode && number == pn.number;
}
```

---

## Item 11: Always override hashCode when you override equals

**Summary paragraph:** If you override `equals`, you must override `hashCode` so that equal objects have equal hash codes. Otherwise hash-based collections (HashMap, HashSet, etc.) will not work correctly for your type.

**Context:** The contract for `hashCode` states: if `equals(o)` is true, then `hashCode()` must be the same for both objects. Consistency is also required (same object, same hash code while it is used in a collection). Object’s default hashCode is based on identity, so two equal-but-distinct objects can have different hash codes, breaking hash tables.

**Why it matters:** HashMap and HashSet use hashCode to choose buckets. If equal objects have different hash codes, they can end up in different buckets and the map/set will treat them as different, violating the expectation that equal objects are interchangeable in collections.

**What to do:** Override `hashCode` whenever you override `equals`. Include every “significant” field that you use in `equals` in the hash computation. Use a standard recipe: start with a nonzero constant, for each significant field compute an int (use `Objects.hashCode` for objects, handle primitives), combine with something like `31 * result + fieldHash`. Or use `Objects.hash(significantField1, significantField2, ...)`.

**Pitfalls / exceptions:** Do not exclude fields used in `equals` from hashCode. Do not change the hash computation in a way that varies between invocations (consistency contract). Caching hashCode is OK for immutable objects if you want to avoid recomputation.

**Pros and cons:** Pros: hash-based collections work correctly. Cons: must keep hashCode in sync with equals when fields change.

**Quick example:**

```java
@Override
public int hashCode() {
    return Objects.hash(areaCode, number);
}
```

---

## Item 12: Always override toString

**Summary paragraph:** Override `toString` to return a concise, informative representation of the object. It improves debugging, logging, and diagnostics; the default (class name + hex hash) is rarely useful.

**Context:** Object’s default `toString` returns something like `PhoneNumber@163b91`. When you print an object, use it in string concatenation, or see it in a debugger or log, that form is unhelpful. A good toString tells you the type and key state.

**Why it matters:** Logs and error messages often include object string representations. Easier debugging and clearer diagnostics. Document whether the format is fixed (parseable) or flexible; if fixed, consider providing a static factory or parser that accepts the same format.

**What to do:** Override `toString` in most non-enum, non-utility classes. Return a string that includes the important field values. Document whether the format is part of the API (stable and parseable) or for display only. Don’t expose sensitive data in toString.

**Pitfalls / exceptions:** Don’t override toString on enum types (they already have a good one). For utility classes (Item 4) there’s no instance to stringify. Once you document a specific format, changing it can break clients that parse it.

**Pros and cons:** Pros: better debugging and logging. Cons: if you promise a format, you must maintain it.

**Quick example:**

```java
@Override
public String toString() {
    return String.format("%03d-%03d-%04d", areaCode, prefix, lineNum);
}
```

---

## Item 13: Override clone judiciously

**Summary paragraph:** The `Cloneable` interface and `Object.clone()` are problematic: the contract is weak, clone is rarely the best way to copy, and it encourages shallow copies and fragile code. Prefer copy constructors or copy factories instead of implementing Cloneable and overriding clone.

**Context:** Cloneable was intended to allow copying objects. It has no methods; behavior is controlled by the presence of the interface and the overriding of `clone()`. The contract is underspecified (e.g. no guarantee that x.clone() != x or that x.clone().getClass() == x.getClass()), and clone is often implemented with shallow copies that require deep-copy logic and are error-prone.

**Why it matters:** Implementing Cloneable and clone correctly is tricky (especially with mutable fields and inheritance). Copy constructors and static factories (e.g. `copyOf`) are clearer and don’t depend on the clone mechanism. Many experts avoid clone altogether.

**What to do:** Prefer copy constructors (`public Y(Y y)`) or static copy factories (`Y.copyOf(Y y)`). If you must support clone, override it, make it public, call super.clone(), and fix mutable fields. For a class designed for inheritance, clone is especially difficult; document or avoid. Consider not implementing Cloneable at all.

**Pitfalls / exceptions:** If you do implement clone, be careful with final fields (they may need to be set in a different way). Clone can enable finalizer-like issues. Arrays use clone() idiomatically; that’s one of the few places it’s commonly used.

**Pros and cons:** Pros of copy constructor/factory: clear, flexible, no Cloneable baggage. Cons of clone: complex contract, shallow copy pitfalls, inheritance issues.

**Quick example:**

```java
// Prefer this
public static Y copyOf(Y y) { ... }

// Or
public Y(Y other) { ... }
```

---

## Item 14: Consider implementing Comparable

**Summary paragraph:** If your class has a natural ordering, implement `Comparable<T>` and override `compareTo` so that it’s consistent with equals and obeys the same kind of symmetry and transitivity. This enables sorting, searching, and use in ordered collections and algorithms.

**Context:** Many value types have a natural order (numbers, strings, dates). Implementing Comparable allows your type to be used with `Collections.sort`, `Arrays.sort`, TreeSet, TreeMap, and algorithms that depend on comparison. The contract for compareTo is similar to equals: symmetry (sign of a vs b is opposite of b vs a), transitivity, and optional consistency with equals.

**Why it matters:** Without Comparable, your type cannot be used in sorted collections or with generic algorithms that require ordering. Inconsistent compareTo (e.g. not aligned with equals) can confuse TreeSet/TreeMap and other code that assumes (compareTo == 0) implies equals.

**What to do:** Implement `Comparable<YourType>` and compare significant fields in order. Use `Integer.compare`, `Double.compare`, or `Comparator.comparing` instead of subtraction (overflow) or relational operators. Prefer consistency with equals: (compareTo == 0) should match equals. Document if you intentionally deviate.

**Pitfalls / exceptions:** Do not use `a - b` for int comparison (overflow). Do not use `<` or `>` for primitives; use the static compare methods. If compareTo is inconsistent with equals, document it; some collections (e.g. HashSet) use equals, others (TreeSet) use compareTo.

**Pros and cons:** Pros: interoperability with sort, search, TreeMap, TreeSet. Cons: must maintain contract; inconsistency with equals can cause subtle bugs.

**Quick example:**

```java
@Override
public int compareTo(PhoneNumber pn) {
    int result = Integer.compare(areaCode, pn.areaCode);
    if (result == 0) result = Integer.compare(number, pn.number);
    return result;
}
```
