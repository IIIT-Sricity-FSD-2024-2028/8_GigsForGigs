CREATE DATABASE GigsForGigs;
USE GigsForGigs;

---------------------------------------------------------------------------------
-- 1. USERS
--    All actors: client, manager, gig_professional
--    (1)──(1) CLIENT | (1)──(1) MANAGER | (1)──(1) GIG_PROFESSIONAL_PROFILE
--    Candidate Keys : user_id, email
--    FDs: user_id → name, email, hash_password, role, created_at  
--         email   → user_id, name, hash_password, role, created_at 
---------------------------------------------------------------------------------
CREATE TABLE USERS (
    user_id        INT          PRIMARY KEY AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    hash_password  VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    role           ENUM('client', 'gig_professional', 'manager') NOT NULL,
    created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP
);


---------------------------------------------------------------------------------
-- 2. CLIENT
--    Subtype of USERS (role = 'client'). Posts tasks.
--    (1)──(M) TASKS | (1)──(M) MANAGER
--    Candidate Keys : client_id, user_id
--    FDs: client_id → user_id, client_name, number_of_manager, domain  
--         user_id   → client_id, client_name, number_of_manager, domain 
---------------------------------------------------------------------------------
CREATE TABLE CLIENT (
    client_id          INT          PRIMARY KEY AUTO_INCREMENT,
    user_id            INT          NOT NULL UNIQUE,
    client_name        VARCHAR(100) NOT NULL,
    number_of_manager  INT          NOT NULL DEFAULT 0,
    domain             VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);


---------------------------------------------------------------------------------
-- 3. MANAGER
--    Weak entity of CLIENT. Subtype of USERS (role = 'manager').
--    PK = (client_id, manager_id) — manager_id is partial key.
--    (M)──(1) CLIENT | (1)──(M) GIG_MANAGER_ASSIGNMENT
--    Candidate Keys : (client_id, manager_id), user_id
--    FDs: (client_id, manager_id) → user_id  
--         user_id → (client_id, manager_id)  
---------------------------------------------------------------------------------
CREATE TABLE MANAGER (
    client_id   INT NOT NULL,
    manager_id  INT NOT NULL,
    user_id     INT NOT NULL UNIQUE,
    PRIMARY KEY (client_id, manager_id),
    FOREIGN KEY (client_id) REFERENCES CLIENT(client_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES USERS(user_id)
);


---------------------------------------------------------------------------------
-- 4. GIG_PROFESSIONAL_PROFILE
--    Subtype of USERS (role = 'gig_professional').
--    (1)──(M) PROFILE_SKILLS, PROFILE_TOOLS, PROFILE_PORTFOLIO
--    (1)──(M) APPLICATION | (1)──(M) DELIVERABLE | (1)──(M) PAYMENT
--    Candidate Keys : gig_profile_id, user_id
--    FDs: gig_profile_id → user_id, bio  
--         user_id        → gig_profile_id, bio  
---------------------------------------------------------------------------------
CREATE TABLE GIG_PROFESSIONAL_PROFILE (
    gig_profile_id  INT  PRIMARY KEY AUTO_INCREMENT,
    user_id         INT  NOT NULL UNIQUE,
    bio             TEXT,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);


---------------------------------------------------------------------------------
-- 5. PROFILE_SKILLS (1NF decomposition)
--    (M)──(1) GIG_PROFESSIONAL_PROFILE
--    Candidate Keys : (gig_profile_id, skill)
--    FDs: (gig_profile_id, skill) → [no non-key attributes]
--         No non-trivial FDs beyond the PK exist.
---------------------------------------------------------------------------------
CREATE TABLE PROFILE_SKILLS (
    gig_profile_id  INT          NOT NULL,
    skill           VARCHAR(100) NOT NULL,
    PRIMARY KEY (gig_profile_id, skill),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id) ON DELETE CASCADE
);


