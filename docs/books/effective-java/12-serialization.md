---
title: 12. Serialization
sidebar_position: 13
---

# 12. Serialization

## Chapter overview

This chapter covers Java serialization: prefer alternatives (JSON, protobuf) to Java’s built-in serialization, use custom serialized form when needed, write defensive readObject, consider a serialization proxy, and understand the costs. Java serialization is brittle and has security risks; use it only when necessary and do it correctly.

---

## Item 85: Prefer alternatives to Java serialization

**Summary paragraph:** Java’s built-in serialization (Serializable, ObjectInputStream/ObjectOutputStream) is brittle, has had serious security issues (gadget chains), and ties you to Java. Prefer cross-platform, human-readable or well-defined formats such as JSON or Protocol Buffers for persistence and network. Use Java serialization only for legacy interoperability.

**Context:** Serialization was designed for RPC and persistence in a Java-only world. It serializes the full graph of object structure, which has led to many security vulnerabilities (deserialization of untrusted data executing unexpected code). It’s also not portable and is hard to evolve (changing classes breaks compatibility).

**Why it matters:** Deserializing untrusted data is dangerous. Even with a filter, the attack surface is large. New systems should use formats that are cross-language, debuggable (e.g. JSON), or at least well-defined (e.g. protobuf). Java serialization should be phased out where possible.

**What to do:** Prefer JSON (Jackson, Gson), Protocol Buffers, or similar for new code. Use Java serialization only when you must (e.g. RMI, legacy storage). If you must deserialize, never deserialize untrusted data; use an allowlist (ObjectInputFilter) and keep the allowlist minimal. Consider a serialization proxy (Item 90) to limit what gets deserialized. Document that the class is for legacy use only.

**Pitfalls / exceptions:** Some frameworks (RMI, JMX, JPA with some providers) use serialization; understand the risk. Removing Serializable from a class breaks existing serialized data. Migrating from Java serialization to another format requires a one-time migration of stored data.

**Pros and cons:** Pros of JSON/protobuf: portable, debuggable, often safer. Cons of Java serialization: security, brittleness, Java-only.

**Quick example:** Use `ObjectMapper.writeValueAsString(obj)` and `readValue(s, MyClass.class)` instead of ObjectOutputStream/ObjectInputStream for new formats.

---

## Item 86: Implement Serializable with great caution

**Summary paragraph:** Implementing Serializable commits you to a binary format and a default serialized form. It can break encapsulation (private fields become part of the format), complicates evolution (changing fields can break compatibility), and increases the risk of bugs and security issues. Implement it only when the benefit (e.g. persistence, RMI) outweighs the cost, and then document and maintain the serial form.

**Context:** Adding “implements Serializable” seems easy but has long-term consequences. The default serial form exposes your internal structure. Changing the class (adding/removing/renaming fields, changing types) can make old serialized data unreadable or misinterpreted. Subclasses are affected too.

**Why it matters:** Once a class is serializable, changing it can break compatibility. Default serial form is brittle and can expose internal fields. Deserialization bypasses constructors and can create objects in invalid states if not designed for it. It also increases the attack surface (more classes that can be instantiated via deserialization).

**What to do:** Implement Serializable only when you have a clear need (e.g. persistence, RMI, legacy). Document the serialized form (or use a custom one—Item 87). Consider a serialization proxy (Item 90). Design for evolution: use serialVersionUID explicitly if you must support old data, and document compatibility rules. Prefer making serialization a separate concern (e.g. DTOs that are serializable, domain objects that are not).

**Pitfalls / exceptions:** Not implementing Serializable when a superclass does can cause issues (subclass fields won’t be serialized by default). Implementing Serializable in a class designed for inheritance is especially tricky (Item 19). Inner classes have implicit references to the enclosing instance; serializing them can pull in the whole outer object graph.

**Pros and cons:** Pros: interoperability with legacy, RMI, some frameworks. Cons: commitment, evolution pain, security, encapsulation loss.

