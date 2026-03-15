-- 创建业务编号序列表
CREATE TABLE IF NOT EXISTS business_code_sequences (
  prefix TEXT NOT NULL,
  date_key TEXT NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, date_key)
);

-- 创建原子性业务编号生成函数
CREATE OR REPLACE FUNCTION generate_business_code(doc_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  today_key TEXT;
  next_seq INTEGER;
  business_code TEXT;
BEGIN
  -- 生成日期键 (YYMMDD 格式)
  today_key := TO_CHAR(CURRENT_DATE, 'YYMMDD');

  -- 原子性地获取并递增序列号
  INSERT INTO business_code_sequences (prefix, date_key, sequence_number)
  VALUES (doc_prefix, today_key, 1)
  ON CONFLICT (prefix, date_key)
  DO UPDATE SET sequence_number = business_code_sequences.sequence_number + 1
  RETURNING sequence_number INTO next_seq;

  -- 生成业务编号: 前缀-YYMMDD-四位流水号
  business_code := doc_prefix || '-' || today_key || '-' || LPAD(next_seq::TEXT, 4, '0');

  RETURN business_code;
END;
$$;
