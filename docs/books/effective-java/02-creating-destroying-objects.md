---
title: 2. Creating and Destroying Objects
sidebar_position: 3
---

# 2. Creating and Destroying Objects

## Chapter overview

This chapter covers when and how to create objects, when to avoid creating them, and how to ensure they are cleaned up properly. Topics include static factory methods, builders, singletons, noninstantiability, dependency injection, avoiding unnecessary or obsolete references, why to avoid finalizers and cleaners, and using try-with-resources. Applying these items leads to clearer APIs, better control over object lifecycle, and fewer bugs and leaks.

---

## Item 1: Consider static factory methods instead of constructors

**Summary paragraph:** Prefer providing a static method that returns an instance of the class instead of (or in addition to) a public constructor. This gives you control over what gets returned, allows descriptive names, and can reduce object creation when combined with caching.

**Context:** Clients normally create objects by calling constructors. Constructors have a fixed name (the class name), always create a new instance (no caching), and cannot return a subtype without the client depending on that subtype. Sometimes you want a named creation method, instance control (e.g. singletons), or to return a subtype based on arguments.

**Why it matters:** Better API clarity (named methods like `valueOf`, `of`, `getInstance`), instance control (singletons, flyweights, noninstantiability), ability to return any subtype, and less coupling when returning implementation types (e.g. `EnumSet` returning `RegularEnumSet` or `JumboEnumSet`).

**What to do:** For each way you want clients to obtain an instance, consider a public static factory method. Use conventional names: `from`, `of`, `valueOf`, `getInstance`, `newInstance`, `getType`, `newType`. Prefer static factories when the benefits (naming, caching, subtype return) matter; otherwise constructors are fine.

**Pitfalls / exceptions:** A class without public or protected constructors cannot be subclassed (which can be desirable). Static factories are not discoverable in the same way as constructors in Javadoc; listing common static factory names in the class doc helps. In Java 8+, interfaces can have static methods, so “companion” classes are less necessary for interface-based types.

**Pros and cons:** Pros: named creation, instance control, subtype return, less coupling. Cons: no subclassing if constructors are private, slightly less discoverable than constructors.

**Quick example:**

```java
public static Boolean valueOf(boolean b) {
    return b ? Boolean.TRUE : Boolean.FALSE;
}
```

---

## Item 2: Consider a builder when faced with many constructor parameters

**Summary paragraph:** When a class has many optional or required parameters, avoid telescoping constructors and the JavaBeans setter pattern; use a builder object that accumulates parameters and then constructs the target object in one go.

**Context:** Telescoping constructors (many overloads with different parameter sets) are hard to write and read. The JavaBeans pattern (no-arg constructor + setters) allows inconsistent state during construction and prevents immutability. Both scale poorly when parameters grow.

**Why it matters:** Builders yield readable, safe construction (required vs optional parameters are clear), support immutability, allow validity checks in one place, and work well with class hierarchies (abstract builder with covariant return types).

**What to do:** Define a static nested builder class. The builder has setter-like methods that return `this` for fluency, and a `build()` method that constructs and validates the target object. Make the target class’s constructor private or package-private and take the builder (or its fields). Use the builder in client code: `new Builder().a(1).b(2).build()`.

**Pitfalls / exceptions:** More boilerplate than a simple constructor. Overkill for a handful of parameters. When using with hierarchies, use an abstract self-returning method in the builder (e.g. `self()`) with covariant return types so subclass builders work without casting.

**Pros and cons:** Pros: readable, flexible, immutable objects, validation in one place, good for hierarchies. Cons: extra builder class and a bit more code.

**Quick example:**

```java
NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8)
    .calories(100).sodium(35).carbohydrate(27).build();
```

---

## Item 3: Enforce the singleton property with a private constructor or an enum type

**Summary paragraph:** If a class must have exactly one instance, enforce it by either a single-element enum type (preferred) or a class with a private constructor and a single public static instance (or static factory).

**Context:** Singletons are used for stateless utilities, thread pools, caches, or other single-instance resources. Without enforcement, multiple instances can be created by accident (e.g. reflection, serialization).

**Why it matters:** A single, globally accessible instance avoids duplicate resources and ensures consistent state. Improper singleton implementation can break under serialization, reflection, or multiple class loaders.

**What to do:** Prefer a single-element enum: `public enum Singleton { INSTANCE; }`. It is serialization-safe and reflection-resistant. If you cannot use an enum, use a private constructor and expose the instance via a public final field or a static factory; if serialization is needed, implement `readResolve()` to return the singleton.

