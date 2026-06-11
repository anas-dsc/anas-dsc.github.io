---
title: "Can We Trust AI Agents? The 'Human-on-Top' Necessity"
date: 2026-04-07
description: "An experiment using Claude as the architect and local models for routine coding — and what went right and wrong."
tags: [ai-agents, local-llms, backend, claude]
categories: [AI, Experiments]
---

Can we truly trust AI agents to work independently? 😃 I recently ran an experiment to find out. I used **Claude Model** to act as the architect and decision-maker, while using smaller, local models for the routine coding. The goal was to build **Smart Travel Deal Hunter**, an app that tracks travel prices and plans affordable trips.

---

### Method

I used **Claude 4.5 Opus** as the architect and first reviewer. I provided a clear idea and asked it to plan a free MVP. It defined the architecture, broke down tasks and selected external services. Everything was documented in markdown files. It also reviewed code before it was pushed to Git.

For implementation, I used local open source models including **Devstral 2 123B Instruct**, **GLM 4.7**, and **Qwen 2.5 Coder 32B**, using each where it performed best. **CodeRabbit** was also used as a second layer of review during pull requests.

### The Tech Stack

Python, FastAPI, Supabase, Next.js, Tailwind CSS, Docker, Redis.

---

### What worked

Local models excelled at the initial foundation. They successfully built the project structure, database schema, and a FastAPI backend with JWT authentication. The best part was the **"self-fixing" loop**. Since local models are free, I let them repeatedly try to fix their own bugs until the code worked. This saved me subscription costs on routine tasks.

### Where it failed

Despite the successful start, letting the AI make the big strategic decisions led to several major issues:

1. **The same model** used for planning and reviewing missed its own flaws. Even after Claude 4.5 Opus approved the code, CodeRabbit still found multiple critical and major issues. This showed the need for an independent second layer of review.
2. Claude selected a **travel API that is being shut down**. By relying on training data instead of real-time validation, it built the app on a foundation that does not work.
3. Local models **struggled with UI design**, producing results that looked basic. At the same time, using Claude for frequent code reviews quickly hit my 300 request limit on GitHub Education, as it was involved in reviewing almost every change.

---

### Conclusion

I'm pausing this specific project. To finish it, I would have to manually verify every strategic choice the AI made. 😐

**Takeaway:** A **"Human-on-Top"** approach is essential. AI is a powerful assistant for building foundations, but it can't handle the strategic phase alone. Even with multiple layers of AI review, mistakes get through. Humans are still needed to verify services, handle ambiguity, and lead the way.

**Next up:** Moving this experiment to my home server lab to test these models with **OpenClaw**.

## Frontend Results & Dashboard

![Travel Hunter Dashboard](/img/posts/ai-experiment/dashboard.png)

![flight-search](/img/posts/ai-experiment/flight-search-page.png)

![flight-search-page-val](/img/posts/ai-experiment/flight-search-page-val.png)