---------------------------------------------------------------------------------
-- 6. PROFILE_TOOLS (1NF decomposition)
--    (M)──(1) GIG_PROFESSIONAL_PROFILE
--    Candidate Keys : (gig_profile_id, tool)
--    FDs: (gig_profile_id, tool) → [no non-key attributes]
--         No non-trivial FDs beyond the PK exist.
---------------------------------------------------------------------------------
CREATE TABLE PROFILE_TOOLS (
    gig_profile_id  INT          NOT NULL,
    tool            VARCHAR(100) NOT NULL,
    PRIMARY KEY (gig_profile_id, tool),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id) ON DELETE CASCADE
);


---------------------------------------------------------------------------------
-- 7. PROFILE_PORTFOLIO (1NF decomposition)
--    (M)──(1) GIG_PROFESSIONAL_PROFILE
--    Candidate Keys : (gig_profile_id, url)
--    FDs: (gig_profile_id, url) → [no non-key attributes]
--         No non-trivial FDs beyond the PK exist.
---------------------------------------------------------------------------------
CREATE TABLE PROFILE_PORTFOLIO (
    gig_profile_id  INT          NOT NULL,
    url             VARCHAR(500) NOT NULL,
    PRIMARY KEY (gig_profile_id, url),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id) ON DELETE CASCADE
);


---------------------------------------------------------------------------------
-- 8. TASKS
--    Posted ONLY by root client. No manager at posting level.
--    Removing manager eliminates manager_id → client_id FD.
--    (M)──(1) CLIENT | (1)──(M) APPLICATION | (1)──(M) DELIVERABLE
--    (1)──(M) GIG_MANAGER_ASSIGNMENT | (1)──(M) PAYMENT
--    Candidate Keys : task_id
--    FDs: task_id → client_id, title, description,
--                   budget, due_date, status         
---------------------------------------------------------------------------------
CREATE TABLE TASKS (
    task_id      INT            PRIMARY KEY AUTO_INCREMENT,
    client_id    INT            NOT NULL,
    title        VARCHAR(255)   NOT NULL,
    description  TEXT,
    budget       DECIMAL(10,2)  NOT NULL,
    due_date     DATE,
    status       ENUM('open', 'in_progress', 'completed') NOT NULL DEFAULT 'open',
    FOREIGN KEY (client_id) REFERENCES CLIENT(client_id)
);


---------------------------------------------------------------------------------
-- 9. APPLICATION
--    M:M between GIG_PROFESSIONAL_PROFILE and TASKS.
--    One gig professional can apply to many tasks and vice versa.
--    uq_application prevents duplicate applications per task.
--    (M)──(1) GIG_PROFESSIONAL_PROFILE | (M)──(1) TASKS
--    Candidate Keys : application_id, (gig_profile_id, task_id)
--    FDs: application_id            → all  
--         (gig_profile_id, task_id) → all  
---------------------------------------------------------------------------------
CREATE TABLE APPLICATION (
    application_id  INT      PRIMARY KEY AUTO_INCREMENT,
    gig_profile_id  INT      NOT NULL,
    task_id         INT      NOT NULL,
    status          ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_application (gig_profile_id, task_id),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id),
    FOREIGN KEY (task_id)        REFERENCES TASKS(task_id)
);


---------------------------------------------------------------------------------
-- 10. GIG_MANAGER_ASSIGNMENT
--     Ternary relationship — links gig professional, task, manager.
--     Business Rule: one gig professional has ONE manager per task.
--     (M)──(1) GIG_PROFESSIONAL_PROFILE | (M)──(1) TASKS | (M)──(1) MANAGER
--     Candidate Keys : (gig_profile_id, task_id)
--     FDs: (gig_profile_id, task_id) → manager_id   
--          (gig_profile_id, task_id) → assigned_at  
--          gig_profile_id alone      → manager_id   
--          task_id alone             → manager_id   
---------------------------------------------------------------------------------