**Pitfalls / exceptions:** Enum singletons cannot extend a class (only implement interfaces). With non-enum singletons, be aware of serialization (use `readResolve`) and reflection; a finalizer attack can be mitigated by an empty `final finalize()` in a non-final class.

**Pros and cons:** Pros: single instance guaranteed, clear intent. Cons: harder to test in isolation (consider dependency injection for testability); enum approach has no lazy initialization.

**Quick example:**

```java
public enum Elvis {
    INSTANCE;
    public void leaveTheBuilding() { ... }
}
```

---

## Item 4: Enforce noninstantiability with a private constructor

**Summary paragraph:** For utility classes that only hold static methods and static fields, prevent instantiation by adding a private constructor. This makes the class effectively final and documents intent.

**Context:** Some classes are not meant to be instantiated—e.g. `java.util.Math`, `java.util.Arrays`. Without a private constructor, the compiler would add a default public one, and clients or subclasses could create instances unnecessarily.

**Why it matters:** Instantiation of a utility class is meaningless and can confuse users. A private constructor prevents both instantiation and subclassing (no visible super constructor).

**What to do:** Add a single private no-arg constructor. Optionally add a comment or throw from inside it to make intent clear. Do not use abstract; that does not prevent subclassing and instantiation of the subclass.

**Pitfalls / exceptions:** This makes the class non-subclassable. If you need both utility methods and extensibility, consider an interface with default methods (if you control the interface) or a different design.

**Pros and cons:** Pros: clear contract, no accidental instances or subclasses. Cons: none for true utility classes.

**Quick example:**

```java
public class UtilityClass {
    private UtilityClass() {
        throw new AssertionError();
    }
}
```

---

## Item 5: Prefer dependency injection to hardwiring resources

**Summary paragraph:** Do not have classes create or look up their own dependencies (e.g. via static utilities or singletons). Instead, pass dependencies into the constructor (or setters); this is dependency injection and makes the class flexible and testable.

**Context:** Classes that depend on a resource (e.g. a dictionary, a service, a file) often obtain it via a static utility or singleton. That ties the class to a single implementation and makes unit testing and reuse hard.

**Why it matters:** Dependency injection keeps the class decoupled from concrete resources, allows swapping implementations (including mocks in tests), and supports multiple instances with different resources.

**What to do:** Pass the resource (or a factory of the resource) into the constructor or a setter. Prefer constructor injection for required dependencies. Use interfaces or abstract types for the dependency so you can plug in different implementations. For factories, consider bounded wildcards (e.g. `Supplier<? extends T>`).

**Pitfalls / exceptions:** Large numbers of dependencies can make constructors unwieldy; a builder or factory can help. Frameworks (e.g. Spring, Guice) automate injection but add framework dependency.

**Pros and cons:** Pros: flexibility, testability, reuse. Cons: more setup code; with many dependencies, need builders or frameworks.

**Quick example:**

```java
public class SpellChecker {
    private final Lexicon dictionary;
    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }
}
```

---

## Item 6: Avoid creating unnecessary objects

**Summary paragraph:** Reuse objects instead of creating new ones when an equivalent object would suffice. Especially avoid creating objects inside loops or repeatedly in hot paths; use static factories, cached instances, or object reuse.

**Context:** Object creation has cost. Creating many short-lived equivalent objects (e.g. same string, same regex, same adapter) wastes memory and CPU and can trigger extra GC.

**Why it matters:** Unnecessary creation hurts performance and can make code slower and harder to scale. Immutable or stateless objects can often be shared safely.

**What to do:** Prefer static factory methods over constructors when reuse is possible (e.g. `Boolean.valueOf(boolean)`). Reuse expensive immutable objects (e.g. compile a `Pattern` once and reuse). Use primitives instead of boxed types when possible to avoid autoboxing. For adapters (views) that don’t add state, prefer returning a single shared view rather than creating new ones each time (e.g. `Map.keySet()`).

**Pitfalls / exceptions:** Do not reuse mutable objects when you need independent state. Avoid object pools for normal objects; the JVM is good at short-lived allocation. Pools are for very expensive resources (e.g. database connections).

**Pros and cons:** Pros: better performance, less GC. Cons: must ensure shared objects are safe (immutable or thread-safe); over-caching can complicate code.

**Quick example:**

```java
// Bad: new Pattern every time
boolean matches = Pattern.matches("regex", s);

// Good: compile once, reuse
private static final Pattern REGEX = Pattern.compile("regex");
boolean matches = REGEX.matcher(s).matches();
```

