-- QA: ledger consistency checks (run against fintech DB after test runs)
-- Convention: wallet balance = SUM(debit_minor) - SUM(credit_minor)

-- 1) Every journal should have exactly two lines (after completed transfers)
SELECT
  j.id,
  j.idempotency_key,
  COUNT(e.id) AS line_count
FROM
  public.ledger_journals j
  LEFT JOIN public.ledger_entries e ON e.journal_id = j.id
WHERE
  j.source = 'ledger.transfer'
GROUP BY
  j.id,
  j.idempotency_key
HAVING
  COUNT(e.id) NOT IN (0, 2);

-- 2) Each journal with 2 lines should balance: sum debits = sum credits per currency
SELECT
  j.id,
  j.idempotency_key,
  SUM(e.debit_minor) AS total_debit,
  SUM(e.credit_minor) AS total_credit
FROM
  public.ledger_journals j
  JOIN public.ledger_entries e ON e.journal_id = j.id
GROUP BY
  j.id,
  j.idempotency_key
HAVING
  SUM(e.debit_minor) <> SUM(e.credit_minor);

-- 3) Duplicate idempotency keys on journals (should be empty — UNIQUE constraint)
SELECT
  idempotency_key,
  COUNT(*) AS n
FROM
  public.ledger_journals
GROUP BY
  idempotency_key
HAVING
  COUNT(*) > 1;
