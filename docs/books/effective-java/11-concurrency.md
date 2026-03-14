---
title: 11. Concurrency
sidebar_position: 12
---

# 11. Concurrency

## Chapter overview

This chapter covers concurrent programming: synchronize access to shared mutable data, prefer executors and tasks to threads, prefer concurrency utilities to wait/notify, document thread safety, use lazy initialization correctly, and don’t depend on the thread scheduler. Correct use of concurrency avoids data races, deadlocks, and fragile behavior.

---

## Item 78: Synchronize access to shared mutable data

**Summary paragraph:** When multiple threads read or write shared mutable data, every read and write must be performed under appropriate synchronization (or use volatile for a single read/write of a single variable). Without synchronization, you get data races, and the visibility guarantees of the Java Memory Model don’t apply; threads can see stale or inconsistent state.

**Context:** The JMM allows threads to cache variables in registers or local memory unless there is a happens-before relationship (e.g. from synchronization or volatile). So one thread’s write might not be visible to another unless they synchronize on the same monitor or use volatile.

**Why it matters:** Data races cause undefined behavior: wrong results, infinite loops (e.g. “hoisted” read of a flag), or crashes. Synchronization (or volatile for simple flags) ensures visibility and ordering. Don’t try to avoid synchronization for “performance” without understanding the JMM; incorrect code is worse than slower correct code.

**What to do:** For shared mutable state, either: make the state immutable or effectively immutable; confine it to a single thread; or protect every access (read and write) with the same lock (or use volatile for a single variable used as a flag). Prefer higher-level constructs (concurrent collections, ExecutorService) over hand-written locking when they fit. Document the locking policy (which lock protects which state).

**Pitfalls / exceptions:** volatile gives visibility but not atomicity for compound actions (e.g. read-modify-write); use AtomicInteger, locking, or compare-and-swap. Double-checked locking is broken without volatile on the reference. Synchronization has cost; use when needed for correctness, then optimize if necessary.

**Pros and cons:** Pros of correct synchronization: correct, predictable. Cons: complexity, possible deadlock. Pros of volatile: visibility for single variable. Cons: no atomicity for compound ops.

**Quick example:**

```java
private static volatile boolean stop;
// Writer: stop = true;
// Reader: while (!stop) { ... }
// Use volatile so the reader sees the write.
```

---

## Item 79: Avoid excessive synchronization

**Summary paragraph:** Synchronization can cause deadlock, reduced throughput, and unexpected behavior (e.g. calling alien code under a lock). Keep synchronized blocks short; do not invoke external callbacks, user code, or methods that may be overridden while holding a lock. Consider using concurrent collections or splitting locks to reduce contention.

**Context:** Holding a lock for a long time blocks other threads and increases deadlock risk. Invoking unknown code (callbacks, overridable methods) under a lock can lead to deadlock (if the callback tries to acquire another lock) or to poor performance (if the callback is slow). It can also cause livelock or reentrancy issues.

**Why it matters:** Excessive synchronization serializes threads and can deadlock. Calling alien code under a lock is dangerous because you don’t control what it does (it might lock, block, or take a long time). The “open call” principle: don’t hold a lock when calling code you don’t own.

**What to do:** Do as little as possible inside synchronized blocks. Move slow or blocking operations (I/O, external calls) outside the block. Don’t call overridable methods or callbacks while holding a lock; do it before/after or in a copy of the data. Use concurrent collections (ConcurrentHashMap, etc.) to reduce lock scope. Consider lock splitting or non-blocking data structures for high contention.

**Pitfalls / exceptions:** Copying data to call outside the lock can be expensive; balance with contention. Reentrant locks allow the same thread to re-enter, but that doesn’t remove the risk of calling alien code (e.g. subclass method that acquires another lock).

**Pros and cons:** Pros of minimal locking: less deadlock, better throughput. Cons: design effort. Cons of holding locks during callbacks: deadlock, slow.

**Quick example:** Copy the list of listeners inside the lock, then notify them outside the lock.

---

## Item 80: Prefer executors, tasks, and streams to threads

**Summary paragraph:** Prefer the ExecutorService framework (executors, tasks) over managing raw Threads. Use Executors to create thread pools, submit Runnable or Callable tasks, and get Futures. For parallel processing of bulk data, prefer parallel streams or the ForkJoin pool. This gives better separation of “what runs” from “how many threads” and avoids the overhead of creating threads directly.

