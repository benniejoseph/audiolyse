-- =====================================================
-- SPRINT 4: GAMIFICATION & KNOWLEDGE BASE
-- =====================================================
-- Points, Badges, Achievements, Leaderboards, Scripts
-- =====================================================

-- =====================================================
-- 1. POINTS & LEVELS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Points breakdown
  total_points INT DEFAULT 0,
  level INT DEFAULT 1,
  
  -- Activity points
  calls_analyzed_points INT DEFAULT 0,
  high_score_points INT DEFAULT 0,
  improvement_points INT DEFAULT 0,
  streak_points INT DEFAULT 0,
  achievement_points INT DEFAULT 0,
  
  -- Streak tracking
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  
  -- Level progress
  points_to_next_level INT DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_user_points_org ON user_points(organization_id);
CREATE INDEX idx_user_points_total ON user_points(total_points DESC);

-- Points history log
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  points INT NOT NULL,
  action TEXT NOT NULL, -- call_analyzed, high_score, streak_bonus, achievement_earned, etc.
  description TEXT,
  
  -- Related entity
  related_type TEXT, -- call_analysis, achievement, challenge
  related_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_history_user ON points_history(user_id);
CREATE INDEX idx_points_history_created ON points_history(created_at DESC);

-- =====================================================
-- 2. BADGES & ACHIEVEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge info
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  
  -- Requirements
  category TEXT NOT NULL CHECK (category IN ('calls', 'scores', 'streaks', 'improvement', 'special')),
  requirement_type TEXT NOT NULL, -- count, score, streak, custom
  requirement_value INT,
  requirement_json JSONB DEFAULT '{}', -- for complex requirements
  
  -- Points awarded
  points_reward INT DEFAULT 50,
  
  -- Rarity
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default badges
INSERT INTO badge_definitions (name, title, description, icon, category, requirement_type, requirement_value, points_reward, rarity) VALUES
  -- Calls badges
  ('first_call', 'First Steps', 'Analyze your first call', '🎙️', 'calls', 'count', 1, 10, 'common'),
  ('ten_calls', 'Getting Started', 'Analyze 10 calls', '📊', 'calls', 'count', 10, 25, 'common'),
  ('fifty_calls', 'Call Warrior', 'Analyze 50 calls', '⚔️', 'calls', 'count', 50, 50, 'uncommon'),
  ('hundred_calls', 'Century Club', 'Analyze 100 calls', '💯', 'calls', 'count', 100, 100, 'rare'),
  ('five_hundred_calls', 'Call Master', 'Analyze 500 calls', '👑', 'calls', 'count', 500, 250, 'epic'),
  
  -- Score badges
  ('perfect_score', 'Perfectionist', 'Achieve a perfect 100 score', '🌟', 'scores', 'score', 100, 100, 'rare'),
  ('ninety_plus', 'Excellence', 'Score 90+ on a call', '🏆', 'scores', 'score', 90, 50, 'uncommon'),
  ('consistent_high', 'Consistently Great', 'Average 80+ over 10 calls', '📈', 'scores', 'custom', 0, 75, 'uncommon'),
  
  -- Streak badges
  ('three_day_streak', 'On a Roll', '3-day activity streak', '🔥', 'streaks', 'streak', 3, 15, 'common'),
  ('week_streak', 'Weekly Warrior', '7-day activity streak', '⚡', 'streaks', 'streak', 7, 35, 'uncommon'),
  ('month_streak', 'Monthly Master', '30-day activity streak', '🌙', 'streaks', 'streak', 30, 150, 'rare'),
  
  -- Improvement badges
  ('first_improvement', 'Growing', 'Improve score by 10+ points', '🌱', 'improvement', 'custom', 10, 25, 'common'),
  ('big_improvement', 'Breakthrough', 'Improve score by 25+ points', '🚀', 'improvement', 'custom', 25, 75, 'rare'),
  
  -- Special badges
  ('early_adopter', 'Early Adopter', 'Joined during beta', '🌟', 'special', 'custom', 0, 50, 'rare'),
  ('top_performer', 'Top Performer', 'Ranked #1 on leaderboard', '👑', 'special', 'custom', 0, 200, 'legendary')
ON CONFLICT (name) DO NOTHING;

-- User earned badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Progress (for badges not yet earned)
  progress INT DEFAULT 0,
  progress_max INT DEFAULT 0,
  
  UNIQUE(user_id, badge_id, organization_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- =====================================================
-- 3. CHALLENGES
-- =====================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Challenge info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  
  -- Type
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('individual', 'team', 'org_wide')),
  metric TEXT NOT NULL, -- calls_count, avg_score, improvement, streak
  target_value INT NOT NULL,
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Rewards
  points_reward INT DEFAULT 100,
  badge_reward UUID REFERENCES badge_definitions(id),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_org ON challenges(organization_id);
