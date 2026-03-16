---
title: Summary — Chapter 4 Testing with Spring
sidebar_position: 6
---

# Chapter 4 — Testing with Spring

Part of the [Spring Framework 6 study summary](spring-6-summary.md). This page covers how to test Spring applications: unit tests with mocks, integration tests with the container, and the TestContext framework.

**Main ideas and goals:**
- Test beans in isolation (unit) or with the real container and configuration (integration).
- Use the Spring TestContext to load a minimal or full application context in tests.
- Replace or add beans in the test context (e.g. mocks, test doubles) without changing production code.

---

## Why testing with Spring matters

- **DI and testability:** Because dependencies are injected, you can pass mocks or stubs in tests instead of real implementations. No need for the container in pure unit tests.
- **Integration tests:** Sometimes you need to verify that wiring, configuration, and the container behave correctly together. The TestContext framework lets you run tests inside a real Spring context.
- **Goals:** Fast, reliable unit tests for business logic; slower but realistic integration tests for wiring and cross-cutting behavior.

**Takeaway:** Spring’s DI makes unit testing easy (inject mocks). Use the TestContext when you need to test with the actual container and configuration.

---

## Unit tests vs integration tests

### Problem and approaches

**Problem or issue:**
- You want to verify that your code works: both the logic inside a class (unit) and the way beans are wired and used together (integration).
- Unit tests should be fast and not start the container; integration tests need the container but may be slower and require more setup.

**Possible approaches:**
- **Pure unit tests:** Instantiate the class under test yourself; pass mocks (e.g. Mockito) for dependencies. No Spring context.
- **Integration tests with TestContext:** Use `@ExtendWith(SpringExtension.class)` (JUnit 5) and `@ContextConfiguration` (or `@SpringBootTest`) so that a Spring context is created for the test; inject real beans or use `@MockBean` to replace some with mocks.

**Pros and cons:**
- **Pure unit:** Fast; no container; full control over dependencies. Does not verify that wiring or configuration is correct.
- **Integration with TestContext:** Verifies real wiring and config; can test transactions, HTTP, or data access. Slower; requires context setup; use sparingly for critical paths.

**Chosen approach:** Use **unit tests** for most business logic (no Spring). Use **integration tests** when you need to validate configuration, wiring, or container behavior (e.g. a slice of the app or a full context).

**Takeaway:** Prefer unit tests for speed and simplicity; add integration tests where the container and wiring must be exercised.

---

## The TestContext framework

- **What it is:** A Spring testing support layer that creates and caches an `ApplicationContext` for tests. You declare which configuration to load; the framework reuses the same context across test methods or classes when the configuration is the same.
- **Main pieces:**
  - **TestContext:** Holds the context and test metadata.
  - **ContextLoader:** Loads the context (e.g. from `@ContextConfiguration` classes or `@SpringBootTest`).
  - **TestExecutionListener:** Hooks for before/after test class or method (e.g. dependency injection, transaction rollback).
- **JUnit 5:** Use `@ExtendWith(SpringExtension.class)` to plug Spring into JUnit 5. Then use `@ContextConfiguration(classes = { ... })` to specify config classes, or `@SpringBootTest` when using Spring Boot.

**Takeaway:** The TestContext framework manages a real Spring context for your tests so you can inject beans and run integration tests against the container.

---

## Loading context in tests

### Options and trade-offs

**Problem or issue:**
- You need the right balance: enough context to test wiring and behavior, but not so much that tests are slow or flaky. You may want different configs for different test classes.

**Possible approaches:**
- **Minimal context:** `@ContextConfiguration(classes = { MyConfig.class })` with one or a few config classes that define only the beans needed for the test.
- **Full or slice context:** `@SpringBootTest` (Boot) loads the full application or a slice (e.g. `@DataJpaTest`, `@WebMvcTest`). Good for broader integration tests.
- **Profiles:** Use `@ActiveProfiles("test")` so only test-specific beans (e.g. in-memory DB) are active.

**Pros and cons:**
- **Minimal context:** Fast; clear what is under test. You must maintain test config and keep it in sync with production.
- **Full/slice context:** Realistic; less custom test config. Slower; more moving parts.
- **Profiles:** Keeps test vs production config separate. Requires discipline in defining and using profiles.