**Quick example:** Only add “implements Serializable” when required; document and consider custom form and proxy.

---

## Item 87: Consider using a custom serialized form

**Summary paragraph:** The default serialized form (Java’s automatic encoding of fields) ties the format to your current internal representation and can be inefficient and fragile. Consider a custom form (writeObject/readObject) that serializes only what’s needed in a stable format, so you can evolve the class without breaking compatibility.

**Context:** Default serialization writes all non-transient, non-static fields. That exposes your internals and makes it hard to change the class (rename/remove fields, change types) without breaking old data. A custom form lets you define a stable, minimal format.

**Why it matters:** Custom form gives control over what’s stored, in what shape, and how it’s read back. You can keep compatibility when you refactor (e.g. rename a field but keep the same key in the stream). You can avoid serializing derived or redundant data.

**What to do:** Design a serial format (e.g. named fields or a simple layout) and implement writeObject and readObject. In writeObject, use ObjectOutputStream.defaultWriteObject() if you want to include some default fields, then write additional data. In readObject, validate and restore state; use defaultReadObject() if you used defaultWriteObject. Consider making the format human-readable (e.g. write UTF strings) for debugging. Document the format. For complex or versioned formats, consider a serialization proxy instead.

**Pitfalls / exceptions:** readObject must validate and must not allow an object to be left in an invalid state (Item 88). Custom form is more code and must be maintained. For simple, stable classes, default form might be acceptable if you control all data.

**Pros and cons:** Pros: stable format, evolution, control. Cons: more code, must maintain. Default: easy but brittle.

**Quick example:**

```java
private void writeObject(ObjectOutputStream s) throws IOException {
    s.defaultWriteObject();
    s.writeInt(importantField);
}
private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
    s.defaultReadObject();
    importantField = s.readInt();
}
```

---

## Item 88: Write readObject methods defensively

**Summary paragraph:** When you implement readObject, assume the stream could be malicious or corrupted. Validate all data; do not trust the stream. Where possible, copy mutable fields (e.g. arrays, collections) defensively. Use serialization proxy (Item 90) when you need to enforce invariants that are hard to enforce in readObject.

**Context:** Deserialization creates objects without calling the normal constructor. So invariants that are enforced in constructors or setters can be bypassed if readObject just assigns fields from the stream. An attacker or bug can produce a stream that creates an object in an invalid state.

**Why it matters:** Without defensive readObject, deserialization can create objects that violate invariants (e.g. negative size, null where forbidden). That can lead to bugs or security issues when the object is used later. Defensive copying in readObject prevents the stream from handing you mutable objects that it can modify later.

**What to do:** In readObject, validate every field that contributes to invariants (range checks, non-null, consistency). Throw InvalidObjectException if invalid. For any field that holds a reference to a mutable object (array, collection, Date), defensively copy: read into a temporary and assign a copy to the field. Don’t use the stream’s object directly if it’s mutable. For classes with complex invariants, prefer a serialization proxy so that the only way to create an instance from a stream is through the proxy, which uses the public constructor.

**Pitfalls / exceptions:** defaultReadObject() assigns fields directly from the stream; after calling it, you must still validate and defensively copy mutable fields. Final fields can’t be set in readObject without reflection (and the pattern is more complex); serialization proxy avoids that. Don’t invoke overridable methods from readObject.

**Pros and cons:** Pros: safe deserialization, invariants preserved. Cons: more code. Serialization proxy can simplify and strengthen this.

**Quick example:** After defaultReadObject(), validate; then for a mutable field: `this.elements = (E[]) elements.clone();` (or copy collection).

---

## Item 89: For instance control, prefer enum types to readResolve

**Summary paragraph:** To enforce singletons (or other instance control) in the face of serialization, prefer making the type an enum so that the JVM guarantees a single instance per constant. If you can’t use an enum, you can use readResolve() to replace the deserialized object with the canonical instance, but it’s fragile (attackers can access the object before readResolve runs). Enum avoids that.

