---
title: 4. Classes and Interfaces
sidebar_position: 5
---

# 4. Classes and Interfaces

## Chapter overview

This chapter covers how to design classes and interfaces for clarity, encapsulation, and maintainability: minimize accessibility, prefer accessors to public fields, minimize mutability, favor composition over inheritance, design and document for inheritance or prohibit it, prefer interfaces to abstract classes, use skeletal implementations, understand default methods, document for inheritance, and design type hierarchies carefully. These practices reduce bugs and make APIs easier to evolve.

---

## Item 15: Minimize the accessibility of classes and members

**Summary paragraph:** Make every class and member as inaccessible as possible while still allowing the software to work. Use the lowest access level that makes sense (private, package-private, protected, public). Encapsulation hides implementation details and reduces coupling.

**Context:** Public APIs are forever: changing them can break clients. The more you expose (classes, methods, fields), the more you commit to. Package-private and private allow you to change implementation without affecting clients. Protected is part of the exported API for subclasses and should be used sparingly.

**Why it matters:** Good encapsulation allows independent development, testing, and optimization. It reduces maintenance cost and makes reasoning and debugging easier. Public mutable state gives up the ability to enforce invariants and change representation.

**What to do:** Start with private for members. Use package-private for internal implementation. Use protected only when subclasses (in your control or documented) need it. Make classes package-private unless they are part of the API. Instance fields of public classes should rarely be public; if they are public static final, they must not refer to mutable objects (or expose internal mutable state). Prefer accessors over public fields.

**Pitfalls / exceptions:** Overridden methods cannot reduce accessibility. Opening for testing is sometimes acceptable (e.g. package-private instead of private) but don’t go beyond what tests need. In Java 9+, modules can hide public types in unexported packages.

**Pros and cons:** Pros: flexibility to change implementation, fewer dependencies, clearer API. Cons: sometimes more boilerplate (accessors); protected commits to a contract for subclasses.

**Quick example:** Keep fields private; expose through getters. Use package-private for helper classes used only inside the package.

---

## Item 16: In public classes, use accessor methods, not public fields

**Summary paragraph:** For public classes, do not expose fields as public. Use private fields and provide accessor (getter) and mutator (setter) methods as needed. Public fields give up encapsulation: you cannot change representation, enforce invariants, or add side effects later.

**Context:** Degenerate “data” classes with only public fields are simple but dangerous once the class is public. Any client can read and modify the fields; you cannot add validation, change the data structure, or maintain invariants.

**Why it matters:** With accessors you can later add validation, lazy computation, or different storage. With public fields you are stuck. Some JDK classes (e.g. Point, Dimension) violate this rule and are widely considered mistakes.

**What to do:** For public classes, make fields private and provide getters (and setters only if the class is mutable). For package-private or private nested classes, public fields are less harmful but still reduce flexibility.

**Pitfalls / exceptions:** If a class is package-private or private and used only internally, public fields are a trade-off between simplicity and future flexibility. Never expose mutable fields (e.g. arrays, collections) as public static final—clients can modify them.

**Pros and cons:** Pros of accessors: encapsulation, evolution, invariants. Cons: more code. Pros of public fields: less code, only for internal or degenerate internal types.

**Quick example:**

```java
// Bad
public class Point { public double x; public double y; }

// Good
public class Point {
    private double x;
    private double y;
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
}
```

---

## Item 17: Minimize mutability

**Summary paragraph:** Prefer immutable classes: no methods that change state after construction. Immutability simplifies reasoning, makes instances thread-safe and shareable, and enables safe reuse (e.g. as keys). If a class can’t be fully immutable, limit mutability as much as possible.

**Context:** Mutable objects can be changed by any code that holds a reference; tracking who changed what is hard. Immutable objects (e.g. String, BigInteger) have a single state and no side effects from “modification”—you get new instances instead.

**Why it matters:** Immutable objects are thread-safe without synchronization, can be shared freely, make good map keys and set elements, and avoid temporal coupling. The main cost is that every “change” can require a new object; for some types (e.g. large values) companion mutable builders help.

**What to do:** Don’t provide mutators. Make the class final (or use other means to prevent subclassing). Make all fields final and private. Ensure exclusive access to any mutable components (defensive copy in and out). If the class can’t be immutable, make fields final where possible and limit mutators.

