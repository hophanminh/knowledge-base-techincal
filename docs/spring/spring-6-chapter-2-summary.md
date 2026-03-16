---
title: Summary — Chapter 2 IoC, DI, and configuration
sidebar_position: 4
---

# Chapter 2 — IoC, DI, and configuration

Part of the [Spring Framework 6 study summary](spring-6-summary.md). This page covers IoC, DI, and configuration in depth.

This chapter explains what inversion of control and dependency injection are, how the container and bean definitions work, how to declare beans (Java config and component scanning), how dependencies are resolved and injected, and how configuration is loaded and applied. The main goal is to let you define and wire beans yourself and understand the mechanics behind the "getting started" flow from Chapter 1.

---

## What is IoC and DI

**Explanation:** Inversion of Control (IoC) means the framework controls object creation and wiring instead of your code. Dependency Injection (DI) is one way to achieve IoC: dependencies are passed into a component (e.g. via constructor or setter) by the container. So IoC describes who is in control (the container); DI describes how dependencies get into your objects (injection).

### Problem, approaches, and chosen solution

**Problem:** When each class creates or looks up its own dependencies, the code is tightly coupled and hard to test. You want components to depend on abstractions and receive implementations from outside.

**Possible approaches:**
- Pass dependencies in constructors or setters manually (manual DI).
- Use a service locator that components call to get dependencies.
- Use a container that reads configuration and injects dependencies automatically (Spring's approach).

**Pros and cons:**
- Manual DI: explicit but wiring code is repetitive and scattered.
- Service locator: centralizes lookup but still couples code to the locator and hides dependencies.
- Container with configuration: centralizes both definition and wiring and keeps component code free of lookup logic.

**Chosen approach:** Spring uses a container and configuration-driven DI. You declare beans and their dependencies; the container creates and injects. This is preferred because wiring is in one place, components stay clean, and you can swap implementations (e.g. mocks) by changing configuration.

**Takeaway:** IoC means the container is in control; DI is the mechanism. Your code declares what it needs; the container provides it.

---

## Bean definitions and the container

A bean is an object managed by the Spring container. The container holds a registry of bean definitions (metadata: type, scope, dependencies, init/destroy methods). When the context starts, it uses these definitions to create bean instances, resolve dependencies, and wire them. The main container type is `ApplicationContext` (e.g. `AnnotationConfigApplicationContext` for Java config).

**Takeaway:** Beans are managed by the container; definitions live in a registry; the ApplicationContext creates and wires beans from those definitions.

---

## Declaring beans

**Explanation:** You declare beans in two main ways:
- **Java-based configuration:** a class annotated with `@Configuration` contains methods annotated with `@Bean` that return the bean instances; method parameters are other beans the container injects.
- **Component scanning:** you annotate classes with `@Component` (or `@Service`, `@Repository`) and enable scanning with `@ComponentScan`; the container discovers and registers those classes as beans.

XML is still supported but Java config is the default.

### Approaches and trade-offs

**Possible approaches:**
- Explicit `@Bean` methods give full control over how each bean is created (e.g. third-party classes, complex setup).
- Component scanning reduces boilerplate and is convenient for many application-owned classes.
- XML is externalized and toolable but not type-safe and more verbose.

**Pros and cons:**
- `@Bean`: full control, type-safe, refactorable; more code per bean.
- Scanning: less code, good for many beans; less control over construction.
- XML: externalized, toolable; verbose, not type-safe.

**Chosen approach in the book:** Spring 6 favors Java config (either `@Bean` or scanning) over XML. Use `@Bean` when you need control; use scanning for application beans where default construction is fine. You can mix both.

**Takeaway:** Beans are declared with `@Configuration`/`@Bean` (explicit) or `@Component`/scan (discovery). Choose explicit when you need full control; use scanning for many application beans.

---

## Resolving dependencies

The container resolves dependencies by matching parameter types (and optionally names) to other beans. Constructor injection is preferred: the container calls the constructor with the required beans. Setter or field injection (`@Autowired`) is also supported. If there is one candidate bean of the parameter type, it is used; if there are multiple, you disambiguate with `@Qualifier` or by name. The container builds a dependency graph and instantiates beans in an order that satisfies constructors and setters.

### Injection styles and trade-offs

**Possible approaches:**
- Constructor injection
- Setter injection
- Field injection

**Pros and cons:**
- Constructor: dependencies explicit and required, supports immutability, easy to test; all dependencies must be available at construction time (circular dependencies need care).
- Setter: optional or mutable dependencies, can help with circular dependencies; dependencies can be less visible.
- Field: concise; hides dependencies and makes testing harder.

**Chosen approach in the book:** Prefer constructor injection for required dependencies. Use setter or field injection when the design calls for it (e.g. optional dependency, circular case).

**Takeaway:** Dependencies are resolved by type (and qualifier if needed); prefer constructor injection; the container orders creation so dependencies exist before they are injected.

---

## How configuration is loaded and applied

When you create an `AnnotationConfigApplicationContext` and register config classes, the context loads those classes, reads `@Bean` methods and any `@ComponentScan`, and builds the bean definition registry. Then it instantiates beans (typically eagerly), resolves dependencies, and runs post-processors. You can combine configs with `@Import` or by registering multiple classes. Profiles (`@Profile`) and conditional beans (`@Conditional`) let you activate different beans for different environments.

**Takeaway:** Configuration is loaded at startup from the config classes you register; the registry is built and then beans are created. Use `@Import`, profiles, and conditionals to structure and vary configuration.

---

## Key Technical Concepts

- **IoC (Inversion of Control):** The container, not your code, controls object creation and wiring. You declare what you need; the framework supplies it.
- **DI (Dependency Injection):** Dependencies are passed into a component (e.g. via constructor) instead of the component creating or looking them up.
- **Bean:** An object whose lifecycle and dependencies are managed by the Spring container. Declared via `@Bean` methods or component scanning.
- **ApplicationContext:** The central Spring container; it holds bean definitions, creates beans, resolves dependencies, runs lifecycle callbacks.
- **@Configuration:** Marks a class as a source of bean definitions. Used with `@Bean` methods.
- **@Bean:** Marks a method as defining a bean. The return value is registered; method parameters are injected beans.
- **@Autowired:** Requests injection of a dependency (constructor, setter, or field). Often optional when there is a single candidate.
- **Component scanning:** Discovery of classes annotated with `@Component` (or stereotypes) in specified packages; they are registered as beans. Enabled with `@ComponentScan`.

---

## Architecture / Systems / Workflows

- **Container startup:**
  - Create ApplicationContext and pass config classes.
  - Context loads config classes and builds the bean definition registry from `@Bean` methods and scanned components.
  - Context instantiates beans: for each bean it resolves constructor/setter parameters to other beans, creates the instance, injects dependencies.
  - Init callbacks run (e.g. `@PostConstruct`).
  - Context is ready.
  - On shutdown, destroy callbacks run.
- **Dependency resolution:** The container builds a dependency graph. It creates beans with no (or only satisfied) dependencies first, then wires them into beans that depend on them. Constructor parameters and `@Autowired` setters/fields are satisfied from the registry. Circular dependencies may require setter injection or lazy resolution.

---

## Trade-offs and Design Decisions

- **Java config vs XML:** Java config is the default: type-safe, refactorable, co-located with code. XML is supported for legacy or preference. Prefer Java config for new projects.
- **Constructor vs setter vs field injection:** Constructor injection is preferred for required dependencies and immutability. Setter injection for optional or mutable dependencies and some circular cases. Field injection is concise but hides dependencies; prefer constructor when possible.
- **Explicit @Bean vs component scanning:** Use `@Configuration` and `@Bean` when you need full control over construction (e.g. third-party classes, complex setup). Use `@Component` and scanning for application-owned classes where default construction is fine. You can mix both.

---

## Practical Lessons

- Start with one config class and a few `@Bean` methods. Create the context in `main`, get one bean, then add a second bean that depends on the first and observe the container injecting it.
- Prefer constructor injection: design services and repositories with constructor parameters for dependencies; the container injects them and tests can pass mocks.
- Organize configuration: use one or a few config classes for core wiring; use `@Import` or separate config classes for distinct areas (e.g. data source); use profiles for environment-specific beans.
- Test with the container: use Spring's test context to load a minimal config and inject your beans in tests to validate wiring and use test doubles where needed.

---

## Senior interview Q&A

**1. What are the trade-offs between constructor injection, setter injection, and field injection? When would you use each?**

- **Constructor injection:** Dependencies are explicit and required; the object can be immutable and is fully initialized after construction. Easiest to test (pass mocks in the constructor). Preferred for required dependencies. Limitation: circular dependencies between two beans that both need constructor injection can require a different approach (e.g. setter or `@Lazy`).
- **Setter injection:** Dependencies can be optional or mutable; can help break circular dependencies. Downside: dependencies are less visible and the object can be used before all setters are called.
- **Field injection:** Concise but hides dependencies, makes testing harder (often requires reflection or a test context), and discourages immutability. Use only when necessary (e.g. legacy or framework constraints). Prefer constructor injection for new code.

**2. Explain the difference between declaring beans with @Bean methods versus component scanning. When is each appropriate?**

- **@Bean (in a @Configuration class):** You explicitly define how each bean is created. Full control over construction, suitable for third-party classes, factory methods, or when you need to call a constructor with specific arguments. One method per bean (or a few); more verbose but very clear.
- **Component scanning (@Component and @ComponentScan):** The container discovers classes in a package and registers them as beans. Less code when you have many application-owned classes that can be instantiated with a default (no-arg or injectable) constructor. Less control over how the instance is created.
- **When to use which:** Use `@Bean` when you need full control (e.g. `DataSource`, integration with libraries that do not use Spring annotations). Use scanning for typical services, repositories, or controllers where default construction is fine. You can mix both in the same application.

**3. How does the Spring container resolve dependencies and in what order does it create beans?**

- The container builds a **dependency graph** from bean definitions (from `@Bean` methods and/or scanned components). A dependency is typically expressed as a constructor parameter or setter/field of type X; the container looks up a bean of type X (and optionally by name with `@Qualifier`) in the registry.
- **Order of creation:** The container instantiates beans in an order that satisfies dependencies: beans with no dependencies (or whose dependencies are already created) are created first, then beans that depend on them. So if A depends on B, B is created before A. For constructor injection, all constructor arguments must be available when the bean is created; the container ensures that by ordering creation accordingly. Circular dependencies (A → B → A) require special handling (e.g. setter injection so one bean can be set after the other is created, or `@Lazy` on one side).

**4. How would you handle circular dependencies between beans? What are the options and their trade-offs?**

- **Option 1 — Setter (or field) injection for one side of the cycle:** The container can create both instances first (with null/unset dependency), then inject the reference. So one bean uses constructor injection and the other uses setter injection for the circular reference. Trade-off: one dependency is less explicit and the object is not fully initialized until the setter runs.
- **Option 2 — @Lazy on one dependency:** One of the dependencies is injected as a lazy proxy. The actual dependency is resolved only when first used, by which time the other bean exists. Trade-off: you defer the cost and break the cycle; behavior is the same from the caller’s perspective but debugging can be slightly harder.
- **Option 3 — Redesign to remove the cycle:** Often the best long-term fix. Extract shared logic into a third component both depend on, or restructure so that one bean does not depend on the other directly. Avoids framework tricks and keeps the model clearer.
- **Constructor-only circular dependency:** If both sides use only constructor injection for the circular reference, Spring cannot create either bean and will fail at startup. You must use one of the options above.

**5. Why does Spring recommend Java-based configuration over XML? When might XML still be justified?**

- **Java config advantages:** Type-safe and refactorable (IDE and compiler help); lives with application code and can be versioned and reviewed in the same way; can use conditionals, profiles, and programmatic logic; no separate XML schema to maintain. Spring and the industry have moved toward Java config as the default.
- **XML advantages:** Configuration is externalized and can be changed without recompiling (useful in some ops scenarios); some tools and legacy systems generate or consume Spring XML; non-developers sometimes prefer editing XML. So XML is still supported.
- **When XML might still be justified:** Legacy projects already using XML; organizational preference for externalized config; tooling that produces or consumes Spring XML. For new projects, prefer Java config unless there is a clear reason to use XML.

---

## Final Recap

IoC means the container controls creation and wiring; DI is injection of dependencies into your components. Beans are managed by the container; definitions live in a registry; ApplicationContext creates and wires beans. Declare beans with `@Configuration`/`@Bean` or `@Component`/`@ComponentScan`; prefer constructor injection. Dependencies are resolved by type (and qualifier); the container orders instantiation to satisfy dependencies. Configuration is loaded at context startup; use `@Import`, profiles, and conditionals for flexibility.
