-- Platform fee is 10% of the gig amount. Contracts already in progress are treated as funded.
UPDATE "PAYMENT" SET "platform_fee" = ROUND("amount" * 0.10, 2);

UPDATE "PAYMENT" p SET "status" = 'held'
FROM "TASKS" t
WHERE p."task_id" = t."task_id" AND t."status" = 'in_progress' AND p."status" = 'pending';