**Chosen approach:** Prefer a **minimal context** for most integration tests (only the beans under test and their direct dependencies). Use **profiles** for test-only beans (e.g. data source). Use full or slice context when you need to test a whole layer or the app.

**Mechanism:** The TestContext creates an `ApplicationContext` from the classes you specify (or from Boot’s auto-configuration), then injects beans into your test class. The same context is reused for other test classes with the same configuration (caching).

**Takeaway:** Load only the configuration you need for each test class; use profiles to switch in test doubles or in-memory resources.

---

## Mocking and test doubles

- **Without Spring (unit):** Create the class under test with `new`; pass Mockito mocks (or stubs) for dependencies. No `@Autowired`; you control every dependency.
- **With Spring (integration):** Use `@MockBean` to replace a bean in the context with a Mockito mock. The context will inject the mock wherever that bean type is required. Useful to replace a real `DataSource`, HTTP client, or external service so the test stays fast and deterministic.
- **@MockBean** is provided by Spring Boot Test; in plain Spring you can define a test config that declares a `@Primary` mock bean or use a separate test configuration that overrides specific beans.

**Takeaway:** In unit tests, pass mocks manually. In integration tests, use `@MockBean` (or test config) to replace selected beans with mocks while keeping the rest of the context real.

---

## Testing best practices

- **Keep unit tests container-free** for business logic: instantiate the class, inject mocks, assert behavior.
- **Use a minimal TestContext** when you need the container: one or a few config classes, only the beans under test.
- **Use profiles** (e.g. `test`) for test-only configuration (in-memory DB, no external calls).
- **Avoid loading the whole application** in every test; use slices (`@WebMvcTest`, `@DataJpaTest`) or small configs.
- **Prefer deterministic tests:** mock time, random, and external services so tests are repeatable.

**Takeaway:** Favor fast, focused unit tests; add targeted integration tests with a small context and mocks for heavy or external dependencies.

---

## Pros and cons of Spring testing support

**Pros:**
- DI makes unit testing straightforward (inject mocks).
- TestContext reuses the same context across tests (faster after first load).
- You can mix unit and integration styles in the same project.
- Profiles and `@MockBean` let you tailor the context for tests without changing production code.

**Cons:**
- Integration tests are slower and depend on context setup; overuse can slow the build.
- Cached context can lead to subtle bugs if tests mutate shared state (design tests to be independent).
- Learning curve: JUnit 5 + Spring Extension + `@ContextConfiguration` or `@SpringBootTest`.

**Takeaway:** Spring’s testing support is powerful; use it where it adds value (integration and wiring) and rely on plain unit tests elsewhere.

---

## Key Technical Concepts

- **Unit test:** A test that exercises one class (or a small set of classes) in isolation, with dependencies replaced by mocks or stubs. No Spring context.
- **Integration test:** A test that runs with a real Spring context and verifies that beans are wired correctly and interact as expected. May use real or test doubles for external resources.
- **TestContext framework:** Spring’s support for managing an `ApplicationContext` in tests: loading config, caching context, and providing dependency injection into test classes.
- **@ContextConfiguration:** Declares which configuration (Java classes or XML) to use to build the test context. Used with `@ExtendWith(SpringExtension.class)` for JUnit 5.
- **@SpringBootTest:** Spring Boot annotation that loads the full application context (or a slice). Convenient for integration tests in Boot applications.
- **@MockBean:** Replaces a bean in the test context with a Mockito mock. The mock is injected wherever that bean type is required. Available in Spring Boot Test.
- **@ActiveProfiles:** Activates one or more profiles (e.g. `"test"`) so that profile-specific beans and configuration are used in the test context.
- **SpringExtension:** JUnit 5 extension that integrates the TestContext framework with JUnit 5 (replaces the older JUnit 4 `@RunWith(SpringJUnit4ClassRunner.class)`).

---

## Architecture / Systems / Workflows

- **Unit test flow:** Create class under test → create mocks for dependencies → inject mocks (constructor/setter) → call method under test → verify behavior and interactions. No Spring.
- **Integration test flow:** Test class annotated with `@ExtendWith(SpringExtension.class)` and `@ContextConfiguration` (or `@SpringBootTest`) → TestContext loads context (once per shared config) → Spring injects beans into test instance → test method runs → listeners can run (e.g. transaction rollback) → next test or teardown.
- **Context caching:** TestContext caches contexts by a key derived from the configuration. Tests that declare the same configuration reuse the same context instance to reduce startup cost.

