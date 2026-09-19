-- Existing completed rows predate balance_credited.
-- Mark them as already credited to prevent a duplicate balance increase.
update public.payment_transactions
set balance_credited = true
where status = 'completed'
  and balance_credited = false;