**Pitfalls / exceptions:** Constructors should establish all invariants. Lazy initialization is acceptable for immutable objects if you need to defer computation. If you need mutable companions (e.g. StringBuilder for String), provide them explicitly. Some classes (e.g. CountDownLatch) are not immutable but have carefully constrained mutability.

**Pros and cons:** Pros: simplicity, thread-safety, shareability, good as keys. Cons: a new object per distinct value; use builders or mutable companions when that’s expensive.

**Quick example:**

```java
public final class Complex {
    private final double re;
    private final double im;
    public Complex(double re, double im) { this.re = re; this.im = im; }
    public Complex plus(Complex c) {
        return new Complex(re + c.re, im + c.im);
    }
}
```

---

## Item 18: Favor composition over inheritance

**Summary paragraph:** Inheritance (extending a concrete class) is fragile: the subclass depends on the superclass’s implementation, which can change in new releases and break the subclass. Prefer composition—holding an instance of the other class and forwarding calls—so your class doesn’t depend on the other’s internals.

**Context:** Inheritance propagates all public and protected behavior; overrides can break if the superclass changes its implementation or adds new methods. The “is-a” relationship must hold and the superclass must be designed for extension. Many uses of inheritance (e.g. Stack extends Vector) are inappropriate.

**Why it matters:** Composition and forwarding (wrapper/decorator) are more robust: you depend only on the other type’s interface, not its implementation. You can swap implementations and don’t suffer from fragile base class evolution.

**What to do:** Instead of extending a concrete class, give your class a private field of that type and forward method calls to it. Expose only the methods you need. Use interfaces for the composed type when possible. Reserve inheritance for true “is-a” relationships and when the superclass is designed and documented for inheritance.

**Pitfalls / exceptions:** Wrappers are not suited to callback frameworks where the wrapped object holds a reference to “this” (the wrapper can be eluded). There is a small performance and memory cost. When inheritance is appropriate (e.g. abstract classes, interfaces with skeletal implementations), use it.

**Pros and cons:** Pros of composition: robustness, flexibility, no fragile base class. Cons: more forwarding code; not ideal for callbacks. Pros of inheritance: less code when the superclass is designed for it.

**Quick example:**

```java
public class InstrumentedSet<E> extends ForwardingSet<E> {
    private final Set<E> set;
    public InstrumentedSet(Set<E> set) { this.set = set; }
    @Override protected Set<E> delegate() { return set; }
    @Override public boolean add(E e) { ...; return set.add(e); }
}
```

---

## Item 19: Design and document for inheritance or else prohibit it

**Summary paragraph:** If a class might be subclassed, you must design and document it for safe inheritance: document self-use of overridable methods, avoid invoking overridable methods from constructors, and consider providing hooks. Otherwise, prohibit subclassing (final class or private constructors plus static factories).

**Context:** Subclassing can break when the superclass invokes overridable methods (including in constructors), when it adds new methods that conflict with subclass behavior, or when its contract doesn’t specify how overridable methods are used. Designing for inheritance is hard and constrains the class.

**Why it matters:** Without design and documentation for inheritance, subclasses can break with superclass changes. Constructors that call overridable methods can run with incompletely initialized subclass state. Cloneable and Serializable add more complexity for subclasses.

**What to do:** Document every self-use of overridable methods (when they are called and how). Constructors must not call overridable methods. Prefer providing protected hooks rather than making whole methods overridable. If you don’t design for inheritance, prohibit it: make the class final or use private constructors and static factories. Test inheritance by writing subclasses before release.

**Pitfalls / exceptions:** Abstract classes and skeletal implementations are designed for extension. For other classes, the safe default is to prohibit subclassing unless you explicitly design and document for it.

**Pros and cons:** Pros of designing for inheritance: enables safe extension. Cons: more work, documents implementation details. Pros of prohibiting: simplicity, freedom to change. Cons: no subclassing.

**Quick example:** Document: “This method calls overridable method foo(). Subclasses may override foo() to customize behavior.” Avoid: calling an overridable method from a constructor.

---

## Item 20: Prefer interfaces to abstract classes

