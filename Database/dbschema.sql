CREATE DATABASE GigsForGigs;
USE GigsForGigs;

-- ============================================================
-- 1. USERS
--    FDs: user_id → all,  email → all (both superkeys)
-- ============================================================
CREATE TABLE USERS (
    user_id     INT          PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    hash_password        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    role        ENUM('client', 'gig_professional') NOT NULL,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. CLIENT
--    FDs: client_id → all,  user_id → all (both superkeys)
-- ============================================================
CREATE TABLE CLIENT (
    client_id    INT          PRIMARY KEY AUTO_INCREMENT,
    user_id      INT          NOT NULL UNIQUE,
    client_name  VARCHAR(100) NOT NULL,
    number_of_manager INT NOT NULL DEFAULT 0,
    domain       VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);


-- ============================================================
-- 3. MANAGER
--    Weak entity — existence depends on CLIENT.
--    PK: (client_id, manager_no)
--    FDs: (client_id, manager_no) → user_id  
--         user_id → (client_id, manager_no)  
--    No non-superkey determinant exists.
-- ============================================================
CREATE TABLE MANAGER (
    client_id   INT NOT NULL,
    manager_no  INT NOT NULL,
    user_id     INT NOT NULL UNIQUE,
    PRIMARY KEY (client_id, manager_no),
    FOREIGN KEY (client_id) REFERENCES CLIENT(client_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES USERS(user_id)
);


-- ============================================================
-- 4. GIG_PROFESSIONAL_PROFILE
--    FDs: gig_profile_id → all,  user_id → all (both superkeys)
-- ============================================================
CREATE TABLE GIG_PROFESSIONAL_PROFILE (
    gig_profile_id  INT  PRIMARY KEY AUTO_INCREMENT,
    user_id         INT  NOT NULL UNIQUE,
    bio             TEXT,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);


-- ============================================================
-- 5. PROFILE_SKILLS  (1NF decomposition)
--    PK: (gig_profile_id, skill) — only superkey, no other FDs
-- ============================================================
CREATE TABLE PROFILE_SKILLS (
    gig_profile_id  INT          NOT NULL,
    skill           VARCHAR(100) NOT NULL,
    PRIMARY KEY (gig_profile_id, skill),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id) ON DELETE CASCADE
);


-- ============================================================
-- 6. PROFILE_TOOLS  (1NF decomposition)
--    PK: (gig_profile_id, tool) — only superkey, no other FDs
-- ============================================================
CREATE TABLE PROFILE_TOOLS (
    gig_profile_id  INT          NOT NULL,
    tool            VARCHAR(100) NOT NULL,
    PRIMARY KEY (gig_profile_id, tool),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id) ON DELETE CASCADE
);


-- ============================================================
-- 7. PROFILE_PORTFOLIO  (1NF decomposition)
--    PK: (gig_profile_id, url) — only superkey, no other FDs
-- ============================================================
CREATE TABLE PROFILE_PORTFOLIO (
    gig_profile_id  INT          NOT NULL,
    url             VARCHAR(500) NOT NULL,
    PRIMARY KEY (gig_profile_id, url),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id) ON DELETE CASCADE
);


-- ============================================================
-- 8. TASKS
--    Tasks posted ONLY by root client — manager removed.
--    FDs: task_id → client_id, title, description, budget,
--                   due_date, status
--    Only determinant is task_id (the PK = superkey).
--    The previous violation manager_no → client_id is GONE
--    because manager_no no longer exists in this table.
-- ============================================================
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


-- ============================================================
-- 9. APPLICATION
--    FDs: application_id → all  
--         (gig_profile_id, task_id) → all  
-- ============================================================
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


-- ============================================================
-- 10. Sub Task
--     Domain rule: one sub_task handled by exactly ONE manager.
--     Relationship: MANAGER (1) ──────< Sub Task (M)
--     (client_id, manager_no) stored here as the FK — correct
--     placement of FK on the "many" side of a 1:M relationship.
--
--     FDs:
--       sub_task_id → task_id, gig_profile_id,
--                        client_id, manager_no,
--                        submission_path, status, created_at
--     Only determinant is sub_task_id (PK = superkey).
--
--     Note on (client_id, manager_no) → client_id:
--     This FD does NOT violate BCNF here because client_id is
--     part of the FK pair itself — it is not being derived from
--     a non-superkey. client_id here is a stored FK component,
--     not an independently inferred attribute.
--     BCNF (Removed client_id as a task_id could determine that)
-- ============================================================
CREATE TABLE sub_task (
    sub_task_id  INT            PRIMARY KEY AUTO_INCREMENT,
    task_id         INT            NOT NULL,
    gig_profile_id  INT            NOT NULL,   
    manager_id      INT            NOT NULL,   
    submission_path VARCHAR(500)   NOT NULL,
    status          ENUM('submitted', 'approved', 'revision_requested') NOT NULL DEFAULT 'submitted',
    created_at      DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id)               REFERENCES TASKS(task_id),
    FOREIGN KEY (gig_profile_id)        REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id),
    FOREIGN KEY (client_id, manager_no) REFERENCES MANAGER(client_id, manager_no)
);


-- ============================================================
-- 11. PAYMENT
--     FDs: payment_id → all,  task_id → all (both superkeys)
-- ============================================================
CREATE TABLE PAYMENT (
    payment_id  INT            PRIMARY KEY AUTO_INCREMENT,
    task_id     INT            NOT NULL UNIQUE,
    amount      DECIMAL(10,2)  NOT NULL,
    status      ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    created_at  DATETIME       DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES TASKS(task_id)
);


-- ============================================================
-- 12. REVIEWS
--     reviewee_id explicitly stored — removes transitive
--     derivation of reviewee from (reviewer_id, task_id).
--     FDs: review_id → all 
--          (reviewer_id, task_id) → all  
-- ============================================================
CREATE TABLE REVIEWS (
    review_id    INT      PRIMARY KEY AUTO_INCREMENT,
    reviewer_id  INT      NOT NULL,
    reviewee_id  INT      NOT NULL,
    task_id      INT      NOT NULL,
    rating       INT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    UNIQUE KEY uq_review (reviewer_id, task_id),
    FOREIGN KEY (reviewer_id)  REFERENCES USERS(user_id),
    FOREIGN KEY (reviewee_id)  REFERENCES USERS(user_id),
    FOREIGN KEY (task_id)      REFERENCES TASKS(task_id)
);