---

## Item 7: Eliminate obsolete object references

**Summary paragraph:** When you manage your own storage (arrays, caches, listeners), clear references to objects that are no longer needed so they can be garbage-collected. Otherwise you get memory leaks.

**Context:** The garbage collector reclaims objects that are not reachable. If your class holds references (in an array, cache, or callback list) that you never clear, those objects stay reachable and are not collected even if the program logic no longer uses them.

**Why it matters:** Obsolete references cause memory leaks: growth in memory use, possible `OutOfMemoryError`, and degraded performance. They are common in caches, listener/callback registries, and custom collections (e.g. a stack that doesn’t null out on pop).

**What to do:** Null out references once they are no longer needed (e.g. in a stack, set the popped slot to null). For caches, use weak references (`WeakHashMap`) or a cache with eviction. For callbacks, provide a way to unregister or use weak references. Prefer using standard collections and letting the GC do its job when you don’t manage storage explicitly.

**Pitfalls / exceptions:** Don’t null out references as a substitute for good structure; minimize the scope of variables and the lifetime of references. Over-nulling can hide bugs; null only when the element is truly obsolete.

**Pros and cons:** Pros: prevents leaks, predictable memory use. Cons: requires discipline in classes that manage their own storage.

**Quick example:**

```java
public Object pop() {
    if (size == 0) throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null; // Eliminate obsolete reference
    return result;
}
```

---

## Item 8: Avoid finalizers and cleaners

**Summary paragraph:** Do not use finalizers or cleaners to reclaim non-memory resources. They are unreliable (timing unspecified), have significant performance cost, and can hide bugs. Use explicit lifecycle methods (e.g. `close()`) and try-with-resources instead.

**Context:** Finalizers and cleaners run when the GC reclaims an object. They were intended for releasing non-memory resources (files, native handles). In practice they run late or not at all, and they have serious drawbacks.

**Why it matters:** The spec does not guarantee when (or if) they run; they can delay reclamation and add substantial overhead. Finalizers can leave objects in a corrupt state if they throw; they also enable finalizer attacks. Cleaners are somewhat better but still non-deterministic and slower than normal reclamation.

**What to do:** Make resources implement `AutoCloseable` and require clients to call `close()` (or use try-with-resources). Document that the instance must be closed. Optionally use a cleaner as a safety net only when a client forgets to close—but think carefully before doing so.

**Pitfalls / exceptions:** If you must use a finalizer (e.g. legacy), override `finalize()` with an empty body for non-final classes to avoid finalizer attacks. Never depend on finalizers or cleaners for correctness or timely release.

**Pros and cons:** Pros of avoiding them: predictable, fast, no hidden failures. Cons of using them: unreliable, slow, complex, dangerous.

**Quick example:**

```java
// Do this: explicit close
public class Resource implements AutoCloseable {
    @Override public void close() { ... }
}
try (Resource r = new Resource()) { ... }
```

---

## Item 9: Prefer try-with-resources to try-finally

**Summary paragraph:** For any resource that implements `AutoCloseable`, use try-with-resources instead of try-finally to ensure resources are closed. Try-with-resources is shorter, handles multiple resources cleanly, and suppresses secondary exceptions properly so the first exception is not lost.

**Context:** Resources like streams, connections, or readers must be closed. Historically, try-finally was used, but with multiple resources the code becomes nested and messy, and if both the try block and the finally block throw, the exception from finally can hide the one from try.

**Why it matters:** Try-with-resources guarantees closing in reverse order of declaration; exceptions from close are suppressed and attached to the primary exception. Code is easier to read and less error-prone.

**What to do:** Use `try (Resource r = ...) { ... }` for every closeable resource. You can declare multiple resources in one try-with-resources. Resources must implement `AutoCloseable` (which extends `Closeable`). Catch or declare IOException (or other checked exceptions) as needed.

**Pitfalls / exceptions:** The resource variable is effectively final; don’t reassign it. If you must use a resource that doesn’t implement `AutoCloseable`, wrap or adapt it. For code that must run on pre–Java 7, try-finally is the fallback.

**Pros and cons:** Pros: automatic close, correct exception handling, clean syntax. Cons: requires Java 7+; resource must implement `AutoCloseable`.

**Quick example:**

```java
try (InputStream in = new FileInputStream(src);
     OutputStream out = new FileOutputStream(dst)) {
    byte[] buf = new byte[BUFFER_SIZE];
    int n;
    while ((n = in.read(buf)) >= 0) out.write(buf, 0, n);
}
```
