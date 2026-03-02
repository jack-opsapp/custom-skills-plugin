# Bible Structure — Section Templates

Templates for scaffolding each bible file. Adapt sections to the project — skip irrelevant ones, add project-specific ones.

## README.md Template

```markdown
# [Project Name] Software Bible

**Complete Technical Documentation for [Project Name]**

This documentation serves as the comprehensive reference for [Project Name]. It enables any developer or AI agent with zero prior context to understand the full project.

---

## Document Navigation

### [00_EXECUTIVE_SUMMARY.md](00_EXECUTIVE_SUMMARY.md)
**High-level overview**
- What the project is, who it's for
- Tech stack and key stats
- Architecture overview

### [01_PRODUCT_REQUIREMENTS.md](01_PRODUCT_REQUIREMENTS.md)
**Feature inventory**
- Complete feature catalog
- User stories and business rules

[...repeat for each file...]

---

## Quick Reference

**"I need to understand the business"** → [00_EXECUTIVE_SUMMARY.md]
**"I need to know what features exist"** → [01_PRODUCT_REQUIREMENTS.md]
**"I need to build the UI"** → [02_USER_EXPERIENCE.md] + [05_DESIGN_SYSTEM.md]
**"I need to implement the data layer"** → [03_DATA_ARCHITECTURE.md]
**"I need to implement API calls"** → [04_API_AND_INTEGRATION.md]
**"I need to understand the codebase"** → [06_TECHNICAL_ARCHITECTURE.md]
**"I need to deploy"** → [08_DEPLOYMENT_AND_OPERATIONS.md]
**"I need to understand dependencies"** → [09_ECOSYSTEM_AND_DEPENDENCIES.md]

---

## Statistics

- **Total Documents:** N
- **Coverage:** [X] files, [Y] models, [Z] endpoints, [W] components
```

---

## 00_EXECUTIVE_SUMMARY.md Sections

1. **Project Overview** — One-paragraph description
2. **Target Users/Market** — Who uses this and why
3. **Core Value Propositions** — Why this exists, what makes it different
4. **Key Statistics** — File counts, model counts, tech stack bullet points
5. **Technology Stack** — Languages, frameworks, databases, services (with versions)
6. **Architecture Overview** — High-level text diagram showing system components
7. **Changelog**

---

## 01_PRODUCT_REQUIREMENTS.md Sections

1. **Feature Inventory** — Table: feature name, description, status (shipped/planned)
2. **User Roles/Personas** — Each role with permissions and capabilities
3. **User Stories by Role** — Grouped by persona
4. **Business Rules** — Constraints, validation rules, access control
5. **Non-Functional Requirements** — Performance, security, offline, accessibility
6. **Changelog**

---

## 02_USER_EXPERIENCE.md Sections

1. **Navigation Architecture** — How users move through the app
2. **Screen/Page Catalog** — Every distinct screen with key UI elements
3. **User Flows** — Common journeys mapped step by step
4. **Interaction Patterns** — Gestures, keyboard shortcuts, form patterns
5. **Role-Based Differences** — How UI varies by user role
6. **Onboarding Flow** — First-time user experience
7. **Changelog**

---

## 03_DATA_ARCHITECTURE.md Sections

1. **Overview** — Data layer architecture summary
2. **Core Models** — Each entity with full property table, relationships, computed properties
3. **Database Schema** — Tables, columns, types, constraints, indexes
4. **Entity Relationship Map** — Text-based ER diagram
5. **DTOs / Data Transfer Objects** — API mapping layer
6. **Enums Reference** — All enum types with values
7. **Migration History** — Chronological list of schema changes
8. **Query Patterns** — Common queries and their predicates
9. **Changelog**

---

## 04_API_AND_INTEGRATION.md Sections