**Summary paragraph:** Prefer defining types with interfaces rather than abstract classes. Existing classes can implement new interfaces without changing the hierarchy; interfaces enable mixins and nonhierarchical type frameworks; and interfaces allow functionality enhancement via wrappers.

**Context:** Java allows single inheritance, so a class can have only one abstract superclass. Interfaces allow multiple types (multiple interfaces). Adding a new interface doesn’t force changes to existing classes; adding a new abstract class often does.

**Why it matters:** Interfaces give more flexibility for evolution and reuse. They support mixins (e.g. Comparable), nonhierarchical designs, and default methods (Java 8+). Abstract classes are still useful for skeletal implementations and when you want to share substantial code.

**What to do:** Prefer interfaces for defining types. Use abstract classes when you want to share code among implementations (then provide an abstract class that implements the interface—skeletal implementation). Consider default methods for interface evolution. Use interfaces for mixins (e.g. Comparable).

**Pitfalls / exceptions:** Interfaces cannot have instance fields or non-public members (except in Java 9+ private interface methods). When you need to share significant implementation, an abstract skeletal class implementing the interface is the pattern. Document whether an interface is meant for implementation only by the package.

**Pros and cons:** Pros of interfaces: flexibility, mixins, no single-inheritance limit. Cons: no shared code. Pros of abstract classes: shared code, partial implementation. Cons: single inheritance only.

**Quick example:**

```java
public interface Singer { void sing(); }
public interface Songwriter { void compose(); }
public interface SingerSongwriter extends Singer, Songwriter { }
```

---

## Item 21: Design interfaces for posterity

**Summary paragraph:** In Java 8+, you can add default methods to interfaces to evolve them, but default methods can break existing implementations if not designed carefully. Add new default methods only when the default behavior is correct for all existing implementations, and document the contract.

**Context:** Before Java 8, adding a method to an interface broke all existing implementations. Default methods allow adding methods with implementation, but if the default is wrong for some implementors, they can break at runtime or behave incorrectly.

**Why it matters:** Poorly chosen defaults can break existing classes that implement the interface. You must avoid defaults that assume something not guaranteed by the interface (e.g. thread safety, null handling) unless the interface documents it.

**What to do:** Avoid adding default methods to existing interfaces if possible; prefer new interfaces or extension interfaces. When you do add defaults, ensure the default is correct for all known implementations. Document the contract. Consider that existing implementations may not override the new method and will get the default.

**Pitfalls / exceptions:** Default methods cannot assume state (no instance fields). They can’t add behavior that depends on implementation details. If in doubt, don’t add a default; require implementors to provide the method.

**Pros and cons:** Pros: interface evolution without breaking binaries. Cons: risk of breaking or confusing existing implementations.

**Quick example:** Adding `default void forEach(Consumer<? super T> action)` to Iterable was done with a default that delegates to the existing iterator; all implementations get correct behavior.

---

## Item 22: Use interfaces only to define types

**Summary paragraph:** Use interfaces to define a type used by clients—a set of methods that define a contract. Do not use interfaces solely to hold constants (constant interface pattern); that pollutes implementing classes and leaks implementation detail. Use static utility classes or enums for constants.

**Context:** Some older code uses interfaces full of constants so that classes can implement the interface and refer to constants without qualification. This is an anti-pattern: the interface doesn’t represent a type, and every implementing class “inherits” those constants in its API.

**Why it matters:** Constant interfaces pollute the API of implementing classes, don’t represent a capability, and commit to binary compatibility for constants. Constants are implementation details and should be in utility classes or enums.

**What to do:** Define interfaces that represent types (capabilities). Put constants in a noninstantiable utility class (private constructor) or in an enum. If constants are strongly tied to a type, they can be in that type or its package.

**Pitfalls / exceptions:** Implementing an interface should mean “is-a” for that type. If you need to export constants to many classes, use a static import of a utility class or enum.

**Pros and cons:** Pros of type-only interfaces: clear contract. Cons of constant interfaces: API pollution, no real type meaning.

**Quick example:**

```java
// Bad: constant interface
public interface PhysicalConstants { double AVOGADRO = 6.022; }

// Good: utility class
public class PhysicalConstants {
    private PhysicalConstants() {}
    public static final double AVOGADRO_NUMBER = 6.022e23;
}
```