**Context:** Creating and starting a Thread for each unit of work is expensive and doesn’t scale. ExecutorService provides thread pools, task submission, and lifecycle management. It’s the standard way to run asynchronous or parallel work in Java.

**Why it matters:** Thread creation has cost; pools reuse threads. ExecutorService gives you control over pool size, shutdown, and result handling (Future). Parallel streams integrate with the common pool and are convenient for data parallelism. Raw threads are for rare cases (e.g. need a specific Thread subclass).

**What to do:** Use Executors.newFixedThreadPool, newCachedThreadPool, or custom ThreadPoolExecutor for task execution. Submit Runnable or Callable; use Future to get results or cancel. For bulk operations over collections, use parallelStream() or a custom executor with the right size. Shut down the executor when the application is done (shutdown, awaitTermination). Prefer higher-level APIs (CompletableFuture, parallel streams) when they fit.

**Pitfalls / exceptions:** Don’t use the default ForkJoinPool for blocking I/O (it has limited parallelism). Size the pool appropriately; too many threads can hurt. Uncaught exceptions in tasks can be lost; use a custom ThreadFactory or handle in the task. Don’t submit tasks that never complete (or use timeouts).

**Pros and cons:** Pros: reuse, control, Futures, standard. Cons: need to choose and tune pool. Pros of parallel streams: simple for data parallelism. Cons: shared pool, not for I/O-bound.

**Quick example:**

```java
ExecutorService exec = Executors.newFixedThreadPool(4);
Future<Result> f = exec.submit(() -> compute());
Result r = f.get(5, TimeUnit.SECONDS);
exec.shutdown();
```

---

## Item 81: Prefer concurrency utilities to wait and notify

**Summary paragraph:** Use the high-level concurrency utilities (java.util.concurrent) instead of wait/notify. Use BlockingQueue for producer-consumer, CountDownLatch for “wait until N events,” Semaphore for bounded resources, CyclicBarrier for phased coordination. These are clearer and less error-prone than hand-written wait/notify.

**Context:** wait(), notify(), and notifyAll() are low-level and easy to misuse (wrong lock, missed signal, spurious wakeup). The concurrent package provides queues, latches, barriers, and locks that express intent and handle edge cases.

**Why it matters:** wait/notify require correct locking, condition checking in a loop, and correct notify (all vs one). Concurrency utilities encapsulate these patterns and are tested. They also support timeouts and interruption cleanly.

**What to do:** Use BlockingQueue (LinkedBlockingQueue, ArrayBlockingQueue) for producer-consumer. Use CountDownLatch for “start when N things are ready” or “wait until N things done.” Use Semaphore for limiting concurrency. Use CyclicBarrier for multi-step parallel phases. Use Phaser for dynamic parties. Use Lock and Condition only when you need something the standard utilities don’t provide. If you must use wait/notify, always wait in a loop that checks the condition and use the same lock for wait and notify.

**Pitfalls / exceptions:** wait() must be in a loop: while (!condition) wait();. Always use the same object’s monitor for wait and notify. Prefer notifyAll() unless you can prove that only one waiter needs to run (notify() is error-prone). Document the condition and locking.

**Pros and cons:** Pros of utilities: clarity, correctness, timeouts. Cons of wait/notify: easy to get wrong.

**Quick example:** Use `BlockingQueue.take()` and `put()` instead of a hand-written wait/notify queue.

---

## Item 82: Document thread safety

**Summary paragraph:** Document the thread-safety guarantees of every class: immutable, thread-safe, not thread-safe, or conditionally thread-safe (and under what conditions). Document any locking strategy and which locks protect which state. This lets users use the class correctly in concurrent contexts.

**Context:** Callers need to know whether they can share an instance across threads and whether they must synchronize. Without documentation, they may assume the wrong thing (e.g. that a class is thread-safe when it isn’t, or that they must lock when the class already does).

**Why it matters:** Misuse leads to data races or unnecessary locking. Documenting “not thread-safe” or “thread-safe” (and how) sets expectations. Conditionally thread-safe classes (e.g. “safe when used from one thread, or when synchronized externally”) must say so clearly.

