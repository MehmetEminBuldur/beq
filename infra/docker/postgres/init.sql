-- PostgreSQL initialization script for BeQ services
-- This script creates separate databases for each microservice

-- Create databases for each service
CREATE DATABASE beq_orchestrator;
CREATE DATABASE beq_scheduler;
CREATE DATABASE beq_rag;
CREATE DATABASE beq_calendar;
CREATE DATABASE beq_users;

-- Grant permissions to the beq user for all databases
GRANT ALL PRIVILEGES ON DATABASE beq_orchestrator TO beq;
GRANT ALL PRIVILEGES ON DATABASE beq_scheduler TO beq;
GRANT ALL PRIVILEGES ON DATABASE beq_rag TO beq;
GRANT ALL PRIVILEGES ON DATABASE beq_calendar TO beq;
GRANT ALL PRIVILEGES ON DATABASE beq_users TO beq;

-- Connect to each database and create extensions if needed
\c beq_orchestrator;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c beq_scheduler;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c beq_rag;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For pgvector if available

\c beq_calendar;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c beq_users;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Back to the main database
\c beq;

-- Create a common schema for shared data if needed
CREATE SCHEMA IF NOT EXISTS shared;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'BeQ PostgreSQL databases initialized successfully';
END $$;
