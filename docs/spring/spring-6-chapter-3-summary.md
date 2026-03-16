---
title: Summary — Chapter 3 Bean lifecycle and scopes
sidebar_position: 5
---

# Chapter 3 — Bean lifecycle and scopes

Part of the [Spring Framework 6 study summary](spring-6-summary.md). This page covers how the container manages bean creation, initialization, destruction, and scopes.

**Main ideas and goals:**
- Understand when and how the container creates, initializes, and destroys beans.
- Hook into lifecycle events (post-construction setup, pre-destruction cleanup) without tying your code to Spring.
- Choose the right bean scope (singleton, prototype, or web scopes) for each bean.

---

## What is the bean lifecycle

- The **bean lifecycle** is the sequence of steps from the moment the container decides to create a bean until it disposes of it.
- **Typical flow:** Container instantiates the bean → injects dependencies → runs **initialization callbacks** → bean is ready for use → (later) container runs **destruction callbacks** → bean is removed.
- Lifecycle applies to **singleton** beans (one per container); the container does not fully manage the lifecycle of **prototype** beans (it creates them but does not destroy them).

**Takeaway:** The container controls not only creation and wiring but also when initialization and destruction run. Your beans can hook into those moments for setup and cleanup.

---

## Why lifecycle callbacks matter

- **Initialization:** Run logic after the bean is fully constructed and injected (e.g. open a connection, validate configuration, start a background task).
- **Destruction:** Run logic before the bean is discarded (e.g. close connections, flush buffers, release resources).
- Without callbacks you would have to do setup in the constructor (dependencies might not be set yet) or rely on ad-hoc cleanup, which is error-prone.

**Takeaway:** Lifecycle callbacks give you a clear, container-managed place for “after I’m ready” and “before I’m destroyed” behavior.

---

## How to hook into the lifecycle

### Problem, approaches, and chosen solution

**Problem or issue:**
- You need to run code **after** the bean is fully created and wired (init) and **before** the container discards it (destroy).
- You want to avoid coupling your class to Spring interfaces so that the same class stays portable and testable.

**Possible approaches:**
- **Spring interfaces:** Implement `InitializingBean` (and `afterPropertiesSet()`) and `DisposableBean` (and `destroy()`). Container calls these automatically.
- **JSR-250 annotations:** Use `@PostConstruct` for init and `@PreDestroy` for destroy. Standard Java, supported by Spring.
- **Config-driven methods:** Specify `initMethod` and `destroyMethod` in `@Bean` or XML. Point to any public void no-arg method (or with exceptions).

**Pros and cons:**
- **InitializingBean / DisposableBean:**
  - Pros: Explicit contract; container always calls them.
  - Cons: Couples your class to Spring; harder to reuse outside the container.
- **@PostConstruct / @PreDestroy:**
  - Pros: Portable (JSR-250); no Spring dependency in the class; widely used and recommended.
  - Cons: Requires annotation processing; some legacy environments may not support them.
- **initMethod / destroyMethod:**
  - Pros: No annotations or interfaces in the bean class; good for third-party classes you cannot annotate.
  - Cons: Configuration is external; method name can get out of sync with refactoring.

**Chosen approach in the book:**
- Prefer **@PostConstruct** and **@PreDestroy** for application-owned beans: portable, clear, and no Spring API in the class.
- Use **initMethod** / **destroyMethod** when you cannot annotate the class (e.g. third-party library beans).

**Mechanism:**
- After the container creates the bean and injects dependencies, it discovers init callbacks (interfaces, `@PostConstruct`, or configured init method) and invokes them in a defined order. The bean is then “ready.”
- When the context is closing, the container discovers destroy callbacks and invokes them so the bean can release resources before being discarded.

**Key takeaway:** Use `@PostConstruct` and `@PreDestroy` by default; fall back to init/destroy method in config for beans you don’t control.

---

## Initialization callbacks in detail

- **Order (conceptual):** Dependencies injected → `@PostConstruct` methods → `InitializingBean.afterPropertiesSet()` → custom `initMethod` if specified.
- **Best practice:** Prefer one init mechanism per bean (e.g. only `@PostConstruct`) to avoid confusion and ordering surprises.
- **Use init for:** Opening resources, validating state, registering listeners, starting in-process background work. Avoid long-running or blocking work that could delay context startup.

**Takeaway:** Init runs once per bean after wiring; use it for setup that depends on injected state. Keep it short and non-blocking where possible.

---

## Destruction callbacks in detail

