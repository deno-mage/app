# Mage Documentation Plan

This document outlines the priority order for writing documentation for the Mage
web framework.

## Overview

We have 47 documentation pages with placeholder content. This plan organizes
them into tiers based on user journey and importance.

## Tier 1: Critical Path (First Impressions & Getting Started)

**Goal:** Get new users productive quickly with a complete "getting started"
experience.

- [x] `index.md` - Home page introducing Mage's value proposition
- [x] `installation.md` - How to install and set up
- [x] `getting-started.md` - First "Hello World" and basic concepts
- [ ] `core/mage-app.md` - The main application class (fundamental)
- [ ] `core/routing.md` - How routing works (immediate need after hello world)
- [ ] `core/mage-context.md` - Understanding the context object used in every
      handler

## Tier 2: Essential Features (Early User Needs)

**Goal:** Core concepts and most-used features for building real applications.

- [ ] `core/middleware.md` - How middleware works conceptually
- [ ] `core/mage-request.md` - Working with requests
- [ ] `core/mage-response.md` - Working with responses
- [ ] `core/mage-error.md` - Error handling patterns
- [ ] `middleware/cors.md` - Most common security middleware
- [ ] `middleware/validate.md` - Data validation (critical for APIs)

## Tier 3: Security & Production Readiness

**Goal:** What you need before going live.

- [ ] `middleware/csrf.md` - CSRF protection
- [ ] `middleware/rate-limit.md` - Rate limiting
- [ ] `middleware/security-headers.md` - Security headers bundle
- [ ] `advanced/error-handling.md` - Advanced error patterns
- [ ] `advanced/testing.md` - How to test Mage apps
- [ ] `deployment/deno-deploy.md` - Easiest deployment option first

## Tier 4: Additional Middleware & Features

**Goal:** Complete middleware documentation for all built-in options.

- [ ] `middleware/compression.md`
- [ ] `middleware/timeout.md`
- [ ] `middleware/body-size.md`
- [ ] `middleware/csp.md`
- [ ] `middleware/cache-control.md`
- [ ] `middleware/request-id.md`
- [ ] `middleware/serve-files.md`

## Tier 5: Pages Module (Separate Feature)

**Goal:** Document the static site generator feature.

- [ ] `pages/overview.md` - What is the pages module
- [ ] `pages/quick-start.md` - Getting started with pages
- [ ] `pages/file-based-routing.md`
- [ ] `pages/markdown-pages.md`
- [ ] `pages/layouts.md`
- [ ] `pages/assets-and-cache-busting.md`

## Tier 6: Advanced Topics & Reference

**Goal:** Deep dives and utilities.

- [ ] `routers/overview.md` - Router concepts
- [ ] `routers/linear-router.md` - Default router details
- [ ] `utilities/cookies.md`
- [ ] `utilities/logs.md`
- [ ] `utilities/status.md`
- [ ] `core/websockets.md`
- [ ] `advanced/performance.md`
- [ ] `advanced/deployment.md` - General deployment guide

## Tier 7: Additional Deployments & Reference

**Goal:** Complete all deployment options and reference materials.

- [ ] `deployment/cloudflare-workers.md`
- [ ] `deployment/aws-lambda.md`
- [ ] `deployment/docker.md`
- [ ] `deployment/self-hosted.md`
- [ ] `reference/benchmarks.md`
- [ ] `reference/comparison.md`
- [ ] `philosophy.md`
- [ ] `reference/contributing.md`
- [ ] `pages/api-reference.md`

## Progress Tracking

- **Total pages:** 47
- **Tier 1 (Critical):** 6 pages
- **Tier 2 (Essential):** 6 pages
- **Tier 3 (Production):** 6 pages
- **Tier 4 (Middleware):** 7 pages
- **Tier 5 (Pages):** 6 pages
- **Tier 6 (Advanced):** 8 pages
- **Tier 7 (Reference):** 8 pages

## Next Steps

1. Start with Tier 1 documentation
2. Review and iterate based on feedback
3. Continue through tiers systematically
4. Update checkboxes as pages are completed
