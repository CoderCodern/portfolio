---
title: QA Automation Roadmap
description: An educational platform delivering 56 structured QA automation lessons across 5 phases — from testing fundamentals to Playwright, API testing, and a full capstone framework.
poster: /projects/qa-roadmap.png
techstack:
  - Next.js
  - TypeScript
  - OpenAI
date: May 2026
category: Education
link: https://qa-roadmap-nhun.vercel.app/
github: https://github.com/CoderCodern/qa-roadmap
---

Personal Project · May 2026 · Solo

An educational web app built around an 8-week QA automation roadmap. Delivers 56 daily lessons across 5 structured phases: Testing Fundamentals, Python for QA, Playwright browser automation, API testing with pytest, and a Capstone framework with career guidance.

## Contributions

- Architected 56 statically pre-rendered lesson pages using Next.js 14 App Router and MDX, with serverless Route Handlers for dynamic features
- Built per-day progress tracking with streak counter, quiz completion, and exercise checklists persisted to localStorage
- Developed interactive lesson components: syntax-highlighted code blocks with copy button, `<Quiz>`, `<ExerciseBox>`, and `<ResourceList>` MDX components
- Integrated OpenAI API for AI-powered exercise review and hint generation
- Added phase-completion reward emails via Resend
- Configured dark/light theme with next-themes and PostHog for analytics
- Deployed to Vercel with environment-gated AI and email features

## Stack

- Next.js 14 / TypeScript / MDX
- Tailwind CSS / next-themes
- OpenAI API / Resend
- Drizzle ORM / NeonDB (serverless PostgreSQL)
- NextAuth / Zustand / PostHog
- Vercel
