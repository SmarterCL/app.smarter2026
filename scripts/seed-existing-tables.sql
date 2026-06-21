-- Insert sample data into existing tables

-- Insert sample profiles
INSERT INTO profiles (full_name, email, avatar_url) VALUES
  ('John Doe', 'john.doe@example.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
  ('Jane Smith', 'jane.smith@example.com', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('Mike Johnson', 'mike.johnson@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
  ('Sarah Wilson', 'sarah.wilson@example.com', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face');

-- Insert sample contacts
INSERT INTO contacts (name, email, source, status, was_notified) VALUES
  ('Alice Brown', 'alice.brown@example.com', 'website', 'active', true),
  ('Bob Davis', 'bob.davis@example.com', 'manual', 'active', false),
  ('Carol White', 'carol.white@example.com', 'import', 'pending', false),
  ('David Green', 'david.green@example.com', 'api', 'active', true);

-- Insert sample API keys (using demo user IDs)
INSERT INTO api_keys (user_id, key_name, api_key, is_active) VALUES
  ('demo-user-1', 'Production API', 'sk-prod-1234567890abcdef', true),
  ('demo-user-1', 'Development API', 'sk-dev-abcdef1234567890', true),
  ('demo-user-2', 'Testing API', 'sk-test-fedcba0987654321', false),
  ('demo-user-2', 'Staging API', 'sk-stage-1357924680acbd', true);

-- Insert sample QR codes
INSERT INTO qr_codes (user_id, bot_id, description, is_active) VALUES
  ('demo-user-1', 'bot_whatsapp_001', 'WhatsApp Business Bot - Main', true),
  ('demo-user-1', 'bot_whatsapp_002', 'WhatsApp Support Bot', true),
  ('demo-user-2', 'bot_telegram_001', 'Telegram Customer Service', false),
  ('demo-user-2', 'bot_discord_001', 'Discord Community Bot', true);
