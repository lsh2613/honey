---
title: Coordinate Concurrent Credential Renewal
date: 2026-08-04
module: authentication
component: background_job
problem_type: runtime_error
tags:
  - oauth
  - token-refresh
  - concurrency
severity: high
---

# Coordinate Concurrent Credential Renewal

Concurrent background refresh workers can each receive a rotated OAuth
credential. If they write independently, a slower worker can overwrite the
newer credential with the value it received first, leaving subsequent requests
unauthorized.

Use a single-flight lock around refresh for each credential identity. The
worker holding the lock refreshes and persists the rotated credential; other
workers wait, then reuse the persisted result instead of making a competing
refresh request.