---

## Item 23: Prefer class hierarchies to tagged classes

**Summary paragraph:** A “tagged class” has a tag field (e.g. shape kind) and switches on it to behave like different types. This is verbose, error-prone, and wastes space. Replace it with a class hierarchy: an abstract class or interface and subclasses for each variant.

**Context:** Tagged classes emulate sum types with a single class and a tag. They mix multiple abstractions in one class, add boilerplate (switch on tag), and make it easy to forget cases or add new ones incorrectly.

**Why it matters:** Class hierarchies make each variant a real type, allow the type system to enforce exhaustiveness, and keep code for each variant separate. They are easier to extend and maintain.

**What to do:** Define an abstract class or interface for the type. Create a subclass (or implementation) for each former tag value. Move fields and behavior that belong only to a variant into that subclass. Use polymorphism instead of switch on tag.

**Pitfalls / exceptions:** If you have a fixed, small set of variants and they share a lot of code, consider an enum or sealed hierarchy (when available) instead of many small classes.

**Pros and cons:** Pros of hierarchy: type safety, clarity, extensibility. Cons of tagged: mess, no type-level exhaustiveness.

**Quick example:** Replace `class Figure { enum Type { RECT, CIRCLE } Type type; double length; double radius; }` with `abstract class Figure` and `class Rectangle extends Figure`, `class Circle extends Figure`.

---

## Item 24: Favor static member classes over nonstatic

**Summary paragraph:** A nested class should be static unless it needs access to the enclosing instance’s fields/methods. Nonstatic (inner) member classes hold a hidden reference to the enclosing instance and are more expensive; static member classes are simpler and don’t retain that reference.

**Context:** There are four kinds of nested classes: static member, nonstatic member, anonymous, and local. Nonstatic member classes are tied to an enclosing instance; static member classes are not. Using nonstatic when you don’t need the enclosing reference wastes space and can cause retention of the outer object.

**Why it matters:** Nonstatic member classes retain a reference to the enclosing object, which can prevent GC and cause memory leaks if the inner instance outlives the outer. Static member classes are independent and don’t have this cost.

**What to do:** Make a nested class static unless it must access enclosing instance members. If the nested class is used only from within one method, consider making it a local class or anonymous class. Use static for helper classes that don’t need the enclosing instance.

**Pitfalls / exceptions:** Anonymous and local classes are never static (they’re always in a method and can capture the enclosing instance). For adapters (e.g. Map.Entry implementations), nonstatic is sometimes used to refer to the map entry’s map; otherwise prefer static.

**Pros and cons:** Pros of static: no hidden reference, less memory, clearer. Pros of nonstatic: direct access to enclosing instance when needed.

**Quick example:**

```java
public class Outer {
    static class StaticNested { }  // Prefer when no need for Outer.this
    class Inner { }               // Use only when need to access Outer instance
}
```

---

## Item 25: Limit source files to a single top-level class

**Summary paragraph:** Never put multiple top-level classes (or interfaces) in a single source file. At most one top-level type per file; if you need multiple types in one file, make the others static member classes of the primary one. This avoids ordering-dependent compilation and confusion.

**Context:** Java allows multiple top-level types in one file, but the compiler may not find a type if it’s defined in a file named after a different type. This leads to fragile, order-dependent builds and confusion about which file defines what.

**Why it matters:** One type per file keeps the mapping from type name to file predictable and avoids subtle compilation errors. It also aligns with how most tools and developers expect to navigate code.

**What to do:** Put exactly one top-level public type in each source file; the file name must match that type. If you have additional related types (e.g. small helpers), make them package-private or private static member classes in the same file or in a file named after the primary type—but avoid multiple top-level types in one file.

**Pitfalls / exceptions:** Some styles allow one public top-level type and additional package-private top-level types in the same file; the file is named after the public type. Even then, clarity is better with one top-level type per file.

**Pros and cons:** Pros: predictable compilation, clear structure. Cons: more files if you have many small types (mitigate with member classes).

**Quick example:** File `Foo.java` contains only `public class Foo { ... }`. Helper type `FooHelper` is either in `Foo.java` as a static member class or in `FooHelper.java` if it’s top-level.
