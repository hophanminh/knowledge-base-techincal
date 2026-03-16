---
title: Spring Framework 6 study summary
sidebar_position: 2
---

# Book Summary: Spring Framework 6 (Beginning + Pro)

## Book Overview

- **What the book is about:** Spring Framework 6 is the core Java application framework that provides an IoC container, dependency injection (DI), configuration, and modules for data access, web (MVC, REST), and security. The material combines two books (Beginning Spring 6 and Pro Spring 6) to cover both introductory and in-depth topics.
- **Who the book is for:** Developers learning Spring for the first time or deepening their understanding of Spring 6; readers are assumed to know Java (ideally Java 17+).
- **Main problems the book addresses:** Tight coupling and hard-to-test code when applications create their own dependencies; scattered configuration and duplication; and repetitive infrastructure boilerplate. The book shows how an IoC container and DI address these by centralizing wiring and inverting control.
- **What the reader will gain:** A clear understanding of IoC, DI, beans, and the container; how to declare and wire beans with Java config or component scanning; how the container starts and resolves dependencies; and how to apply this in a first Spring application and in tests.

---

## Chapters

Each chapter is a separate page with its own sections, key concepts, architecture, trade-offs, practical lessons, and recap.

- **[Chapter 1 — Intro and getting started](spring-6-chapter-1-summary.md)** — What Spring is, why use it, what problems it solves, how the container works, when and where to use it, pros and cons, Q&A and next steps; plus Key Technical Concepts, Architecture/Workflows, Trade-offs, Practical Lessons, and Final Recap for Chapter 1.
- **[Chapter 2 — IoC, DI, and configuration](spring-6-chapter-2-summary.md)** — What IoC and DI are, bean definitions and the container, declaring beans, resolving dependencies, how configuration is loaded; plus Key Technical Concepts, Architecture/Workflows, Trade-offs, Practical Lessons, and Final Recap for Chapter 2.
- **[Chapter 3 — Bean lifecycle and scopes](spring-6-chapter-3-summary.md)** — What the bean lifecycle is, init and destroy callbacks (@PostConstruct, @PreDestroy, initMethod/destroyMethod), bean scopes (singleton, prototype, request/session), trade-offs and when to use each; plus Key Technical Concepts, Architecture/Workflows, Trade-offs, Practical Lessons, Senior interview Q&A, and Final Recap for Chapter 3.
- **[Chapter 4 — Testing with Spring](spring-6-chapter-4-summary.md)** — Unit vs integration tests, TestContext framework, loading minimal or full context, @ContextConfiguration and @SpringBootTest, mocking with @MockBean, profiles and best practices; plus Key Technical Concepts, Architecture/Workflows, Trade-offs, Practical Lessons, Senior interview Q&A, and Final Recap for Chapter 4.

---

# Key Technical Concepts (book-level)

- **Spring Framework:** The core open-source framework for Java that provides an IoC container, DI, and modules for data, web, security. Spring 6 requires Java 17+ and uses the Jakarta EE namespace.
- **Inversion of Control (IoC):** The container, not your code, controls object creation and wiring. You declare what you need; the framework supplies it.
- **Dependency Injection (DI):** Dependencies are passed into a component (e.g. via constructor) instead of the component creating or looking them up. Spring is a DI container.
- **Bean:** An object whose lifecycle and dependencies are managed by the Spring container. Declared via `@Bean` methods or component scanning.
- **ApplicationContext:** The central Spring container. It holds bean definitions, creates beans, resolves dependencies, runs lifecycle callbacks. Example: `AnnotationConfigApplicationContext` for Java config.
- **@Configuration:** Marks a class as a source of bean definitions. Used with `@Bean` methods.
- **@Bean:** Marks a method as defining a bean. The method's return value is registered; method parameters are injected beans.
- **@Autowired:** Requests injection of a dependency (constructor, setter, or field). Often optional when there is a single candidate and constructor injection is used.
- **Component scanning:** The process of discovering classes annotated with `@Component` (or stereotypes) in specified packages and registering them as beans. Enabled with `@ComponentScan`.

---

# Architecture / Systems / Workflows (book-level)

**End-to-end flow (Ch1 and Ch2):**

1. You create an `ApplicationContext` and pass it config classes (and/or enable scanning).
2. The context loads the config classes and builds a **bean definition registry** (from `@Bean` methods and any scanned components).
3. The context **instantiates** beans. For each bean it resolves constructor/setter parameters to other beans, creates the instance, and injects dependencies.
4. Optional **initialization** callbacks run (e.g. `@PostConstruct`, `InitializingBean`).
5. The context is **ready**: your code can get beans from the context or use injected beans.
6. On **shutdown**, destruction callbacks run (e.g. `@PreDestroy`, `DisposableBean`).

**Dependency resolution:** The container builds a dependency graph. It creates beans that have no (or only satisfied) dependencies first, then wires them into beans that depend on them. Constructor parameters and `@Autowired` setters/fields are satisfied from the registry. Circular dependencies may require setter injection or lazy resolution.

---

# Trade-offs and Design Decisions (book-level)

- **Java config vs XML:** Java config is the default: type-safe, refactorable, co-located with code. XML is still supported for legacy or team preference. Prefer Java config for new projects.
- **Constructor vs setter vs field injection:** Constructor injection is preferred: dependencies are explicit and required, and the object can be immutable. Setter injection allows optional or mutable dependencies and can help with circular dependencies. Field injection is concise but hides dependencies and makes testing harder. Prefer constructor injection when possible.
- **Explicit @Bean vs component scanning:** Use `@Configuration` and `@Bean` when you need full control over how a bean is created (e.g. third-party classes, complex setup). Use `@Component` and scanning for application-owned classes where default construction is fine. You can mix both in the same application.
- **Framework vs Boot:** Framework is the core; Boot adds convention and embedded runtime. Learn the framework first for fundamentals; use Boot when you want fast setup and less config.

---

# Practical Lessons (book-level)

- **Start small:** Create a single config class with a few `@Bean` methods and an ApplicationContext in `main`. Get one bean and use it. Then add a second bean that depends on the first and see the container inject it.
- **Prefer constructor injection:** Design your services and repositories with constructor parameters for dependencies. The container will inject them; in tests you can pass mocks.
- **Keep configuration organized:** Use one or a few config classes for the core wiring; use `@Import` or separate config classes for distinct areas (e.g. data source, web). Use profiles for environment-specific beans.
- **Test with the container:** Use Spring's test context to load a minimal config and inject your beans in tests. That validates wiring and lets you swap in test doubles where needed.

---

# Final Recap (book-level)

Spring Framework 6 provides an IoC container and DI: you declare beans and dependencies, the container creates and wires them. This gives you loose coupling and testability. The core concepts are: IoC, DI, beans, ApplicationContext, and configuration (Java or XML). Spring Boot builds on the framework with convention and embedded runtimes. You declare beans with `@Configuration`/`@Bean` or with `@Component` and scanning. Dependencies are resolved by type and injected (prefer constructor injection). Configuration is loaded at context startup; the registry drives bean creation and lifecycle. Use Java config by default, constructor injection where possible, and a clear layout of config classes and profiles. Start with a small context and a few beans, then add more as you move into lifecycle, Boot, web, and data.