- **Order (conceptual):** Context shutting down → `@PreDestroy` methods → `DisposableBean.destroy()` → custom `destroyMethod` if specified.
- **Best practice:** Prefer `@PreDestroy`; use `destroyMethod` for third-party beans (e.g. many Spring configs use `destroyMethod = "close"` for `DataSource`).
- **Use destroy for:** Closing connections, flushing buffers, cancelling tasks, releasing native resources.

**Takeaway:** Destroy runs when the context closes; use it for cleanup so resources are released reliably.

---

## Bean scopes

### Problem and options

**Problem or issue:**
- Not every bean should be shared by the whole application. Some should be created once per container (singleton), others per use (prototype), or per web request/session.

**Possible approaches:**
- **Singleton (default):** One instance per container. Shared by all callers. Created at startup (by default).
- **Prototype:** New instance every time the container is asked for the bean. No lifecycle destroy callback from the container.
- **Request / Session / Application (web):** In a web context, beans can be scoped to a single HTTP request, a user session, or the servlet context.

**Pros and cons:**
- **Singleton:** Efficient, predictable; one place to hold state. Not suitable when the bean must not be shared or must hold request-specific state.
- **Prototype:** Fresh state per use; good for stateful or non-thread-safe objects. Container does not manage destruction; you must handle cleanup yourself if needed.
- **Request/Session:** Correct for web-specific state. Only available when a web-aware context is in use (e.g. Spring MVC).

**Chosen approach:** Use **singleton** by default. Use **prototype** when each consumer needs its own instance. Use **request** or **session** scope in web apps when the bean holds request- or session-scoped data.

**Mechanism:** The container stores singleton instances and returns the same instance for each `getBean` call. For prototype, it creates a new instance on each `getBean`. For request/session, the web infrastructure creates and binds instances per request/session.

**Takeaway:** Choose scope based on how the bean is used: shared (singleton), per use (prototype), or per request/session (web).

---

## When and where to use lifecycle and scopes

- **Use init/destroy** whenever a bean owns resources (connections, files, threads) or must validate/set up state after injection.
- **Use singleton** for stateless services, repositories, and shared configuration. Use **prototype** for stateful helpers or when you need a new instance per call. Use **request/session** in web layers for request- or user-specific data.

**Takeaway:** Lifecycle callbacks and scopes let you align bean lifetime with how the bean is used and what resources it holds.

---

## Pros and cons of lifecycle management

**Pros:**
- Clear, predictable place for setup and cleanup.
- Container guarantees init runs after injection and destroy runs on shutdown.
- Choice of mechanism (annotation vs config) so you can avoid coupling to Spring in your classes.

**Cons:**
- Multiple mechanisms (interface, annotation, config) can be confusing; stick to one per bean.
- Prototype beans are not destroyed by the container; you must manage their lifecycle yourself if they hold resources.

**Takeaway:** Lifecycle management is essential for resource-heavy or stateful beans; use one consistent mechanism per bean and choose the right scope.

---

## Key Technical Concepts

- **Bean lifecycle:** The sequence from bean creation through dependency injection, initialization, use, and (for singletons) destruction. The container drives this sequence.
- **Initialization callback:** Code run after the bean is constructed and injected. Options: `InitializingBean.afterPropertiesSet()`, `@PostConstruct`, or a configured `initMethod`.
- **Destruction callback:** Code run before the container discards a singleton bean. Options: `DisposableBean.destroy()`, `@PreDestroy`, or a configured `destroyMethod`.
- **@PostConstruct / @PreDestroy:** JSR-250 annotations for init and destroy. Recommended for application beans; no Spring API in the class.
- **initMethod / destroyMethod:** Attributes on `@Bean` (or XML) that point to methods to call after construction or before destruction. Useful for third-party classes.
- **Singleton scope:** Default scope; one instance per container. Created at startup (by default); destroyed when the context closes.
- **Prototype scope:** New instance per `getBean` (or injection). Container does not call destroy; lifecycle after creation is your responsibility.
- **Request / Session scope:** Web scopes; one instance per HTTP request or per user session. Available in web-aware Spring contexts.

---

## Architecture / Systems / Workflows

