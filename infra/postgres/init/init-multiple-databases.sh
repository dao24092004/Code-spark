#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE identity_db;
    CREATE DATABASE profile_db;
    CREATE DATABASE shared_db;
    CREATE DATABASE course_db;
    CREATE DATABASE organization_db;
    CREATE DATABASE admin_db;
    CREATE DATABASE analytics_db;
    CREATE DATABASE copyright_db;
    CREATE DATABASE exam_db;
    CREATE DATABASE multisig_db;
EOSQL