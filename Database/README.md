# Gig Marketplace Platform — ER Model

A normalized database design for a two-sided gig marketplace where clients post tasks and gig professionals apply to complete them.

## Overview

The platform follows a task-based marketplace model rather than a service listing system. Clients post tasks, gig professionals apply, and the platform manages the lifecycle from **application → hiring → deliverable → payment → review**.

The schema is normalized to **Third Normal Form (3NF)** and supports:

* Individual and organization-based hiring
* Optional manager accounts for delegated hiring
* End-to-end task lifecycle tracking
* Bidirectional reviews after task completion

## Entities

The system consists of the following core entities:

* **USERS**
* **CLIENT**
* **ORGANIZATION**
* **MANAGER**
* **GIG_PROFESSIONAL_PROFILE**
* **PROFILE_SKILLS**
* **PROFILE_TOOLS**
* **PROFILE_PORTFOLIO**
* **TASKS**
* **APPLICATION**
* **DELIVERABLES**
* **PAYMENTS**
* **REVIEWS**

Attributes and constraints for these entities are defined in the ER diagram.

## Relationships

Key relationships in the system include:

* **USERS** may act as **CLIENTS** or **GIG PROFESSIONALS**
* **CLIENTS** post **TASKS**
* **CLIENTS** may optionally create **MANAGER** accounts
* **ORGANIZATIONS** group multiple **CLIENT** accounts
* **GIG PROFESSIONALS** apply to **TASKS** through **APPLICATION**
* Accepted applications produce **DELIVERABLES**
* Approved deliverables generate **PAYMENTS**
* Both parties can leave **REVIEWS** after task completion
* **GIG PROFESSIONAL** profiles maintain **SKILLS**, **TOOLS**, and **PORTFOLIO** links

---

## Normalization

### First Normal Form (1NF)

**GIG_PROFESSIONAL_PROFILE** originally contained multi-valued attributes (skills, tools, portfolio_links).

These were decomposed into:

* **PROFILE_SKILLS**
* **PROFILE_TOOLS**
* **PROFILE_PORTFOLIO**

Each row now stores one value only, satisfying atomicity.

### Second Normal Form (2NF)

Relations with composite keys were evaluated for partial dependencies:

* **PROFILE_SKILLS**
* **PROFILE_TOOLS**
* **APPLICATION**
* **REVIEWS**

No partial dependencies were found, so all relations satisfy 2NF.

### Third Normal Form (3NF)

A transitive dependency existed between client and organization data:

* `client_id → org_id → root_client_id`
* `manager_id → org_id → root_client_id`

To remove this dependency, a separate **ORGANIZATION** entity was introduced. **CLIENT** and **MANAGER** now reference `org_id` via foreign keys. All relations are therefore in 3NF.

---

## Functional Dependencies

### USERS

* `user_id → name, email, role, created_at`
* `email → user_id`

### CLIENT

* `client_id → user_id, client_name, domain`
* `user_id → client_id`

### MANAGER

* `manager_id → client_id, current_profiles_managed, tasks_managed`

### GIG_PROFESSIONAL_PROFILE

* `gig_profile_id → user_id, bio, rating`
* `user_id → gig_profile_id`

### SKILLS

* `(gig_profile_id, skill) → skill`

### TOOLS

* `(gig_profile_id, tool) → tool`

### PORTFOLIO_LINK

* `(gig_profile_id, portfolio_link) → portfolio_link`

### TASKS

* `task_id → client_id, manager_id, title, description, budget, due_date, status`

### APPLICATION

* `application_id → gig_profile_id, task_id, status, created_at`
* `(gig_profile_id, task_id) → status, created_at`

### DELIVERABLES

* `deliverable_id → task_id, gig_profile_id, submission_path, status, created_at`
* `task_id → deliverable_id`

### PAYMENT

* `payment_id → task_id, client_id, user_id, amount`
* `task_id → payment_id`

### REVIEWS

* `review_id → reviewer_id, reviewee_id, task_id, rating, comment`
* `(reviewer_id, task_id) → rating, comment`

---

## Design Decisions

* Manager accounts are optional. Root clients can perform all manager actions directly.
* **APPLICATION** acts as an aggregation entity between profiles and tasks.
* **ORGANIZATION** was introduced during normalization to eliminate transitive dependencies.
* One task produces at most one deliverable and one payment.
* Skills, tools, and portfolio links are stored in separate tables due to 1NF decomposition.

## Future Extensions

Potential improvements for future versions include:

* Messaging between clients and gig professionals
* Notification system for task and payment updates
* Standardized skill taxonomy
* Escrow-based milestone payments
* Platform analytics and performance metrics
