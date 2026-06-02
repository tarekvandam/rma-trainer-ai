-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Creates a simple key-value store for app-wide settings

CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read
CREATE POLICY "Public read" ON app_data FOR SELECT USING (true);

-- Allow public write (pricing plans are public data)
CREATE POLICY "Public write" ON app_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Public write update" ON app_data FOR UPDATE USING (true);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- Insert default pricing plans
INSERT INTO app_data (key, value) VALUES ('pro_requests', '[]'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO app_data (key, value) VALUES (
  'pricing_plans',
  '[
    {"id":"free","name":"Free","price":"0","currency":"ريال","period":"/شهر","popular":false,"features":["توليد 3 خطط شهرياً","تمارين أساسية","نصائح غذائية عامة","عرض النتائج"],"btnText":"خطتك الحالية","btnLink":""},
    {"id":"pro","name":"Pro","price":"1000","currency":"جنيه","period":"مرة واحدة","popular":true,"features":["توليد غير محدود","تمارين متقدمة","نظام غذائي مخصص","تصدير PDF","فيديوهات تمارين يوتيوب","دعم أولوية"],"btnText":"اشترك الآن","btnLink":"/payment"}
  ]'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO app_data (key, value) VALUES ('visitor_count', '0'::jsonb) ON CONFLICT (key) DO NOTHING;
INSERT INTO app_data (key, value) VALUES ('site_ads', '[]'::jsonb) ON CONFLICT (key) DO NOTHING;
