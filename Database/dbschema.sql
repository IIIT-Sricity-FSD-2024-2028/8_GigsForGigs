-- USERS
CREATE TABLE USERS (
    user_id     INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    role        ENUM('gig_professional', 'client_root', 'client_manager') NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CLIENT
CREATE TABLE CLIENT (
    client_id   INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL UNIQUE,
    client_name VARCHAR(100) NOT NULL,
    domain      VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- MANAGER
CREATE TABLE MANAGER (
    manager_id              INT PRIMARY KEY AUTO_INCREMENT,
    client_id               INT NOT NULL,
    current_profiles_managed INT DEFAULT 0,
    tasks_managed           INT DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES CLIENT(client_id)
);

-- GIG_PROFESSIONAL_PROFILE
CREATE TABLE GIG_PROFESSIONAL_PROFILE (
    gig_profile_id  INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL UNIQUE,
    bio             TEXT,
    rating          FLOAT DEFAULT 0.0,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- PROFILE_SKILLS (1NF decomposition)
CREATE TABLE PROFILE_SKILLS (
    gig_profile_id  INT NOT NULL,
    skill           VARCHAR(100) NOT NULL,
    PRIMARY KEY (gig_profile_id, skill),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id)
);

-- PROFILE_TOOLS (1NF decomposition)
CREATE TABLE PROFILE_TOOLS (
    gig_profile_id  INT NOT NULL,
    tool            VARCHAR(100) NOT NULL,
    PRIMARY KEY (gig_profile_id, tool),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id)
);

-- PROFILE_PORTFOLIO (1NF decomposition)
CREATE TABLE PROFILE_PORTFOLIO (
    portfolio_id    INT PRIMARY KEY AUTO_INCREMENT,
    gig_profile_id  INT NOT NULL,
    url             VARCHAR(500) NOT NULL,
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id)
);

-- TASKS
CREATE TABLE TASKS (
    task_id     INT PRIMARY KEY AUTO_INCREMENT,
    client_id   INT NOT NULL,
    manager_id  INT,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    budget      DECIMAL(10, 2) NOT NULL,
    due_date    DATE,
    status      ENUM('open', 'in_progress', 'completed') NOT NULL DEFAULT 'open',
    FOREIGN KEY (client_id) REFERENCES CLIENT(client_id)
    FOREIGN KEY (manager_id) REFERENCES MANAGER(manager_id)
);

-- APPLICATION
CREATE TABLE APPLICATION (
    application_id  INT PRIMARY KEY AUTO_INCREMENT,
    gig_profile_id  INT NOT NULL,
    task_id         INT NOT NULL,
    status          ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_application (gig_profile_id, task_id),
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id)
    FOREIGN KEY (task_id) REFERENCES TASKS(task_id)
     
);

-- DELIVERABLES
CREATE TABLE DELIVERABLES (
    deliverable_id  INT PRIMARY KEY AUTO_INCREMENT,
    task_id         INT NOT NULL UNIQUE,
    gig_profile_id  INT NOT NULL,
    submission_path VARCHAR(500) NOT NULL,
    status          ENUM('submitted', 'approved', 'revision_requested') ,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES TASKS(task_id)
    FOREIGN KEY (gig_profile_id) REFERENCES GIG_PROFESSIONAL_PROFILE(gig_profile_id)
);

-- PAYMENT
CREATE TABLE PAYMENT (
    payment_id  INT PRIMARY KEY AUTO_INCREMENT,
    task_id     INT NOT NULL UNIQUE,
    client_id   INT NOT NULL,
    user_id     INT NOT NULL,
    amount      DECIMAL(10, 2) NOT NULL,
    status      ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES TASKS(task_id)
    FOREIGN KEY (client_id) REFERENCES CLIENT(client_id)
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- REVIEWS
CREATE TABLE REVIEWS (
    review_id   INT PRIMARY KEY AUTO_INCREMENT,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    task_id     INT NOT NULL,
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    UNIQUE KEY uq_review (reviewer_id, task_id),
    FOREIGN KEY (reviewer_id) REFERENCES USERS(user_id)
    FOREIGN KEY (reviewee_id) REFERENCES USERS(user_id)
    FOREIGN KEY (task_id) REFERENCES TASKS(task_id)
        
);