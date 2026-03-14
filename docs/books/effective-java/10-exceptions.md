---
title: 10. Exceptions
sidebar_position: 11
---

# 10. Exceptions

## Chapter overview

This chapter covers proper use of exceptions: use them only for exceptional conditions, use checked exceptions for recoverable conditions and runtime exceptions for programming errors, don’t ignore exceptions, don’t use empty catch blocks, document thrown exceptions, include failure-capture information, don’t fail silently, and include context in exception messages. Correct use of exceptions improves reliability and debuggability.

---

## Item 69: Use exceptions only for exceptional conditions

**Summary paragraph:** Do not use exceptions for normal control flow. Exceptions are for exceptional, unexpected conditions. Using them for expected branching (e.g. “no more elements”) makes code slow and hard to read. Use return values, Optional, or state checks instead for normal conditions.

**Context:** Exception throwing and catching has cost (stack walk, object creation). Using it for control flow (e.g. throwing to exit a loop) is an anti-pattern. It also obscures intent: readers expect exceptions to mean “something went wrong.”

**Why it matters:** Performance: exceptions in hot paths are expensive. Clarity: control flow should be explicit (return, break, Optional). APIs that use exceptions for normal outcomes force every caller to use try-catch for flow control, which is awkward.

**What to do:** Use normal returns (or Optional) for expected outcomes (e.g. “not found,” “empty”). Throw only when a precondition is violated or an external failure occurs. Design APIs so that the “normal” path doesn’t throw (e.g. Optional instead of throwing for “no result”). Use state-testing methods (e.g. hasNext) or return values instead of “throw to signal end.”

**Pitfalls / exceptions:** Some APIs historically use exceptions (e.g. Integer.parseInt throws for bad input); that’s acceptable when the alternative is a sentinel return that’s easy to ignore. For your own APIs, prefer return values or Optional for expected cases.

**Pros and cons:** Pros of exceptions for exceptional only: clear, performant. Cons of exceptions for control flow: slow, confusing.

**Quick example:** Use `Optional<User> findUser(id)` and `findUser(id).orElseThrow()` when absence is exceptional, rather than throwing from findUser for “not found.”

---

## Item 70: Use checked exceptions for recoverable conditions and runtime exceptions for programming errors

**Summary paragraph:** Use checked exceptions when the caller can reasonably recover (e.g. retry, ask user). Use runtime exceptions (unchecked) for programming errors (precondition violations, bugs). This keeps the exception model clear and avoids forcing callers to catch what they can’t fix.

**Context:** Checked exceptions must be declared or caught; they’re for conditions the caller might handle. Unchecked (RuntimeException) are for bugs and invalid state; callers usually shouldn’t catch them. Overuse of checked exceptions makes APIs tedious.

**Why it matters:** Right choice makes recovery paths obvious and avoids empty catch blocks. Wrong choice (e.g. checked for every failure) forces “throws Exception” everywhere; wrong choice (unchecked for recoverable) lets callers ignore recoverable failures.

**What to do:** Throw checked for: I/O errors, parse errors, resource unavailable—when the caller might retry or prompt. Throw unchecked (IllegalArgumentException, IllegalStateException, NPE) for: null where not allowed, invalid arguments, “this should never happen.” Don’t throw checked when most callers can’t do anything useful; consider returning a result type or providing a throwing and a non-throwing method.

**Pitfalls / exceptions:** When wrapping an exception, use the cause chain. Don’t throw Exception or Throwable; use specific types. Document @throws for all checked and important unchecked exceptions.

**Pros and cons:** Checked: forces handling; use for recoverable. Unchecked: flexible; use for bugs.

**Quick example:** `throws IOException` for file I/O; throw `IllegalArgumentException` for bad arguments.

---

## Item 71: Avoid unnecessary use of checked exceptions

**Summary paragraph:** Checked exceptions impose a burden on every caller. Use them when the benefit (forcing recovery) outweighs the cost. If many callers only rethrow or wrap, consider an unchecked exception or a different design (e.g. Optional, result object with error state).

**Context:** A method that throws a checked exception forces every caller to catch or declare. When most callers can’t recover and only propagate, the checked exception adds noise without benefit.

**Why it matters:** Unnecessary checked exceptions lead to boilerplate (try-catch or throws on many methods) and to “catch and wrap in RuntimeException” just to avoid declaring. That hides the original exception type and doesn’t help recovery.

**What to do:** Use checked exceptions when callers can meaningfully recover. If callers usually can’t, consider: returning Optional or a result type, providing two methods (one that throws, one that returns optional/result), or using an unchecked exception. Don’t add a checked exception “just in case”; add it when recovery is a real scenario.