CREATE INDEX idx_challenges_status ON challenges(status);

-- Challenge participants/progress
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress
  current_value INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  
  -- Rank (for leaderboard)
  rank INT,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);

-- =====================================================
-- 4. LEADERBOARD SNAPSHOTS
-- =====================================================

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Rankings (stored as JSON for efficiency)
  rankings JSONB NOT NULL DEFAULT '[]', -- [{user_id, name, points, rank, calls, avg_score}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_org ON leaderboard_snapshots(organization_id);
CREATE INDEX idx_leaderboard_period ON leaderboard_snapshots(period_type, period_start DESC);

-- =====================================================
-- 5. SCRIPT LIBRARY
-- =====================================================

CREATE TABLE IF NOT EXISTS script_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Script info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- opening, objection_handling, closing, follow_up, etc.
  
  -- Content
  script_text TEXT NOT NULL,
  
  -- Usage scenarios
  scenario_tags TEXT[] DEFAULT '{}',
  industry_tags TEXT[] DEFAULT '{}',
  
  -- Performance data
  usage_count INT DEFAULT 0,
  avg_effectiveness DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Status
  is_template BOOLEAN DEFAULT FALSE, -- org-wide template
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scripts_org ON script_library(organization_id);
CREATE INDEX idx_scripts_category ON script_library(category);
CREATE INDEX idx_scripts_tags ON script_library USING GIN (scenario_tags);

-- =====================================================
-- 6. OBJECTION PLAYBOOKS
-- =====================================================

CREATE TABLE IF NOT EXISTS objection_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Objection info
  objection_text TEXT NOT NULL,
  objection_category TEXT NOT NULL, -- price, timing, competitor, trust, need, etc.
  
  -- Responses
  responses JSONB NOT NULL DEFAULT '[]', -- [{response, effectiveness, notes}]
  
  -- Best response
  best_response_index INT DEFAULT 0,
  
  -- Stats
  occurrence_count INT DEFAULT 0,
  success_rate DECIMAL(3,2),
  
  -- Tags
  industry_tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playbooks_org ON objection_playbooks(organization_id);
CREATE INDEX idx_playbooks_category ON objection_playbooks(objection_category);

-- =====================================================
-- 7. TRAINING RESOURCES
-- =====================================================

CREATE TABLE IF NOT EXISTS training_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Resource info
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('video', 'document', 'link', 'quiz', 'course')),
  
  -- Content
  url TEXT,
  content TEXT, -- for embedded content
  duration_minutes INT,
  
  -- Categorization
  category TEXT NOT NULL, -- onboarding, product, sales_technique, compliance, etc.
  skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  
  -- Tracking
  view_count INT DEFAULT 0,
  avg_rating DECIMAL(2,1),
  
  -- Requirements
  required_for_roles TEXT[] DEFAULT '{}',
  prerequisite_ids UUID[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_org ON training_resources(organization_id);
CREATE INDEX idx_training_category ON training_resources(category);
CREATE INDEX idx_training_type ON training_resources(resource_type);

-- User training progress
CREATE TABLE IF NOT EXISTS user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES training_resources(id) ON DELETE CASCADE,
  
  -- Progress
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INT DEFAULT 0,
  
  -- Completion
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Rating
  user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5),
  
  UNIQUE(user_id, resource_id)
);

CREATE INDEX idx_training_progress_user ON user_training_progress(user_id);
CREATE INDEX idx_training_progress_resource ON user_training_progress(resource_id);

-- =====================================================
-- 8. AI CHAT HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Context
  context_type TEXT NOT NULL, -- call_analysis, general, coaching
  context_id UUID, -- e.g., call_analysis_id
  
  -- Session info
  title TEXT,
  
  -- Messages stored as JSONB array
  messages JSONB NOT NULL DEFAULT '[]', -- [{role, content, timestamp, citations}]
  
  -- Stats
  message_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_user ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_context ON ai_chat_sessions(context_type, context_id);

-- =====================================================
-- 9. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view org points" ON user_points FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = user_points.organization_id
));

CREATE POLICY "Users can view own points history" ON points_history FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view org badges" ON user_badges FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = user_badges.organization_id
));

CREATE POLICY "Members can view org challenges" ON challenges FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = challenges.organization_id
));

CREATE POLICY "Members can view challenge participants" ON challenge_participants FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM challenges c
  JOIN organization_members om ON om.organization_id = c.organization_id
  WHERE c.id = challenge_participants.challenge_id AND om.user_id = auth.uid()
));

CREATE POLICY "Members can view org leaderboards" ON leaderboard_snapshots FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = leaderboard_snapshots.organization_id
));

CREATE POLICY "Members can view org scripts" ON script_library FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = script_library.organization_id
));