CREATE TABLE GIG_MANAGER_ASSIGNMENT (
    gig_profile_id  INT      NOT NULL,
    task_id         INT      NOT NULL,
    manager_id      INT      NOT NULL,
    assigned_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (gig_profile_id, task_id),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id),
    FOREIGN KEY (task_id)        REFERENCES TASKS(task_id),
    FOREIGN KEY (manager_id)     REFERENCES MANAGER(manager_id)
);


---------------------------------------------------------------------------------
-- 11. DELIVERABLE
--     Weak entity of TASKS. deliverable_no is partial key.
--     PK = (task_id, deliverable_no) — unique only within a task.
--     manager_id NOT stored — derived via GIG_MANAGER_ASSIGNMENT.
--     FK (gig_profile_id, task_id) ensures valid assignment exists.
--     (M)──(1) TASKS [identifying] | (M)──(1) GIG_PROFESSIONAL_PROFILE
--     Candidate Keys : (task_id, deliverable_no)
--     FDs: (task_id, deliverable_no) → gig_profile_id, description,
--                                      submission_path, status,
--                                      created_at              
---------------------------------------------------------------------------------

CREATE TABLE DELIVERABLE (
    task_id         INT          NOT NULL,
    deliverable_no  INT          NOT NULL,
    gig_profile_id  INT          NOT NULL,
    description     VARCHAR(500) NOT NULL,
    submission_path VARCHAR(500) NOT NULL,
    status          ENUM('submitted', 'approved', 'revision_requested') NOT NULL DEFAULT 'submitted',
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, deliverable_no),
    FOREIGN KEY (task_id)                 REFERENCES TASKS(task_id) ON DELETE CASCADE,
    FOREIGN KEY (gig_profile_id)          REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id),
    FOREIGN KEY (gig_profile_id, task_id) REFERENCES GIG_MANAGER_ASSIGNMENT(gig_profile_id, task_id)
);


---------------------------------------------------------------------------------
-- 12. PAYMENT
--     One payment per (task, gig_professional) pair.
--     A task can have multiple payments to different gig professionals.
--     (M)──(1) TASKS | (M)──(1) GIG_PROFESSIONAL_PROFILE
--     Candidate Keys : payment_id, (task_id, gig_profile_id)
--     FDs: payment_id                → all  
--          (task_id, gig_profile_id) → all 
---------------------------------------------------------------------------------

CREATE TABLE PAYMENT (
    payment_id      INT            PRIMARY KEY AUTO_INCREMENT,
    task_id         INT            NOT NULL,
    gig_profile_id  INT            NOT NULL,
    amount          DECIMAL(10,2)  NOT NULL,
    status          ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    created_at      DATETIME       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payment (task_id, gig_profile_id),
    FOREIGN KEY (task_id)        REFERENCES TASKS(task_id),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id)
);


---------------------------------------------------------------------------------
-- 13. REVIEWS
--     Mutual reviews — client→gig and gig→client after task.
--     reviewee_id explicitly stored (not derived transitively).
--     Self-reviews blocked via CHECK constraint.
--     (M)──(1) USERS [reviewer] | (M)──(1) USERS [reviewee] | (M)──(1) TASKS
--     Candidate Keys : review_id, (reviewer_id, reviewee_id, task_id)
--     FDs: review_id                           → all  
--          (reviewer_id, reviewee_id, task_id) → all 
---------------------------------------------------------------------------------
CREATE TABLE REVIEWS (
    review_id    INT      PRIMARY KEY AUTO_INCREMENT,
    reviewer_id  INT      NOT NULL,
    reviewee_id  INT      NOT NULL,
    task_id      INT      NOT NULL,
    rating       INT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review (reviewer_id, reviewee_id, task_id),
    CONSTRAINT chk_no_self_review CHECK (reviewer_id != reviewee_id),
    FOREIGN KEY (reviewer_id) REFERENCES USERS(user_id),
    FOREIGN KEY (reviewee_id) REFERENCES USERS(user_id),
    FOREIGN KEY (task_id)     REFERENCES TASKS(task_id)
);