1. **Architecture Summary** — Backend stack, system diagram
2. **Authentication Flow** — How auth works end to end
3. **API Endpoints** — Every endpoint: method, path, params, response, errors
4. **Third-Party Integrations** — Each service: what, why, how connected
5. **Sync Strategy** — How data syncs (if applicable): push, pull, real-time
6. **Error Handling** — Error codes, retry logic, fallbacks
7. **Rate Limiting** — Limits and debouncing strategy
8. **Webhook/Event Handling** — Inbound webhooks, event processing
9. **Changelog**

---

## 05_DESIGN_SYSTEM.md Sections

1. **Color Palette** — Every color with exact hex, usage context
2. **Typography** — Font families, size scale, weight usage
3. **Spacing and Layout** — Grid system, spacing scale, breakpoints
4. **Component Catalog** — Each reusable component: name, props, usage example
5. **Icon System** — Icon library, custom icons, naming convention
6. **Status/State Colors** — Color meanings for states (error, success, warning, etc.)
7. **Design Principles** — Guiding design philosophy
8. **Changelog**

---

## 06_TECHNICAL_ARCHITECTURE.md Sections

1. **Directory Structure** — File tree with purpose annotations
2. **Architectural Pattern** — MVVM, MVC, Clean Architecture, etc.
3. **State Management** — How app state is managed
4. **Navigation/Routing** — How navigation works
5. **Dependency Injection** — DI patterns and container
6. **Error Handling Strategy** — How errors propagate and are handled
7. **Performance Patterns** — Caching, lazy loading, optimization techniques
8. **Testing Strategy** — Test types, coverage, test utilities
9. **Changelog**

---

## 07_SPECIALIZED_FEATURES.md Sections

One section per complex feature:

```markdown
### Feature Name

**Source**: `path/to/main/files`
**Dependencies**: List of services/models used

**Overview**: What this feature does

**Architecture**: How it's built (data flow, components involved)

**Key Implementation Details**: Non-obvious logic, algorithms, edge cases

**Configuration**: Settings, flags, thresholds
```

Plus changelog at bottom.

---

## 08_DEPLOYMENT_AND_OPERATIONS.md Sections

1. **Build Configuration** — Build tools, targets, compilation settings
2. **Environment Variables** — Complete registry (see formatting guide for table format)
3. **CI/CD Pipeline** — Build, test, deploy steps
4. **Deployment Process** — How to deploy to each environment
5. **Infrastructure** — Hosting, CDN, database, storage services
6. **Monitoring & Logging** — What's tracked, where logs go
7. **Secrets Management** — How secrets are stored and rotated (not the secrets themselves)
8. **Production Checklist** — Pre-deploy verification steps
9. **Changelog**

---

## 09_ECOSYSTEM_AND_DEPENDENCIES.md Sections

1. **Project Map** — All sub-projects/apps with one-line descriptions
2. **Inter-Project Dependencies** — How projects connect (APIs, shared libs, data)
3. **Deployment Topology** — Text diagram showing how services connect in production
4. **External Services** — Third-party services with purpose, version, criticality
5. **Key Package Dependencies** — Important packages (not exhaustive — focus on architectural choices)
6. **Shared Libraries/Utilities** — Internal shared code
7. **Data Flow Between Systems** — How data moves across project boundaries
8. **Changelog**

---

## Deciding Which Files to Create

Not every project needs all files. Guidelines:

| Project Type | Skip |
|-------------|------|
| CLI tool | `02_USER_EXPERIENCE.md`, `05_DESIGN_SYSTEM.md` |
| API-only backend | `02_USER_EXPERIENCE.md`, `05_DESIGN_SYSTEM.md` |
| Static site | `03_DATA_ARCHITECTURE.md`, `04_API_AND_INTEGRATION.md` |
| Single-app (no ecosystem) | `09_ECOSYSTEM_AND_DEPENDENCIES.md` |
| Library/package | `02_USER_EXPERIENCE.md`, `07_SPECIALIZED_FEATURES.md` |

Always create: `README.md`, `00_EXECUTIVE_SUMMARY.md`, `06_TECHNICAL_ARCHITECTURE.md`, `08_DEPLOYMENT_AND_OPERATIONS.md`