CREATE POLICY "Members can view org playbooks" ON objection_playbooks FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = objection_playbooks.organization_id
));

CREATE POLICY "Members can view org training" ON training_resources FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = auth.uid() AND om.organization_id = training_resources.organization_id
));

CREATE POLICY "Users can view own training progress" ON user_training_progress FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own training progress" ON user_training_progress FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view own AI chats" ON ai_chat_sessions FOR ALL TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Award points to user
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_org_id UUID,
  p_points INT,
  p_action TEXT,
  p_description TEXT DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update user points
  INSERT INTO user_points (user_id, organization_id, total_points)
  VALUES (p_user_id, p_org_id, p_points)
  ON CONFLICT (user_id, organization_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + p_points,
    updated_at = NOW();
  
  -- Log points history
  INSERT INTO points_history (user_id, organization_id, points, action, description, related_type, related_id)
  VALUES (p_user_id, p_org_id, p_points, p_action, p_description, p_related_type, p_related_id);
  
  -- Update specific point category
  IF p_action = 'call_analyzed' THEN
    UPDATE user_points SET calls_analyzed_points = calls_analyzed_points + p_points WHERE user_id = p_user_id AND organization_id = p_org_id;
  ELSIF p_action = 'high_score' THEN
    UPDATE user_points SET high_score_points = high_score_points + p_points WHERE user_id = p_user_id AND organization_id = p_org_id;
  ELSIF p_action = 'streak_bonus' THEN
    UPDATE user_points SET streak_points = streak_points + p_points WHERE user_id = p_user_id AND organization_id = p_org_id;
  ELSIF p_action = 'achievement_earned' THEN
    UPDATE user_points SET achievement_points = achievement_points + p_points WHERE user_id = p_user_id AND organization_id = p_org_id;
  END IF;
  
  -- Check and update level
  PERFORM update_user_level(p_user_id, p_org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user level based on points
CREATE OR REPLACE FUNCTION update_user_level(p_user_id UUID, p_org_id UUID)
RETURNS void AS $$
DECLARE
  v_points INT;
  v_new_level INT;
BEGIN
  SELECT total_points INTO v_points FROM user_points WHERE user_id = p_user_id AND organization_id = p_org_id;
  
  -- Level thresholds: 100, 250, 500, 1000, 2000, 5000, 10000, etc.
  v_new_level := CASE
    WHEN v_points >= 10000 THEN 8
    WHEN v_points >= 5000 THEN 7
    WHEN v_points >= 2000 THEN 6
    WHEN v_points >= 1000 THEN 5
    WHEN v_points >= 500 THEN 4
    WHEN v_points >= 250 THEN 3
    WHEN v_points >= 100 THEN 2
    ELSE 1
  END;
  
  UPDATE user_points 
  SET level = v_new_level,
      points_to_next_level = CASE v_new_level
        WHEN 1 THEN 100 - v_points
        WHEN 2 THEN 250 - v_points
        WHEN 3 THEN 500 - v_points
        WHEN 4 THEN 1000 - v_points
        WHEN 5 THEN 2000 - v_points
        WHEN 6 THEN 5000 - v_points
        WHEN 7 THEN 10000 - v_points
        ELSE 0
      END
  WHERE user_id = p_user_id AND organization_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID, p_org_id UUID)
RETURNS void AS $$
DECLARE
  v_last_date DATE;
  v_today DATE := CURRENT_DATE;
  v_current_streak INT;
BEGIN
  SELECT last_activity_date, current_streak INTO v_last_date, v_current_streak
  FROM user_points
  WHERE user_id = p_user_id AND organization_id = p_org_id;
  
  IF v_last_date IS NULL OR v_last_date < v_today - 1 THEN
    -- Streak broken or first activity
    v_current_streak := 1;
  ELSIF v_last_date = v_today - 1 THEN
    -- Continue streak
    v_current_streak := v_current_streak + 1;
  END IF;
  -- If same day, don't update
  
  IF v_last_date IS NULL OR v_last_date < v_today THEN
    UPDATE user_points
    SET current_streak = v_current_streak,
        longest_streak = GREATEST(longest_streak, v_current_streak),
        last_activity_date = v_today
    WHERE user_id = p_user_id AND organization_id = p_org_id;
    
    -- Award streak bonus points
    IF v_current_streak = 3 THEN
      PERFORM award_points(p_user_id, p_org_id, 10, 'streak_bonus', '3-day streak bonus');
    ELSIF v_current_streak = 7 THEN
      PERFORM award_points(p_user_id, p_org_id, 25, 'streak_bonus', '7-day streak bonus');
    ELSIF v_current_streak = 30 THEN
      PERFORM award_points(p_user_id, p_org_id, 100, 'streak_bonus', '30-day streak bonus');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION award_points TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_level TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak TO authenticated;