**Pitfalls / exceptions:** Changing a method from checked to unchecked is a breaking change for catch clauses. Adding a checked exception to a method used widely is a large change. Design exception policy early.

**Pros and cons:** Pros of fewer checked: less boilerplate. Pros of checked where needed: explicit recovery.

**Quick example:** Prefer `Optional<Result> parse(String s)` with a separate `parseOrThrow(String s)` that throws, instead of only a throwing method that most callers can’t handle.

---

## Item 72: Favor the use of standard exceptions

**Summary paragraph:** Reuse standard exceptions (IllegalArgumentException, IllegalStateException, NullPointerException, IndexOutOfBoundsException, UnsupportedOperationException, etc.) instead of defining many custom ones. They are familiar and keep the exception hierarchy small. Add a custom exception only when you need more information or a distinct type that callers will catch.

**Context:** The JDK provides exceptions for common situations. Custom exceptions add types to learn and catch. Use custom only when the standard one doesn’t fit or when you need a type that callers catch specifically (e.g. for different handling).

**Why it matters:** Standard exceptions are well understood and documented. Too many custom exceptions fragment the API and force broad “catch Exception.” A custom exception is justified when it carries extra fields (e.g. error code) or when callers need to catch “your” exception specifically.

**What to do:** Use IllegalArgumentException for bad parameters, IllegalStateException for “object in wrong state,” NullPointerException for null where not allowed (or Objects.requireNonNull), IndexOutOfBoundsException for bad index, UnsupportedOperationException for unsupported ops. Use the most specific standard exception that fits. Add a custom exception when you need a distinct catch type or extra context; consider extending a standard exception.

**Pitfalls / exceptions:** Don’t reuse a standard exception with a different meaning (e.g. IllegalStateException for bad argument). Document when you throw so callers know what to catch.

**Pros and cons:** Pros of standard: familiarity, consistency. Pros of custom: extra info, distinct handling.

**Quick example:** Throw `IllegalArgumentException` for invalid args; throw `IllegalStateException` when the object isn’t ready for the operation.

---

## Item 73: Throw exceptions appropriate to the abstraction

**Summary paragraph:** Higher layers should not leak lower-level exceptions (e.g. SQLException, IOException) to callers who don’t care about the implementation. Catch lower-level exceptions and throw an exception that matches the abstraction (e.g. a domain exception or a standard one with the cause chained). Exception chaining (cause) preserves the stack trace for debugging.

**Context:** If a method in the service layer throws SQLException, the caller is coupled to the persistence implementation. The abstraction (e.g. “repository”) should throw something that reflects the operation (e.g. “could not load user”) and wrap the underlying cause.

**Why it matters:** Callers depend on the abstraction, not the implementation. Leaking implementation exceptions breaks encapsulation and makes callers handle details they shouldn’t know about. Chaining the cause keeps debugging information.

**What to do:** Catch implementation-specific exceptions in the layer that implements the abstraction. Throw an exception appropriate to the abstraction (same level of abstraction). Use initCause() or the exception constructor that takes a cause so the original exception is preserved. Document the thrown exception in Javadoc. Consider a small set of domain exceptions for your API.

**Pitfalls / exceptions:** Don’t swallow the cause; always set it. Don’t throw Exception or Throwable; throw a specific type. When translating, ensure the message describes the abstraction-level failure, not the low-level one.

**Pros and cons:** Pros: clean abstraction, debuggable (cause). Cons: more code for translation.

**Quick example:**

```java
try {
    return loadFromDb(id);
} catch (SQLException e) {
    throw new RepositoryException("Could not load user " + id, e);
}
```

---

## Item 74: Document all exceptions thrown by each method

**Summary paragraph:** Document every exception that a method can throw (checked and important unchecked), using Javadoc @throws. Include the conditions that cause each exception. This forms part of the method’s contract and helps callers handle or declare appropriately.

**Context:** Callers need to know what can go wrong. Undocumented exceptions lead to surprises and wrong handling. @throws is the standard way to document this.

**Why it matters:** Documented exceptions set expectations. Callers can catch the right type, add appropriate throws, or document propagation. Undocumented exceptions make the API harder to use correctly.

**What to do:** For each method, add @throws for every checked exception and for unchecked exceptions that callers might reasonably catch (e.g. IllegalArgumentException when the method can throw it). Describe the condition that triggers the exception. If the method propagates exceptions from another method, you can document “throws X if the underlying operation throws X” or list them. Use @param and @return as well for a complete contract.

**Pitfalls / exceptions:** Don’t document “throws Exception”; be specific. When you add a new thrown exception in a later version, document it; it may be a binary-compatible but behavioral change for callers who catch broadly.

