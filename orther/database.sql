CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL, -- ชื่อเล่นหรือชื่อในเกม
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    photo_url TEXT,

    -- ที่อยู่แยกเป็นชั้นๆ
    address TEXT,
    sub_district VARCHAR(100),   -- ตำบล
    district VARCHAR(100),       -- อำเภอ
    province VARCHAR(100),
    postal_code VARCHAR(10),

    -- บทบาทและสถานะ
    role ENUM('user', 'captain', 'manager', 'admin') DEFAULT 'user',
    status ENUM('active', 'banned') DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

CREATE TABLE teams (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(20) UNIQUE,
    logo TEXT,
    game_id VARCHAR(36) NOT NULL,
    status ENUM('active', 'disbanded') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);


CREATE TABLE team_members (
    team_id VARCHAR(36),
    user_id VARCHAR(36),
    role ENUM('captain', 'player', 'substitute') DEFAULT 'player',
    status ENUM('active', 'inactive') DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE tournaments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    game_id VARCHAR(36) NOT NULL,
    type ENUM('online', 'offline', 'hybrid') NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status ENUM('upcoming', 'registration', 'ongoing', 'completed') DEFAULT 'upcoming',
    max_teams INT,
    prize_pool DECIMAL(10,2),
    rules TEXT,
    location VARCHAR(255),
    stream_link TEXT,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE tournament_registrations (
    tournament_id VARCHAR(36),
    team_id VARCHAR(36),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tournament_id, team_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);


-- GAME DATABASE --

CREATE TABLE games (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,   -- เช่น "ROV"
    genre VARCHAR(50),            -- optional เช่น "MOBA"
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE heroes (
    id VARCHAR(36) PRIMARY KEY,
    game_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50),                  -- เช่น Mage, Assassin, Support
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE skills (
    id VARCHAR(36) PRIMARY KEY,
    hero_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('passive', 'active') DEFAULT 'active',
    description TEXT,
    cooldown VARCHAR(20),          -- อาจเป็น "8s" หรือ "Passive"
    mana_cost VARCHAR(20),         -- เช่น "50 MP"
    image_url TEXT,
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);

-- Entities ย่อย

CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('match_dispute', 'user_report', 'chat_report') NOT NULL,

    reported_by VARCHAR(36) NOT NULL,         -- ผู้แจ้ง
    reported_team_id VARCHAR(36),
    reported_user_id VARCHAR(36),
    match_id VARCHAR(36),

    description TEXT,
    status ENUM('pending', 'resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- การตัดสิน (โดย manager/admin)
    decided_by VARCHAR(36),
    decision TEXT,
    decision_time TIMESTAMP,

    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE SET NULL,
    FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE report_evidences (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    type ENUM('image', 'video') NOT NULL,
    url TEXT NOT NULL,
    description TEXT,

    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);


CREATE TABLE matches (
    id VARCHAR(36) PRIMARY KEY,
    tournament_id VARCHAR(36) NOT NULL,
    match_type ENUM('online', 'offline') NOT NULL,
    round VARCHAR(50),                     -- เช่น "Quarter Final"
    scheduled_time TIMESTAMP,
    status ENUM('scheduled', 'live', 'completed', 'disputed') DEFAULT 'scheduled',

    team1_id VARCHAR(36),
    team2_id VARCHAR(36),
    winner_id VARCHAR(36),
    managed_by VARCHAR(36),               -- user (manager)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (managed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE match_evidences (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    team_id VARCHAR(36),                          -- ทีมที่ส่ง (optional)
    
    type ENUM('image', 'video') NOT NULL,
    url TEXT NOT NULL,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);


CREATE TABLE chat_rooms (
    id VARCHAR(36) PRIMARY KEY,
    type ENUM('tournament', 'match', 'team') NOT NULL,
    related_id VARCHAR(36), -- อ้างอิงทัวร์นาเมนต์, แมตช์ หรือทีม ตาม type

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL
);

CREATE TABLE chat_room_participants (
    room_id VARCHAR(36),
    user_id VARCHAR(36),

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (room_id, user_id),

    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,

    content TEXT,
    type ENUM('text', 'image', 'system') DEFAULT 'text',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE overlay_settings (
    match_id VARCHAR(36) PRIMARY KEY,
    active_scene VARCHAR(100),
    layout VARCHAR(100),
    show_stats BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE overlay_live_stats (
    match_id VARCHAR(36) PRIMARY KEY,
    
    team1_score INT DEFAULT 0,
    team2_score INT DEFAULT 0,
    
    team1_stats JSON,  -- เก็บสถิติผู้เล่นแบบ JSON เช่น [{"player_id":"xxx","kills":5,"deaths":1},...]
    team2_stats JSON,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
);

-- เพิ่มเติม
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,      -- เช่น 'user', 'team', 'match'
    entity_id VARCHAR(36) NOT NULL,
    changed_by VARCHAR(36) NOT NULL,       -- user_id ที่ทำการเปลี่ยนแปลง
    change_type ENUM('create', 'update', 'delete') NOT NULL,
    change_data JSON NOT NULL,              -- ข้อมูลก่อน/หลัง หรือรายละเอียดการเปลี่ยนแปลง
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE player_stats (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    player_id VARCHAR(36) NOT NULL,    -- user_id ของผู้เล่น
    team_id VARCHAR(36) NOT NULL,

    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    assists INT DEFAULT 0,
    -- เพิ่มเติมได้ตามเกม เช่น gold, damage, healing ฯลฯ

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,   -- เช่น 'user', 'captain', 'manager', 'admin'
    description TEXT
);

CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,  -- เช่น 'create_tournament', 'manage_team', 'view_reports'
    description TEXT
);

CREATE TABLE role_permissions (
    role_id VARCHAR(36),
    permission_id VARCHAR(36),
    PRIMARY KEY (role_id, permission_id),

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE user_roles (
    user_id VARCHAR(36),
    role_id VARCHAR(36),
    PRIMARY KEY (user_id, role_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);



CREATE INDEX idx_tournament_status ON tournaments(status);
CREATE INDEX idx_match_status ON matches(status);
CREATE INDEX idx_team_status ON teams(status);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);