- **Lifecycle flow (singleton):** Container creates instance → injects dependencies → runs all init callbacks in order → bean is ready → (on shutdown) runs all destroy callbacks in order → bean is discarded.
- **Order of init:** `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom init method. Order of destroy: `@PreDestroy` → `DisposableBean.destroy()` → custom destroy method.
- **Scope and creation:** Singleton beans are typically created at context startup (eager). Prototype beans are created on demand. Request/session beans are created when the request/session is first needed.
- **Prototype and destruction:** The container does not call destroy on prototype beans. If they hold resources, the factory or code that obtains them must arrange cleanup (e.g. custom destroy method call or `ObjectFactory`/provider pattern).

---

## Trade-offs and Design Decisions

- **Interface vs annotation vs config:** Prefer `@PostConstruct`/`@PreDestroy` for portability and clarity. Use init/destroy method in config for beans you cannot annotate (e.g. third-party).
- **Singleton vs prototype:** Use singleton for stateless or shared beans; use prototype when each consumer must have its own instance or when the object is stateful and not thread-safe.
- **Eager vs lazy (singleton):** Default is eager creation at startup. Lazy singletons are created on first use; useful to speed startup or for beans used only in certain paths.

---

## Practical Lessons

- Add `@PostConstruct` for setup that depends on injected fields (e.g. open a connection, validate config). Add `@PreDestroy` for cleanup (e.g. close connection).
- For third-party beans (e.g. `DataSource`), use `@Bean(initMethod = "...", destroyMethod = "close")` (or the appropriate method name) when the class cannot be annotated.
- Prefer one init and one destroy mechanism per bean to avoid ordering and maintenance issues.
- Use prototype scope when you need a new instance per injection or per call; remember the container will not destroy these beans.
- In web applications, use request or session scope for beans that hold request- or user-specific state.

---

## Senior interview Q&A

**1. What is the bean lifecycle in Spring? In what order do initialization and destruction run?**

- The **lifecycle** is the sequence from creation to disposal: the container instantiates the bean, injects dependencies, runs **initialization** callbacks, then the bean is ready; on context shutdown it runs **destruction** callbacks and discards the bean.
- **Init order:** `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → custom `initMethod`. **Destroy order:** `@PreDestroy` → `DisposableBean.destroy()` → custom `destroyMethod`.
- This applies to **singleton** beans. **Prototype** beans are created on demand and the container does not run destroy callbacks for them.

**2. Why prefer @PostConstruct and @PreDestroy over InitializingBean and DisposableBean?**

- **@PostConstruct** and **@PreDestroy** are JSR-250 (standard Java); the bean class does not depend on Spring. The same class can be reused in other environments or tests without Spring.
- **InitializingBean** and **DisposableBean** tie the class to Spring. They are still supported and called by the container, but for new application code the annotations are preferred for portability and clarity.

**3. When would you use initMethod and destroyMethod on @Bean instead of annotations?**

- When the **bean class is not yours** (e.g. third-party library) and you cannot add `@PostConstruct`/`@PreDestroy`.
- Example: many `DataSource` implementations have a `close()` method; you can declare `@Bean(destroyMethod = "close")` so the container calls it on shutdown. Same idea for an init method if the library documents one.

**4. What is the difference between singleton and prototype scope? When do you use each?**

- **Singleton:** One instance per container. Default. Shared by all injectors. Created at startup (by default); container calls destroy when the context closes. Use for stateless services, repositories, shared configuration.
- **Prototype:** New instance every time the container is asked for the bean (e.g. each `getBean` or each injection into a prototype-scoped bean). Container does **not** call destroy. Use when each consumer needs its own instance or when the object is stateful and not thread-safe. Be aware you must handle cleanup yourself if the bean holds resources.

**5. Does Spring call destroy for prototype beans? How do you handle cleanup for prototype beans that hold resources?**

- **No.** The container creates prototype beans but does not manage their lifecycle after creation; it never calls destroy callbacks for them.
- To handle cleanup you can: (1) use a custom pattern where the factory or caller explicitly calls a cleanup method; (2) use an `ObjectFactory` or `Provider` and ensure the caller disposes when done; (3) avoid putting resource-heavy logic in prototype beans and keep it in singletons that the container does destroy.

---

## Final Recap

Chapter 3 covers **bean lifecycle and scopes**. The container runs initialization callbacks after creating and wiring a bean, and destruction callbacks when shutting down (for singletons). Prefer **@PostConstruct** and **@PreDestroy** for application beans; use **initMethod**/ **destroyMethod** for third-party beans. Choose **singleton** (default) for shared, stateless beans; **prototype** when each consumer needs its own instance (and remember the container will not destroy prototypes). In web apps, **request** and **session** scopes support per-request or per-user state. Use one init and one destroy mechanism per bean and align scope with how the bean is used and what resources it holds. Next: testing with the container, Spring Boot, or web layers. See [Chapter 2](spring-6-chapter-2-summary.md) for IoC and configuration; this chapter adds lifecycle and scopes.
