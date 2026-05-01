# Documentation Audit & Consolidation Plan - Room Planner AI

This document outlines the findings from an audit of the root markdown files and provides a plan for consolidation to reduce duplication and establish clear "Sources of Truth".

## 1. Audit Results

### File Status Table

| File | Primary Role | Status | Overlaps With |
| :--- | :--- | :--- | :--- |
| `README.md` | High-level overview & Entry point | **Keep** | `Project_Summary.md` |
| `ARCHITECTURE.md` | System structure & Data models | **Keep** | `TECHNICAL_DOCS.md` |
| `USER_GUIDE.md` | End-user workflow & navigation | **Keep** | `FUNCTIONALITY.md` |
| `TECHNICAL_DOCS.md` | Geometric math & Core logic | **Keep** | `CONCEPT.md`, `GEO_SPEC.md`, `FUNC_SPEC.md` |
| `FIREBASE_AUTH_SETUP.md`| Critical domain authorization guide | **Keep** | None (Setup Specific) |
| `CONCEPT.md` | Early geometry theory | *Merge/Archive*| `TECHNICAL_DOCS.md` |
| `FUNCTIONALITY.md` | Detailed features (Bulgarian) | *Merge/Archive*| `USER_GUIDE.md` |
| `Project_Summary.md` | Marketing summary | *Merge/Archive*| `README.md` |
| `GEOMETRY_SPEC.md` | Regression prevention rules | *Merge/Archive*| `TECHNICAL_DOCS.md` |
| `FUNCTIONAL_SPEC_ROOM_DRAWING.md`| Drawing lifecycle details | *Merge/Archive*| `TECHNICAL_DOCS.md` |

---

## 2. Consolidation Matrix (Duplication Patterns)

| Topic | Primary Source | Duplicated In |
| :--- | :--- | :--- |
| **Feature List** | `README.md` | `Project_Summary.md`, `FUNCTIONALITY.md` |
| **Geometry Math** | `TECHNICAL_DOCS.md` | `CONCEPT.md`, `GEOMETRY_SPEC.md`, `FUNC_SPEC_ROOM_DRAWING.md`|
| **User Navigation** | `USER_GUIDE.md` | `FUNCTIONALITY.md` |
| **Snapping / Collision** | `TECHNICAL_DOCS.md` | `CONCEPT.md`, `GEOMETRY_SPEC.md` |
| **Data Models** | `ARCHITECTURE.md` | `TECHNICAL_DOCS.md`, `FUNC_SPEC_ROOM_DRAWING.md` |
| **Shortcuts** | `USER_GUIDE.md` | `FUNCTIONALITY.md` |

---

## 3. Practical Consolidation Plan (The "Cleanup List")

### Phase 1: High-Level (README & Project Summary)
*   **Action**: Enhance `README.md` with the "User-Centric Features" section from `Project_Summary.md`.
*   **Result**: `README.md` is the only general marketing/overview file.

### Phase 2: User Support (Usage & Functionality)
*   **Action**: Translate unique details (Shortcuts table, precise tool behaviors) from `FUNCTIONALITY.md` into `USER_GUIDE.md`.
*   **Result**: `USER_GUIDE.md` is the one-stop-shop for how to use the app.

### Phase 3: Technical & Geometry (The "Bento" Technical Spec)
*   **Action**: Create a unified `TECHNICAL_DOCS.md` that absorbs:
    *   Theory from `CONCEPT.md` (Centerlines vs Inner Face).
    *   Parity rules from `GEOMETRY_SPEC.md` (Regression avoidance).
    *   Lifecycle logic from `FUNCTIONAL_SPEC_ROOM_DRAWING.md` (Initiation -> Snap -> Closure).
*   **Action**: Maintain `ARCHITECTURE.md` as the high-level roadmap of the codebase (Folders/Slices).

### Phase 4: Non-Negotiables
*   **DO NOT DELETE**: `FIREBASE_AUTH_SETUP.md`. It solves a very specific, recurring user problem (domain authorization) and is formatted as a standalone troubleshooting guide.

---

## 4. Source of Truth Map (Post-Cleanup)

1.  **`README.md`**: What is this? What does it do?
2.  **`USER_GUIDE.md`**: How do I use it? (Shortcuts, Workflow).
3.  **`ARCHITECTURE.md`**: Where is the code? How is the state structured?
4.  **`TECHNICAL_DOCS.md`**: How does the math/snapping/geometry work?
5.  **`FIREBASE_AUTH_SETUP.md`**: Why can't I log in? (Setup guide).
