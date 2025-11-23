---
title: "Philosophy"
description: "Understanding Mage's design principles and goals"
layout: "article"
---

# Philosophy

Mage exists because web frameworks often make simple things complicated. We
built Mage around a different set of priorities: predictability, security, and
getting out of your way.

## Predictability Over Cleverness

Framework magic feels great in demos. In production, when you're debugging at
2am, you want boring and predictable.

Mage doesn't have magic. Routes are functions. Middleware is just functions that
run before routes. Context is an object with your request and response. That's
it. When you read the stack trace, you see your code, not framework internals
you don't control.

We made trade-offs for this:

- No automatic dependency injection
- No decorators that hide control flow
- No implicit global state

The framework does less, which means you write more explicit code. That code is
easier to debug, easier to test, and easier for the next developer to
understand.

## Security by Default

Most security vulnerabilities aren't sophisticated. They're boring mistakes:
missing validation, forgotten headers, path traversal bugs.

Mage includes security features because developers shouldn't have to remember
them:

- Path traversal protection is automatic in routing and file serving
- Schema validation with Standard Schema support (Zod, Valibot, ArkType)
- CSRF middleware uses modern browser security features (Sec-Fetch-Site)
- Rate limiting, security headers, CSP, CORS are available out of the box
- Body size limits prevent simple DoS attacks

This isn't comprehensive security—you still need to handle auth properly and not
trust user data. But validation, common protections, and security headers are
built-in, not afterthoughts.

## Type Safety Without Configuration

TypeScript's value is catching mistakes before production. Mage is
TypeScript-native: if it compiles, you haven't misspelled a method, passed the
wrong type, or forgotten a parameter.

No configuration needed. No tsconfig.json to get right. Just import and use—Deno
handles the rest.

Type inference means you don't fight the type system. When you call
`c.req.valid("json")`, TypeScript knows the type based on your schema. When you
return `c.json()`, TypeScript knows it returns a Response.

## Simple Abstractions

Good abstractions hide complexity. Bad abstractions hide too much.

Mage's abstractions are thin:

- `MageRequest` wraps `Request` to add memoized body parsing—you can read the
  body multiple times without errors
- `MageResponse` delays creating the Response object until the end—middleware
  can modify headers without creating multiple Response objects
- `MageContext` bundles request, response, and helper methods—one object instead
  of passing three parameters

These solve real problems (reading body multiple times causes errors in vanilla
Deno, creating multiple Response objects is wasteful), but you can still see
through them. You know you're handling HTTP requests, not framework-specific
constructs.

## Fast Enough

Mage prioritizes developer experience and security over raw performance. It's
fast enough for production, but it's not the fastest Deno framework.

We use linear search (O(n)) for routing instead of radix trees. Why? Linear
search has near-zero overhead at startup, making it ideal for serverless where
cold start matters more than routing thousands of requests in one instance. For
most applications with dozens or hundreds of routes, the difference is
microseconds.

If you need maximum throughput for thousands of routes, use a different
framework. If you need fast cold starts and reasonable performance for typical
apps, Mage works well.

## Explicit Over Implicit

Implicit behavior causes surprises. Mage makes you write things explicitly:

- Middleware doesn't run unless you add it with `app.use()` or on specific
  routes
- Routes don't automatically parse JSON—call `c.req.json()` when you need it
- Nothing happens globally without you asking for it

This means more typing, but fewer surprises. When you look at a route handler,
you see what runs and in what order.

## Batteries Included, But Optional

Common tasks shouldn't require external dependencies. Mage includes:

- Middleware for CORS, CSRF, compression, rate limiting, validation
- Cookie handling with signing support
- Static file serving
- Logging utilities
- Status code helpers

Use what you need, ignore the rest. Want to use a different CORS library? Don't
use Mage's. Prefer structured logging? Use your own logger. The included tools
work well for most cases, but nothing forces you to use them.

## Flexible by Design

The `MageRouter` interface means you can swap routing implementations. Today
there's only LinearRouter, but you could build a radix tree router, a
regex-based router, or something domain-specific.

Middleware is just functions—write your own or use third-party middleware.
Authentication, database connections, caching, whatever your application needs.

Mage doesn't include a database layer, ORM, template engine, or authentication
system. Those are application concerns, not framework concerns. Use what fits
your project.

## Production First

Mage's defaults assume you're building for production:

- Security headers are available and easy to apply
- Error handling is explicit (throw `MageError` for HTTP errors)
- Request IDs for tracing
- Rate limiting with pluggable stores
- Validation errors can be hidden from clients

These aren't afterthoughts—they're part of the core design.

## What Mage Isn't

Mage isn't trying to be everything:

- Not a full-stack framework with opinions on database, auth, and frontend
- Not a mature ecosystem with hundreds of plugins
- Not a Rails or Django equivalent with scaffolding and conventions for
  everything

If you need those things, use a different tool. Mage is for developers who want
a solid foundation with good defaults, not a complete application framework.

## The Goal

Build predictable software. Get security right by default. Let TypeScript catch
mistakes. Make debugging straightforward. Be fast enough for production.

That's Mage. Thanks for being interested enough to read this far!
