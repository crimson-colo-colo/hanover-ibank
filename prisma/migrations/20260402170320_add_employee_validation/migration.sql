ALTER TABLE "Employee" ADD CONSTRAINT email_check CHECK ("email" LIKE '%@hanover.com');
ALTER TABLE "Employee" ADD CONSTRAINT name_length CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 100);