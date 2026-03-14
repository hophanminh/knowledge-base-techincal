---
title: 6. Enums and Annotations
sidebar_position: 7
---

# 6. Enums and Annotations

## Chapter overview

This chapter covers best use of enums and annotations: prefer enums over int constants, add behavior to enums with instance fields and methods, use enum-based strategies, prefer interfaces to extending Enum, use annotations instead of naming patterns, and understand when to use marker interfaces. Enums and annotations make intent clear and catch errors at compile time.

---

## Item 34: Use enums instead of int constants

**Summary paragraph:** Replace int (or String) constants with enum types. Enums are type-safe, provide namespaces, allow behavior and fields, implement interfaces, and work well with switch and collections. They avoid magic numbers and typo-prone strings.

**Context:** Old-style constants (public static final int APPLE = 0, ORANGE = 1) have no type safety, no namespace, and no behavior. Enums give a real type, compile-time checking, and the ability to add methods and state.

**Why it matters:** Int constants can be compared to unrelated constants; strings can be typo’d. Enums restrict values to the declared constants and make code self-documenting. You can add methods (e.g. for formatting or mapping) and implement interfaces.

**What to do:** Define an enum for each set of related constants. Use it in method parameters and return types instead of int or String. Add instance fields and methods as needed. Use EnumSet and EnumMap for sets and maps of enum constants.

**Pitfalls / exceptions:** When you need constant-specific behavior, use constant-specific method implementations (Item 34 in the book: instance methods that each constant overrides) or switch on the enum. For binary compatibility with existing int-based APIs, you may need an int code and a fromCode method.

**Pros and cons:** Pros: type safety, clarity, behavior, EnumSet/EnumMap. Cons: slightly more verbose than int constants; can’t extend enum (no subclasses).

**Quick example:**

```java
public enum Planet {
    MERCURY(3.302e+23, 2.439e6),
    VENUS(4.869e+24, 6.052e6);
    private final double mass;
    private final double radius;
    Planet(double mass, double radius) { this.mass = mass; this.radius = radius; }
}
```

---

## Item 35: Use instance fields instead of ordinals

**Summary paragraph:** Do not use the ordinal() of an enum constant to derive a value (e.g. an int code). Ordinals are tied to declaration order and break when you reorder or insert constants. Store the value in an instance field instead.

**Context:** Enum provides ordinal() (0-based index). Using it for anything other than low-level EnumSet/EnumMap implementation is fragile: reordering or adding constants changes ordinals.

**Why it matters:** Ordinals are an implementation detail. If you use them for persistence or protocol, reordering the enum breaks compatibility. Instance fields are explicit and stable.

**What to do:** Add a final instance field for any value you need (e.g. int code, string abbreviation). Set it in the constructor. Provide an accessor. Use that field everywhere instead of ordinal().

**Pitfalls / exceptions:** Never use ordinal() for anything you persist or expose in an API. The only acceptable use is inside the enum implementation (e.g. EnumSet) where declaration order is the contract.

**Pros and cons:** Pros of instance fields: stable, explicit, clear. Cons of ordinals: fragile, undocumented.

**Quick example:**

```java
public enum Ensemble {
    SOLO(1), DUET(2), TRIO(3);
    private final int numberOfMusicians;
    Ensemble(int size) { this.numberOfMusicians = size; }
    public int numberOfMusicians() { return numberOfMusicians; }
}
```

---

## Item 36: Use EnumSet instead of bit fields

**Summary paragraph:** When you need a set of enum constants (e.g. styles: BOLD, ITALIC), use EnumSet rather than an int bit field. EnumSet is type-safe, readable, and efficient (backed by bit vectors when appropriate).

**Context:** C-style bit fields (int with bits for each style) work but are int-based and error-prone. `EnumSet<Style>` expresses “set of Style” directly and uses bit-level representation internally when the enum is small enough.

