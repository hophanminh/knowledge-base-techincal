---
title: Summary — Chapter 1 Intro and getting started
sidebar_position: 3
---

# Chapter 1 — Intro and getting started

Part of the [Spring Framework 6 study summary](spring-6-summary.md). This page covers the intro and getting-started material.

This chapter introduces Spring Framework 6: what it is, why and when to use it, what problems it solves, and how an application starts and uses the container. The main ideas are that the framework provides an IoC container and DI to achieve loose coupling and testability, and that getting started means creating a context, defining beans, and obtaining or injecting them. The goal is to set the stage for hands-on use and for the deeper IoC/DI and configuration material in Chapter 2.

---

## What is it

Spring Framework is an open-source application framework for Java. It provides an IoC container that manages object creation and dependency wiring, plus modules for data access, web (MVC, REST), and security. Spring Framework 6 runs on Java 17+ and uses the Jakarta EE namespace. Spring Boot builds on the framework with convention-based configuration and embedded servers; the core concepts (container, beans, configuration) come from the framework.

**Key ideas:** The framework is the core; Boot adds convenience. From day one you work with: IoC container, beans (container-managed objects), and configuration (how you declare beans and their dependencies).

**Takeaway:** Spring Framework 6 is the foundation; you work with a container, beans, and configuration. Understanding the framework first makes Boot easier.

---

## Why we need to use it

Spring is used for loose coupling (the container injects dependencies so your code does not create or look them up), consistency (one way to configure and run applications across layers), integration with the Spring ecosystem (Boot, Data, Security), and productivity (less manual wiring, framework handles cross-cutting concerns).

**Takeaway:** You use Spring to get testable, decoupled code and a single, consistent way to configure and run Java applications.

---

## What problems it solves

### The problem and the chosen approach

**Problem or issue:** Without a container and DI, code often creates its own dependencies with `new` or uses static lookups. That leads to tight coupling: the class is bound to a concrete implementation and is hard to unit test or reuse. Configuration and wiring also spread across the codebase, and infrastructure code (data access, transactions) is repeated.

**Possible approaches:**
- Manual wiring in code — every component constructs or looks up what it needs.
- A central registry or factory that components ask for dependencies.
- Inversion of control: a container reads configuration and injects dependencies into components so components do not control their own dependencies.

**Pros and cons:**
- Manual wiring: simple but couples everything and makes testing hard.
- Central factory: helps but still leaves "who creates what" scattered.
- IoC with a container: centralizes creation and wiring and lets you swap implementations (e.g. mocks in tests) without changing business code.

**Chosen approach in the book:** Spring uses an IoC container and DI. You declare beans and dependencies in configuration; the container creates and injects. The book favors this because it addresses coupling, testability, and scattered configuration in one model.

**Mechanism:** You define beans (e.g. with `@Configuration` and `@Bean`); the container builds a registry, instantiates beans, resolves dependencies, and injects them. Your code receives dependencies instead of creating them.

**Takeaway:** Spring solves coupling, scattered configuration, and infrastructure boilerplate by providing a container and a clear configuration model.

---

## How it works behind the scene

**Explanation:** Configuration is loaded first (you define beans with `@Configuration`/`@Bean` or XML; the container builds a bean definition registry). Then the ApplicationContext starts: it instantiates beans, resolves their dependencies, runs optional init callbacks (e.g. `@PostConstruct`), and makes beans available. Your code gets beans from the context or receives them via injection. On shutdown, destruction callbacks run.

**Flow:** Load config → create context → create and wire beans → run app → close context.

**Takeaway:** The container loads configuration, builds a registry, creates beans, injects dependencies, and runs lifecycle callbacks. Understanding this flow helps when debugging startup or injection issues.

---

## When and where we use it

Use Spring when starting a new Java application (web, API, batch, or backend) and you want a standard, testable structure; when refactoring to reduce coupling and centralize configuration; or when you need integration with data, messaging, or security via the Spring ecosystem. Use it in any Java 17+ project that benefits from DI: bootstrap the ApplicationContext at the application entry point (e.g. `main` or Boot), and use beans across service, data, and web layers.

**Takeaway:** Use Spring when you want DI and a single configuration model; bootstrap the context at the entry point and use beans across layers.

---

## Pros and cons

**Pros:**
- Better testability (inject mocks in tests).
- Loose coupling and one configuration model.
- Mature ecosystem (Boot, Data, Security) and wide adoption.
- Good documentation and community.

**Cons:**
- Learning curve (IoC, lifecycle, modules).
- More moving parts than a minimal plain-Java app; framework upgrades to manage.
- Can be overkill for very small or throwaway utilities.

**Takeaway:** Spring pays off for applications that benefit from structure and testability; for minimal one-off utilities it may be more than you need.

---

## Q&A and next steps

Common questions: **Framework vs Boot** — Framework is the core (IoC, DI, modules); Boot adds auto-configuration and embedded runtime. **XML vs Java config** — Java config is the default; XML is still supported. **What is a bean** — An object whose lifecycle and dependencies are managed by the container. **How to run a first app** — Create an ApplicationContext in `main`, pass your config class, get a bean and use it. **Next steps** — IoC/DI and configuration in depth (Chapter 2), then lifecycle, then Boot or web.

**Takeaway:** Framework is the core; Boot builds on it. Your first app is a context plus config plus a bean. Next: [Chapter 2 (IoC, DI, configuration)](spring-6-chapter-2-summary.md).

---

## Key Technical Concepts

