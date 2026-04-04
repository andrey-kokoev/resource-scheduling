# Batch-Flow Workspace UX Boundary (v1)

> Primary user experience for one batch-flow scheduling workspace.

## Overview

This document defines the recommended user experience for interacting with a single batch-flow workspace. It is the UX companion to the API boundary specification.

**Core principle:** The workspace is centered on the **current applied schedule**, not on model editing, compile output, or graph visualization.

## Table of Contents

1. [What A Workspace Is](#what-a-workspace-is)
2. [Primary User Intent](#primary-user-intent)
3. [Workspace Layout](#workspace-layout)
4. [Draft vs Current State Model](#draft-vs-current-state-model)
5. [User Interaction Loop](#user-interaction-loop)
6. [Validation UX](#validation-ux)
7. [Compile and Diagnostics](#compile-and-diagnostics)
8. [Explicit Non-Goals](#explicit-non-goals)

---

## What A Workspace Is

A workspace is a **combined living document** containing:

```
┌─────────────────────────────────────────────────────────────┐
│  WORKSPACE                                                  │
├─────────────────────────────────────────────────────────────┤
│  Factory Setup          │  Work to Do        │  Schedule    │
│  ─────────────────────  │  ────────────────  │  ─────────   │
│  • Processor Types      │  • Batches         │  • Applied   │
│  • Processor Instances  │  • Release Times   │    Schedule  │
│  • Changeover Rules     │  • Due Dates       │              │
└─────────────────────────────────────────────────────────────┘
```

**It should feel like:** A schedule that can be edited and regenerated.

**It should NOT feel like:**
- A pure database model editor
- A graph visualization tool
- A constraint programming IDE

---

## Primary User Intent

### Default Assumption

> The user opened this workspace to **update or repair the current schedule** after something changed.

**Stronger than:**
- Building a model from scratch
- Exploring solver internals
- Running what-if analyses in the abstract

### Example Scenarios

| Scenario | User Goal |
|----------|-----------|
| New rush order arrived | Add batch, re-solve, apply new schedule |
| Machine went down | Remove processor instance, re-solve, repair schedule |
| Batch delayed | Edit batch release time, re-solve, apply |
| Route change | Update batch type route, validate, solve, apply |

---

## Workspace Layout

### Recommended Default Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Workspace Name | Status: [Current/Draft Conflict] | Solve  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐  │
│  │                              │  │                             │  │
│  │   MACHINE TIMELINE VIEW      │  │   BATCH / ROUTE VIEW        │  │
│  │                              │  │                             │  │
│  │   [████████████████████]     │  │   Batch A: step1→step2→step3│  │
│  │   Machine 1: [A][B][  C ]    │  │   Batch B: step1→step2      │  │
│  │   Machine 2: [  D][E  ]      │  │                             │  │
│  │                              │  │   [Timeline per batch]      │  │
│  │   Current: solid colors      │  │                             │  │
│  │   Draft preview: outlines    │  │                             │  │
│  │                              │  │                             │  │
│  └──────────────────────────────┘  └─────────────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  INSPECTOR (contextual, collapsible)                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  [Selected: Batch A]                                          │  │
│  │  Name: [Batch A________]  Type: [T1 ▼]                        │  │
│  │  Release: [___]  Due: [___]  Lot: [___]                       │  │
│  │  ─────────────────────────────────────────────────────────    │  │
│  │  ⚠️ 3 validation issues block solve                           │  │
│  │     • Route step 2 references deleted processor type          │  │
│  │     • ...                                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Layout Decisions

| Element | Placement | Rationale |
|---------|-----------|-----------|
| Machine timeline | Left or top half | Primary schedule visualization |
| Batch/route view | Right or bottom half | Work-centric perspective |
| Inspector | Side panel or overlay | Contextual editing without leaving context |
| Solve/Apply CTAs | Header | Always accessible, contextual enablement |
| Validation issues | Inspector + inline | Close to relevant controls |

### What to Avoid as Primary Layout

- ❌ Full-screen table editors for entities
- ❌ Modal wizards for common edits
- ❌ Graph view as the main workspace
- ❌ Compile output as the primary view

---

## Draft vs Current State Model

### State Model

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  CURRENT SAVED  │      │     DRAFT       │      │  PREVIEW (opt)  │
│  ─────────────  │      │  ──────────     │      │  ─────────────  │
│                 │      │                 │      │                 │
│  Last applied   │◄────►│  Unsaved edits  │◄────►│  Solve result   │
│  schedule state │      │  in memory      │      │  not yet applied│
│                 │      │                 │      │                 │
│  Persistent     │      │  Transient      │      │  Transient      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │
        ▼
┌─────────────────┐
│  API: GET /     │
│  workspaces/:id │
└─────────────────┘
```

### Visual Differentiation

| Element | Current State | Draft Changes | Preview |
|---------|--------------|---------------|---------|
| Machine timeline | Solid blocks | Outline overlay | Ghost/transparent overlay |
| Batch list | Normal | Yellow dot indicator | Split view or toggle |
| Inspector | Read-only | Editable fields | Read-only with diff |

### Draft Semantics

**Draft is created when:**
- User edits any field in inspector
- User adds/removes entity via context menu

**Draft is discarded when:**
- User explicitly cancels
- User applies a new schedule
- User leaves workspace (with confirmation if unsaved)

**Draft indicators:**
- "Unsaved changes" badge in header
- Dot indicators on modified entities
- Disabled solve button with tooltip if invalid

---

## User Interaction Loop

### Primary Loop

```
     ┌───────────────┐
     │ 1. INSPECT    │
     │ Current       │
     │ Schedule      │
     └───────┬───────┘
             │
             ▼
     ┌───────────────┐
     │ 2. EDIT DRAFT │◄────────┐
     │ (inspector)   │         │
     └───────┬───────┘         │
             │                 │
             ▼                 │
     ┌───────────────┐         │
     │ 3. VALIDATE   │─────────┘ (if invalid,
     │ Inline issues │          loop back)
     └───────┬───────┘
             │
             ▼
     ┌───────────────┐
     │ 4. SOLVE      │
     │ (preview)     │
     └───────┬───────┘
             │
             ▼
     ┌───────────────┐
     │ 5. COMPARE    │
     │ Preview vs    │
     │ Current       │
     └───────┬───────┘
             │
             ▼
     ┌───────────────┐
     │ 6. APPLY      │
     │ (or discard)  │
     └───────┬───────┘
             │
             ▼
     ┌───────────────┐
     │ 7. NEW        │
     │ Current       │
     │ Schedule      │
     └───────────────┘
```

### Detailed Interactions

#### 1. Inspect Current Schedule

- Machine timeline shows current applied schedule
- Batch list shows all batches with current assignments
- Click any element to open inspector (read-only initially)

#### 2. Edit Draft

- Inspector switches to edit mode
- Changes apply to draft state only
- "Reset" button reverts to current saved state

#### 3. Validation

- Automatic on every edit
- Issues shown inline in inspector
- Header shows aggregate status
- Solve button disabled until valid

#### 4. Solve (Preview)

- Click "Solve" to run solver on draft
- Result shown as preview overlay
- Compare mode: current vs preview side-by-side or toggle

#### 5. Apply

- Click "Apply" to commit preview to current schedule
- Confirmation if changes are destructive
- New schedule becomes the current baseline

---

## Validation UX

### Validation Display

```
┌─────────────────────────────────┐
│  Batch: B-2026-001          [X] │
├─────────────────────────────────┤
│  Name: [Mixture A________]      │
│  Type: [Reaction Type 1 ▼]      │
│                                 │
│  ⚠️ Validation Issues (2)        │
│  ┌───────────────────────────┐  │
│  │ • Invalid: Type 'Reaction  │  │
│  │   Type 1' has no route    │  │
│  │ • Warning: Due date before│  │
│  │   release date            │  │
│  └───────────────────────────┘  │
│                                 │
│  [Save to Draft]  [Cancel]      │
└─────────────────────────────────┘
```

### Validation Behavior

| State | Visual | Action |
|-------|--------|--------|
| Valid | Green check, "Ready to solve" | Solve button enabled |
| Warning | Yellow triangle, warnings listed | Solve enabled, warnings shown |
| Invalid | Red X, blocking issues listed | Solve disabled, issues highlighted |

### Key Principles

- **Inline:** Errors appear next to relevant fields
- **Immediate:** Validate on blur or debounced input
- **Contextual:** Don't leave workspace context for validation
- **Actionable:** Each error suggests how to fix

---

## Compile and Diagnostics

### Compile Role

**Compile is secondary.** It exists for:

- Advanced debugging
- Understanding solver behavior
- Export to external tools
- Educational exploration

**Not for:**
- Primary user workflow
- Schedule reasoning
- Everyday schedule changes

### Diagnostics Panel

```
┌──────────────────────────────────────────────────────────────┐
│  DIAGNOSTICS (collapsed by default)              [▼]         │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Compiled     │  │ Solver Graph │  │ Constraint Model │   │
│  │ Projection   │  │ (for debug)  │  │ (for debug)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Access Pattern

- Collapsed by default
- Expand via "Advanced" or "Diagnostics" toggle
- Remember user preference per session
- Never block primary workflow

---

## Explicit Non-Goals

The primary workspace UX is **NOT** centered on:

| Feature | Why Excluded | Where It Belongs |
|---------|--------------|------------------|
| Raw graph browsing | Too abstract | Diagnostics panel |
| Constraint inspection | Implementation detail | Diagnostics panel |
| Entity CRUD tables | Not schedule-focused | Import/export utilities |
| Full-page wizards | Breaks context | Onboarding only |
| Auto-apply scheduling | Too dangerous | Explicit apply only |
| Compile-as-primary-step | Wrong abstraction | Automatic on solve |
| Multi-workspace comparison | Out of scope | Future feature |
| Historical schedule compare | Out of scope for v1 | Future feature |

---

## Summary

| Aspect | UX Choice |
|--------|-----------|
| Center of workspace | Current applied schedule |
| Primary action | Edit draft → solve → apply |
| Default view | Machine timeline + batch view (balanced split) |
| Editing mode | Contextual inspector, not full-page |
| Draft visibility | Always visible vs current state |
| Validation | Inline, immediate, blocking |
| Compile | Secondary diagnostics only |
| Solve result | Preview before apply |
| Apply | Explicit user confirmation |

---

## Wireframe Reference

### Happy Path: Edit and Apply

```
[Initial State]              [Editing Draft]              [Preview]                [Applied]
┌────────────┐              ┌────────────┐              ┌────────────┐          ┌────────────┐
│ Schedule   │   Click      │ Inspector  │   Solve      │ Preview    │  Apply   │ New        │
│ shown      │ ───────────► │ open,      │ ───────────► │ overlay    │ ────────►│ Schedule   │
│            │   Batch A    │ editing    │              │ on current │          │ current    │
└────────────┘              └────────────┘              └────────────┘          └────────────┘
```

### Validation Block

```
[Editing]                   [Invalid]                   [Fixed]                   [Solved]
┌────────────┐             ┌────────────┐             ┌────────────┐            ┌────────────┐
│ Type       │  Invalid    │ Red errors │  Fix type   │ Green      │  Solve    │ Preview    │
│ cleared    │ ──────────► │ in insp.   │ ──────────► │ checkmark  │ ────────► │ available  │
│ (was req)  │             │ Solve btn  │             │ Solve btn  │           │            │
└────────────┘             │ disabled   │             │ enabled    │           └────────────┘
                           └────────────┘             └────────────┘
```