**Why it matters:** EnumSet gives type safety (can’t mix enums), clear APIs (add/remove/contains), and good performance. Bit fields require manual masking and have no type safety.

**What to do:** Use `EnumSet<YourEnum>` for sets of enum constants. Use EnumSet.of(...) or add/remove for mutation. For immutable sets, use Set.copyOf(enumSet) or EnumSet.noneOf/range as needed. Don’t use int with bit masks for enum sets.

**Pitfalls / exceptions:** EnumSet is not serializable in the same way as HashSet; use a serialization proxy or accept the default. For very small sets, of() is clear; for ranges, range() is convenient.

**Pros and cons:** Pros: type-safe, readable, efficient. Cons: none for enum sets.

**Quick example:**

```java
public enum Style { BOLD, ITALIC, UNDERLINE }
Set<Style> styles = EnumSet.of(Style.BOLD, Style.ITALIC);
```

---

## Item 37: Use EnumMap instead of ordinal indexing

**Summary paragraph:** When you key by enum, use EnumMap rather than an array indexed by ordinal() or a HashMap. EnumMap is efficient and avoids ordinal-indexing bugs. Use EnumMap&lt;K, V&gt; for enum keys.

**Context:** Arrays indexed by enum.ordinal() are error-prone (wrong order, unchecked casts). HashMap works but is heavier. EnumMap is designed for enum keys and is both efficient and clear.

**Why it matters:** Ordinal indexing ties layout to enum order and is easy to break. EnumMap keeps the key type explicit and doesn’t depend on ordinals. Performance is good (array-based internally).

**What to do:** Use `EnumMap<YourEnum, ValueType>` whenever the key is an enum. Populate and use like any Map. For nested structures (e.g. map from enum to another map), use `EnumMap<Phase, EnumMap<Phase, Transition>>` or similar.

**Pitfalls / exceptions:** Don’t use arrays indexed by ordinal(); use EnumMap. If you need multiple keys (e.g. enum + something else), use `Map<Enum, ...>` or a composite key; EnumMap is for a single enum key.

**Pros and cons:** Pros: type-safe, efficient, no ordinal bugs. Cons: only for enum keys.

**Quick example:**

```java
Map<Phase, EnumMap<Phase, String>> transition = new EnumMap<>(Phase.class);
```

---

## Item 38: Emulate extensible enums with interfaces

**Summary paragraph:** Enums cannot extend other enums. When you need extensible “enum-like” types (e.g. multiple enum types that implement a common interface), define an interface and have each enum implement it. Use the interface in APIs so new enums can be added without changing existing code.

**Context:** Sometimes you have multiple sets of constants that share a contract (e.g. operations, strategies). You can’t have enum A and enum B extend a common enum, but both can implement an interface.

**Why it matters:** Lets you write code that operates on “any enum of this kind” and add new enums (e.g. new operations) without modifying existing enums. Type-safe and consistent with enum use.

**What to do:** Define an interface (e.g. Operation) with the shared behavior. Each enum implements the interface and provides its constants. APIs take the interface type. For enum-specific behavior, use the interface and dispatch (or double dispatch) as needed.

**Pitfalls / exceptions:** You can’t add enum constants from another package; “extensibility” is by adding new enum types that implement the interface, not new constants to one enum. Switch on enum type if you need to handle each implementing enum differently.

**Pros and cons:** Pros: extensible set of enum-like types, type-safe. Cons: no shared enum namespace across types.

**Quick example:**

```java
public interface Operation {
    double apply(double x, double y);
}
public enum BasicOperation implements Operation {
    PLUS("+") { public double apply(double x, double y) { return x + y; } },
    MINUS("-") { public double apply(double x, double y) { return x - y; } };
    private final String symbol;
    BasicOperation(String symbol) { this.symbol = symbol; }
}
```

---

## Item 39: Prefer annotations to naming patterns