---

## Trade-offs and Design Decisions

- **Unit vs integration:** More unit tests (fast, focused); fewer integration tests (slower, broader). Use integration tests for wiring, configuration, and critical paths.
- **Minimal vs full context:** Minimal context keeps tests fast and explicit; full or slice context reduces custom test config but increases scope and time.
- **@MockBean vs test config:** `@MockBean` is quick for replacing one bean; a dedicated test `@Configuration` with `@Primary` beans gives more control and works in non-Boot Spring too.

---

## Practical Lessons

- Write unit tests for services and domain logic: create the object, inject mocks, assert. No `@SpringBootTest` or `@ContextConfiguration` needed.
- For integration tests, create a small `@Configuration` (or use a slice) that defines only the beans under test; use `@ActiveProfiles("test")` for test-only beans.
- Use `@MockBean` to replace external or heavy beans (HTTP client, message broker) in integration tests so they stay fast and deterministic.
- Avoid depending on test order or shared mutable state; the context is shared, but each test should be independent.
- Run unit tests on every build; run heavier integration tests in CI or before commit as needed.

---

## Senior interview Q&A

**1. What is the difference between a unit test and an integration test in a Spring application? When would you use each?**

- **Unit test:** Tests a single class (or small unit) in isolation. Dependencies are replaced by mocks (e.g. Mockito). No Spring context. Fast and focused. Use for business logic, services, and domain behavior.
- **Integration test:** Runs with a real Spring `ApplicationContext`. Verifies that beans are wired correctly, configuration is loaded, and components work together. Slower; use for critical wiring, configuration, or end-to-end slices (e.g. repository + transaction, controller + service).

**2. What is the TestContext framework? What problem does it solve?**

- The **TestContext framework** is Spring’s support for running tests inside a real `ApplicationContext`. It manages context loading, caching, and injection of beans into test classes. It solves the problem of “I need to test my beans as they are actually wired and configured” without manually building the context in every test. You declare the configuration (e.g. `@ContextConfiguration`); the framework creates and reuses the context and injects dependencies into your test class.

**3. How do you load a minimal Spring context in a JUnit 5 test? How would you replace one bean with a mock?**

- **Load context:** Use `@ExtendWith(SpringExtension.class)` and `@ContextConfiguration(classes = { MyConfig.class })` so the TestContext builds an `ApplicationContext` from `MyConfig`. Inject beans into the test with `@Autowired`.
- **Replace with mock:** In Spring Boot, use `@MockBean` on a field; the context will inject a Mockito mock for that type instead of the real bean. In plain Spring, define a test `@Configuration` that declares a `@Primary` bean of the same type (e.g. a mock or stub) so the test gets the test double.

**4. What is context caching in the TestContext framework? Why does it matter?**

- **Context caching** means the TestContext framework reuses the same `ApplicationContext` instance across multiple test classes when they declare the same configuration (same set of config classes, same active profiles, etc.). The first test that needs that context triggers the load; subsequent tests reuse it. It matters because starting the context is expensive; caching keeps the test suite faster. Tests must not rely on order or mutate shared bean state in a way that affects other tests.

**5. Why prefer unit tests without the Spring context for business logic? How does DI help?**

- **Prefer unit tests** for business logic because they are fast, don’t depend on Spring, and pinpoint failures to a single class. You control all dependencies (mocks), so behavior is deterministic and easy to reason about.
- **DI helps** because the class under test receives its dependencies via constructor or setter. In the test you simply pass mocks instead of real implementations; no container needed. Without DI, you might need static factories or hard-coded `new`, which makes substituting mocks difficult. With DI, testing is “instantiate the class and inject mocks.”

---

## Final Recap

Chapter 4 covers **testing with Spring**. Use **unit tests** (no context, inject mocks) for most business logic. Use **integration tests** with the **TestContext framework** when you need to verify wiring and configuration; load a **minimal context** or use Boot slices. Use **@MockBean** or test config to replace heavy or external beans. Apply **profiles** (e.g. `test`) for test-only configuration. Prefer fast, independent unit tests; add integration tests for critical paths and container behavior. Next: AOP, data access, or web layers depending on your track. See [Chapter 3](spring-6-chapter-3-summary.md) for lifecycle; [Chapter 2](spring-6-chapter-2-summary.md) for configuration.