**Context:** Deserialization creates a new object; it doesn’t return the singleton. readResolve() is called after readObject and can return a different object (e.g. the singleton), which replaces the one just deserialized. But the deserialized object exists briefly and can be accessed (e.g. via a reference stolen during readObject), so readResolve is not a full defense. Enum constants are serialized by name and deserialization always returns the same enum constant.

**Why it matters:** For singletons, you want only one instance. readResolve can be subverted if an attacker gets a reference to the “temporary” deserialized object. Enum serialization doesn’t create a new instance; it resolves to the existing constant. So for instance control, enum is the robust choice.

**What to do:** If the class is a singleton (or has a fixed set of instances), make it an enum. If you cannot (e.g. must extend a class), use a single-element enum as the holder (Item 3) or implement readResolve() to return the canonical instance. If you use readResolve, make all instance fields transient so the deserialized object doesn’t hold sensitive state that could be read before readResolve runs; and be aware of the theoretical attack. Document the serialization behavior.

**Pitfalls / exceptions:** readResolve is instance-based; it runs on the deserialized object. If your class has subclasses, readResolve in the superclass may not run for the subclass’s deserialization. Enum has no subclasses, so no such issue.

**Pros and cons:** Pros of enum: robust, simple. Pros of readResolve: works for non-enum. Cons of readResolve: subtle attacks, fragile.

**Quick example:** `public enum Singleton { INSTANCE; }` — no readResolve needed; deserialization returns INSTANCE.

---

## Item 90: Consider serialization proxies instead of serialized instances

**Summary paragraph:** A serialization proxy is a separate, private static nested class that represents the logical state of the enclosing class. The enclosing class writes a proxy to the stream (writeReplace); the proxy has readResolve that returns a new instance of the enclosing class built via its public API. Deserialization never creates the enclosing class directly; it creates the proxy, then the proxy’s readResolve builds the real object. This enforces invariants and avoids many serialization pitfalls.

**Context:** Normal deserialization creates the object by bypassing constructors and setting fields. That makes it hard to enforce invariants and to defend against bad or malicious streams. A proxy: the stream only ever contains the proxy type; the real class is never deserialized from the stream. So you can make the real class’s serial form opaque and ensure every “deserialized” instance is created via your constructor or factory.

**Why it matters:** Serialization proxy gives you full control: the only path from stream to instance is proxy’s readResolve, which can use public constructors or factories and validate everything. It avoids the need for defensive readObject, handles evolution more cleanly (proxy format is under your control), and reduces the attack surface (no direct deserialization of the main class). The cost is an extra class and a bit more code.

**What to do:** Add a private static nested class that has one field for each logical piece of state of the enclosing class. The enclosing class implements writeReplace to return an instance of the proxy (passing this’s state). The proxy implements Serializable and readResolve; in readResolve, call the enclosing class’s constructor or factory with the proxy’s fields and return the new instance. The enclosing class should not implement readObject (or can throw InvalidObjectException) so that the only deserialization path is via the proxy. Use this for classes with non-trivial invariants or when you want a stable, controlled serial format.

**Pitfalls / exceptions:** Not suitable for classes that can be subclassed (subclasses would need their own proxy or special handling). The proxy must be able to construct the enclosing class through its public API; if that’s not possible, you may need readObject instead. Slightly more complex than default serialization.

**Pros and cons:** Pros: invariants, no direct deserialization of main class, controlled format, simpler readObject. Cons: extra class, a bit more code.

**Quick example:**

```java
private static class SerializationProxy implements Serializable {
    private final double re, im;
    SerializationProxy(Complex c) { this.re = c.re; this.im = c.im; }
    private Object readResolve() { return new Complex(re, im); }
}
private Object writeReplace() { return new SerializationProxy(this); }
private void readObject(ObjectInputStream s) throws InvalidObjectException {
    throw new InvalidObjectException("Proxy required");
}
```
