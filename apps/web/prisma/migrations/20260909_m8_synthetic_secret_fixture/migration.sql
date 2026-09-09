UPDATE "EvaluationCase"
SET "input"='{"output":"api_key=synthetic_test_value"}'::jsonb
WHERE id='m8-case-secret-disclosure-001';