- **Spring Framework:** The core open-source framework for Java that provides an IoC container, DI, and modules for data, web, security. Spring 6 requires Java 17+ and uses the Jakarta EE namespace.
- **IoC container:** The component that controls object creation and wiring. Your code declares what it needs; the container supplies it.
- **Bean:** An object whose lifecycle and dependencies are managed by the Spring container. You declare beans in configuration; the container creates and injects them.
- **ApplicationContext:** The central Spring container. It holds bean definitions, creates beans, resolves dependencies, and runs lifecycle callbacks. Example: `AnnotationConfigApplicationContext` for Java config.
- **Configuration:** The way you declare beans and their dependencies (Java config with `@Configuration`/`@Bean`, or XML).

---

## Architecture / Systems / Workflows

- **High-level flow:** You define beans in configuration → you create an ApplicationContext and pass it the config → the context loads the config and builds a bean definition registry → the context instantiates beans, resolves dependencies, runs init callbacks → your code gets beans from the context or receives them via injection → on shutdown, destroy callbacks run.
- **Components:** Configuration (source of bean definitions), ApplicationContext (container and registry), beans (managed objects). The context is the central piece that ties configuration to runtime objects.

---

## Trade-offs and Design Decisions

- **Spring Framework vs Spring Boot:** Framework is the core; Boot adds convention and embedded servers. Use the framework when you want to understand the fundamentals or need fine-grained control; use Boot when you want fast setup and less config.
- **Spring vs plain Java:** Spring adds structure, testability, and ecosystem at the cost of learning curve and more moving parts. Prefer Spring for applications that will grow or need testing and layering; plain Java can be enough for very small or short-lived tools.

---

## Practical Lessons

- Create a Java class with `main`, instantiate an `AnnotationConfigApplicationContext`, pass a config class that defines at least one `@Bean`, then call `context.getBean(YourClass.class)` and use the bean. That is the minimal "first app."
- Keep the first config class small (one or two beans) so you can see the container create and expose them before adding more.

---

## Senior interview Q&A

**1. What is the difference between Spring Framework and Spring Boot? Why would you choose one over the other?**

- **Framework** is the core: IoC container, DI, and modules (data, web, security). You configure and wire beans explicitly or via scanning. **Boot** sits on top: it adds convention-over-configuration, auto-configuration, embedded servers, and starter dependencies so you can run an app with minimal config.
- **Choose the Framework** when you need fine-grained control, want to understand fundamentals, or have non-standard requirements. **Choose Boot** when you want fast setup, standard defaults, and less boilerplate for typical web/API apps. In practice most new projects use Boot, but the Framework is still what runs under the hood.

**2. Explain Inversion of Control (IoC) and Dependency Injection (DI). How does Spring implement them?**

- **IoC** means the framework (the container) controls object creation and wiring instead of your code. Your classes do not `new` their dependencies or call a factory; they declare what they need (e.g. via constructor parameters), and the container supplies it.
- **DI** is the mechanism: dependencies are *injected* into a component (via constructor, setter, or field) by the container. Spring implements this by reading configuration (e.g. `@Configuration`/`@Bean` or component scanning), building a bean definition registry, and at runtime creating beans and resolving their dependencies by type (and name if needed), then injecting them. So IoC is the principle (“who is in control”); DI is how Spring applies it.

**3. What is a Spring bean and how does the container manage its lifecycle?**

- A **bean** is an object whose lifecycle and dependencies are managed by the Spring container. You declare beans in configuration; you do not create them yourself in business code.
- **Lifecycle:** The container instantiates the bean, injects its dependencies (constructor/setter/field), runs optional initialization callbacks (e.g. `@PostConstruct`, `InitializingBean`), then the bean is ready. When the context shuts down, destruction callbacks run (e.g. `@PreDestroy`, `DisposableBean`). For singleton beans (the default), one instance is created per container and reused.

**4. When would you recommend using Spring for a new project, and when might plain Java be sufficient?**

- **Use Spring** when the application will have multiple layers (e.g. web, service, data), need testability (inject mocks), need consistency in configuration and wiring, or will integrate with the ecosystem (Boot, Data, Security). Also when the team already knows Spring or the project is expected to grow.
- **Plain Java** can be sufficient for small utilities, one-off scripts, or very simple services with no need for DI or multiple interchangeable implementations. If the project stays small and has no testing or layering requirements, Spring’s learning curve and extra moving parts may not pay off.

**5. How would you bootstrap a minimal Spring application without Spring Boot? Walk through the steps.**

- Create a Java class with a `main` method.
- Create an `ApplicationContext` (e.g. `AnnotationConfigApplicationContext`) and pass it one or more config classes (classes annotated with `@Configuration`).
- The context loads the config, builds the bean definition registry from `@Bean` methods (and any `@ComponentScan`), instantiates beans, resolves dependencies, and runs init callbacks.
- Obtain a bean from the context, e.g. `context.getBean(MyService.class)`, and use it. When done, call `context.close()` so shutdown/destroy callbacks run.
- No Boot, no embedded server: just the container and your beans. Boot automates context creation and adds the embedded server and default config.

---

## Final Recap

Spring Framework 6 is the core; it provides an IoC container, beans, and configuration; Boot builds on it. Use Spring for loose coupling, testability, and a single configuration model. The container loads configuration, creates beans, injects dependencies, and runs lifecycle callbacks. Bootstrap the context at the application entry point and use beans across layers. After this chapter, move on to IoC, DI, and configuration in detail ([Chapter 2](spring-6-chapter-2-summary.md)).