**Summary paragraph:** Use annotations to mark program elements (e.g. tests, dependencies) instead of naming conventions (e.g. methods must start with “test”). Annotations are type-safe, composable, and enforced by tools. Naming patterns are error-prone and not checked by the compiler.

**Context:** Historically, frameworks used naming (e.g. test* for JUnit 3) or external files to find elements. Annotations (e.g. @Test) attach metadata to elements and can be processed by the compiler and tools.

**Why it matters:** Naming patterns lead to typos (tset instead of test), no compile-time checking, and no support for parameters. Annotations are checked, can have attributes, and are the standard for metadata in Java.

**What to do:** Define an annotation type (@interface) when you need to mark elements. Use @Retention (usually RUNTIME or CLASS) and @Target. Use annotations in your APIs and in tests. Process them with reflection or annotation processors. Prefer annotations over naming or external config for in-code metadata.

**Pitfalls / exceptions:** Annotations don’t change behavior by themselves; you need a runner or processor. Keep annotation types simple (no heavy logic). Document retention and target.

**Pros and cons:** Pros: type-safe, composable, tool-friendly. Cons: need to define and process. Cons of naming: no checking, fragile.

**Quick example:**

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {}
```

---

## Item 40: Consistently use the Override annotation

**Summary paragraph:** Use the @Override annotation on every method that you believe overrides a superclass or interface method. The compiler will catch typos, wrong signatures, or accidental overloading so you don’t break the contract.

**Context:** If you misspell a method name or change a parameter type, you might accidentally add a new method instead of overriding. The compiler doesn’t assume you meant to override; @Override makes the intent explicit and triggers an error if no override exists.

**Why it matters:** Catches mistakes at compile time. Without @Override, a typo can leave you with a new method and broken polymorphism. With @Override, the compiler enforces that the method actually overrides something.

**What to do:** Add @Override to every overriding method (and to every method that implements an interface method in Java 6+). Don’t add it when you’re overloading (same name, different params); the compiler will error, reminding you to fix.

**Pitfalls / exceptions:** Abstract methods that implement an interface don’t need @Override for correctness but it’s still good for documentation. In Java 5, @Override only applied to class overrides, not interface implementation; from Java 6 on it applies to both.

**Pros and cons:** Pros: catches errors, documents intent. Cons: none.

**Quick example:**

```java
@Override
public boolean equals(Object o) { ... }
@Override
public int hashCode() { ... }
```

---

## Item 41: Use marker interfaces to define types that are implemented by instances of the class

**Summary paragraph:** A marker interface has no methods and only marks a type (e.g. Serializable). Prefer marker interfaces over marker annotations when you need a type that can be used in type boundaries (e.g. “only accept Serializable”). Use marker annotations when you only need to mark elements for tool processing and don’t need a type.

**Context:** Marker interfaces (e.g. Serializable) and marker annotations (e.g. @Entity) both convey “this has a property” with no behavior. Interfaces contribute a type; annotations don’t. So you can write “void write(Serializable o)” but not a type for “things with @Entity”.

**Why it matters:** If you need to restrict a parameter or return type to “things that are X”, a marker interface gives you that type. Marker annotations are better when you’re only marking for a tool (e.g. persistence, testing) and don’t need the type in method signatures.

**What to do:** Use a marker interface when the marker should be a type (e.g. only accept instances that are Serializable). Use a marker annotation when you’re marking for processors and don’t need a type. You can combine both (e.g. interface + annotation) if you have a type and also want to add attributes later.

**Pitfalls / exceptions:** Adding methods to a marker interface turns it into a normal interface and breaks “marker” semantics. Prefer annotations for new “marker” metadata unless you need the type.

**Pros and cons:** Pros of marker interface: type for bounds. Pros of marker annotation: can have elements, more flexible. Cons: marker interfaces can’t have attributes; marker annotations don’t add a type.

**Quick example:**

```java
public interface Serializable {}  // marker interface: adds type "Serializable"
```