**Pros and cons:** Pros: clear contract, fewer misuse. Cons: must keep docs in sync.

**Quick example:**

```java
/**
 * @throws IllegalArgumentException if id is null or empty
 * @throws RepositoryException if the user cannot be loaded
 */
public User loadUser(String id) { ... }
```

---

## Item 75: Include failure-capture information in detail messages

**Summary paragraph:** Exception messages should include the values of key parameters, fields, or state that led to the failure. This makes debugging possible without attaching a debugger. Include what was wrong and the relevant values; avoid exposing sensitive data.

**Context:** A message like “Invalid argument” doesn’t help. “Invalid argument: id=null” or “index 5 out of range for size 3” does. The detail message is the first thing you see in a log or stack trace.

**Why it matters:** Good messages shorten debugging time. They should answer “what was the value and what was wrong?” Don’t include passwords or PII in messages (log them separately with access control if needed).

**What to do:** In exception constructors, include the failing value(s) and a short description. For IndexOutOfBoundsException, include index and size. For IllegalArgumentException, include the invalid value and the constraint. Consider a static factory that builds the message (e.g. “index %d out of range [0, %d)”). Ensure that building the message doesn’t throw (e.g. avoid calling toString() on objects that might throw).

**Pitfalls / exceptions:** Don’t put sensitive data in messages (they may appear in logs, monitoring, or UI). Don’t over-include (huge collections); summarize. For unchecked exceptions used in hot paths, building messages can be costly; that’s usually acceptable.

**Pros and cons:** Pros: debuggable. Cons: care needed for sensitivity and cost.

**Quick example:** `throw new IndexOutOfBoundsException("Index " + index + " out of range for length " + length);`

---

## Item 76: Strive for failure atomicity

**Summary paragraph:** After an object throws an exception, it should still be in a valid, usable state (failure atomicity). Either the operation completes fully or the object is unchanged. This avoids leaving objects in a half-updated state that causes follow-up failures.

**Context:** If a method modifies state and then throws, the object can be left partially updated. Subsequent calls may see inconsistent state or throw again. Ideally, a failed operation either doesn’t change the object or rolls back to a valid state.

**Why it matters:** Failure atomicity makes failures predictable and easier to handle. Callers can retry or recover without dealing with corrupted state. It’s especially important for mutable objects used by multiple threads or in long-lived flows.

**What to do:** Design methods so that they either succeed completely or leave the object unchanged. Approaches: check parameters before modifying state (fast-fail); perform modifications on a copy and replace only on success; use an immutable representation and replace the whole object; perform the operation in an order that allows rollback or that leaves state consistent. Document failure atomicity when it’s part of the contract. For operations that can’t be atomic (e.g. multi-step with external side effects), document the possible intermediate state.

**Pitfalls / exceptions:** Some operations (e.g. network RPC) can’t be rolled back; document that. For concurrent access, failure atomicity may require locking or immutable snapshots.

**Pros and cons:** Pros: predictable, retriable. Cons: sometimes requires extra work (copy, rollback).

**Quick example:** Validate all inputs at the start; only then update fields. Or compute the new state and assign once.

---

## Item 77: Don't ignore exceptions

**Summary paragraph:** Empty or trivial catch blocks hide failures and make debugging very hard. When you catch an exception, either handle it (and perhaps rethrow), log it and rethrow, or document why ignoring it is correct. Never catch and do nothing without a clear comment.

**Context:** It’s easy to write catch (Exception e) {} to satisfy the compiler or to “fix” a problem by hiding it. That suppresses real bugs and makes production issues hard to diagnose.

**Why it matters:** Ignored exceptions often indicate a bug (wrong type caught, wrong scope, or a real failure that should be fixed). At minimum, log; usually rethrow or handle and rethrow. Empty catch is acceptable only in rare, documented cases (e.g. optional cleanup that must not fail the main path).

**What to do:** In every catch block, do one of: handle the exception and continue; log (with stack trace) and rethrow; wrap and rethrow; or document why the exception is intentionally ignored (and consider logging at fine level). Use try-with-resources so that suppressed exceptions from close() are attached to the primary exception. Never leave a catch block completely empty.

**Pitfalls / exceptions:** When closing resources, secondary exceptions are often suppressed by design; the primary exception and its “suppressed” list carry the rest. When you deliberately ignore (e.g. Thread.sleep interrupt), add a comment.

**Pros and cons:** Pros of handling or rethrowing: visibility. Cons of ignoring: hidden bugs.

**Quick example:** Avoid `catch (IOException e) {}`. Use `catch (IOException e) { log.error("Failed to ...", e); throw new UncheckedIOException(e); }` or real handling.
