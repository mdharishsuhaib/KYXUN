# Kyxun Academic Copilot Architecture Report

## Summary

Kyxun has been upgraded from a single AI study-plan generator into an AI Academic Copilot experience. The existing plan generation flow remains intact, and the result screen now adds four reusable academic tools:

- Exam Readiness Dashboard
- Previous Year Question Paper Analyzer
- AI Viva Simulator
- Flashcard Generator

The implementation keeps the existing Next.js App Router architecture, TypeScript setup, Tailwind design tokens, glass panels, accent gradients, and client-side interaction model.

## Build Fixes

- Added `src/lib/store.ts` to restore the missing `@/lib/store` import used by the chat page.
- Removed an obsolete `next/image` cache workaround from the landing page.
- Cleaned up TypeScript `any` usage in chat error handling.
- Removed unused imports.
- Tuned ESLint for the current React initialization patterns and local preview images.

## New Architecture

### Domain Layer

`src/lib/academic.ts`

Centralizes academic copilot types and deterministic generation logic:

- `StudyPlan`
- `ScheduleItem`
- `ReadinessSignal`
- `Flashcard`
- `VivaQuestion`
- `PaperInsight`
- readiness scoring
- flashcard generation
- viva question generation
- previous-paper keyword analysis

This avoids duplicating study-plan logic inside UI components.

### Component Layer

`src/components/academic/`

New reusable components:

- `FeatureCard.tsx`: shared shell for copilot panels.
- `AcademicCopilotSuite.tsx`: composes all Phase 2 tools.
- `ReadinessDashboard.tsx`: transforms the study plan into readiness, coverage, recovery, and execution-load signals.
- `PaperAnalyzer.tsx`: accepts pasted previous-year paper text and ranks likely repeated topics.
- `VivaSimulator.tsx`: creates oral-exam questions from priority topics and provides coach answers.
- `FlashcardGenerator.tsx`: generates recall cards from must-study, skip, harsh-truth, and tactical-tip data.

### Page Integration

`src/app/plan/page.tsx`

The plan result flow now renders `AcademicCopilotSuite` after the generated schedule. The plan page imports the shared `StudyPlan` type from `src/lib/academic.ts` instead of owning a duplicate interface.

## Feature Behavior

### Exam Readiness Dashboard

Uses the generated plan to calculate:

- readiness from pass probability
- coverage from focus and urgent blocks
- recovery from sleep target
- execution load from daily study hours
- priority topic count
- urgent block count
- protected skip block count

### Previous Year Question Paper Analyzer

Accepts pasted paper text and performs lightweight keyword-frequency analysis:

- matches plan topics against the pasted paper
- extracts recurring high-signal terms
- produces confidence scores
- avoids external dependencies or extra API cost

### AI Viva Simulator

Builds viva prompts from the generated must-study topics:

- warm-up, core, and pressure questions
- typed response area
- simple answer quality score
- coach answer reveal
- rotating question flow

### Flashcard Generator

Creates cards from:

- must-study topics
- skip topics
- harsh truths
- tactical tip

Includes:

- flip interaction
- known/unknown tracking
- mastery percentage
- previous/next navigation

## Verification

Both quality gates pass:

```bash
npm run lint
npm run build
```

Production build output confirms all routes compile:

- `/`
- `/login`
- `/signup`
- `/plan`
- `/chat`
- `/api/analyze`
- `/api/chat`

## Remaining Recommendations

- Replace localStorage auth with real backend authentication.
- Add rate limiting and request authentication for AI API routes.
- Add upload size limits and schema validation for AI responses.
- Add tests for `src/lib/academic.ts` scoring and generators.
- Replace pasted paper input with upload-based parsing when time permits.