**What to do:** In the class-level Javadoc, state the thread-safety level: immutable, thread-safe, not thread-safe, or conditionally thread-safe (with the condition). If the class uses locks, document which lock protects which state (e.g. “all access to field X is guarded by this”). If you use a public lock (e.g. for client-side locking), document it. Use @implNote or similar for implementation details that affect thread safety.

**Pitfalls / exceptions:** Don’t promise thread safety if the class isn’t safe; that leads to bugs. If you change the thread-safety policy in a later version, document it as a breaking change. Static factories that return shared instances (e.g. singletons) should document thread safety of the returned object.

**Pros and cons:** Pros: clear contract, fewer misuse. Cons: must keep docs accurate.

**Quick example:** “This class is not thread-safe. External synchronization is required if instances are shared between threads.”

---

## Item 83: Use lazy initialization judiciously

**Summary paragraph:** Lazy initialization defers creating a field until first use. It can save startup time or avoid unnecessary allocation but adds complexity and can require synchronization. For static fields, prefer the lazy holder idiom. For instance fields, prefer double-check with volatile or just initialize in the constructor if cheap. Avoid lazy init when it doesn’t bring a clear benefit.

**Context:** Sometimes you want to create a heavy object only when it’s first needed. That requires either synchronizing every access (slow) or a more subtle pattern (double-check, holder class). Wrong patterns can expose partially constructed objects or miss visibility.

**Why it matters:** Incorrect lazy init can cause multiple initialization, visibility bugs (thread sees null or half-initialized object), or unnecessary locking. The right pattern depends on static vs instance, and whether the cost of synchronization is acceptable.

**What to do:** For static fields: use the lazy holder class idiom (a static nested class whose field is initialized when the class is loaded; JVM guarantees safe publication). For instance fields: if the field is almost always used, initialize in constructor or at declaration. If it’s rarely used and expensive, use double-check with volatile (check twice, synchronize once, assign with volatile so it’s visible). Don’t use lazy init for cheap objects or when you don’t have a clear benefit.

**Pitfalls / exceptions:** Double-check requires the field to be volatile (or use a final field set in a synchronized block with a proper happens-before). The “holder” idiom only works for static fields. Avoid lazy init of many fields if it complicates the code; sometimes eager init is simpler.

**Pros and cons:** Pros: defer cost. Cons: complexity, risk of bugs. Eager init is simpler when cost is low.

**Quick example:**

```java
private static class Holder {
    static final FieldType FIELD = compute();
}
static FieldType getField() { return Holder.FIELD; }
```

---

## Item 84: Don't depend on the thread scheduler

**Summary paragraph:** Do not rely on the thread scheduler (e.g. thread priorities, yield) for correctness. Thread scheduling is platform-dependent and can change. Correctness should not depend on which thread runs when. Use adequate parallelism (enough runnable threads, but not so many that the scheduler is overloaded) and structure the program so that it works regardless of scheduling decisions.

**Context:** Thread priorities and yield() are hints; the scheduler can ignore them. Programs that “work” only when threads run in a certain order or with certain priorities are fragile. They may fail under load, on different OSes, or with different JVM versions.

**Why it matters:** Depending on scheduling for correctness leads to bugs that are hard to reproduce (“works on my machine”). Priorities can cause starvation or priority inversion. The right approach is to use enough threads (and the right concurrency constructs) so that the program is correct and responsive without relying on scheduling details.

**What to do:** Ensure there are enough runnable threads (e.g. not blocked on I/O without a pool) so that progress can be made. Don’t use thread priority for correctness; use it only for tuning responsiveness if needed. Avoid busy-waiting (spin loops); use wait/notify or blocking structures. Don’t rely on yield() or sleep() for correctness. Use proper synchronization and coordination (latches, queues) so that behavior doesn’t depend on who runs first.

**Pitfalls / exceptions:** Thread priority can help with responsiveness (e.g. giving a UI thread a boost) but shouldn’t be required for correctness. Reducing runnable threads (e.g. using a bounded pool) can improve throughput by reducing contention; that’s tuning, not correctness.

**Pros and cons:** Pros of not depending on scheduler: portable, reliable. Cons of relying on it: fragile, non-portable.

**Quick example:** Use a CountDownLatch so that “start when ready” doesn’t depend on which thread runs first; don’t use a busy loop and hope the right thread runs.
