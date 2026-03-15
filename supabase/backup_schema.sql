


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ActionType" AS ENUM (
    'FORM',
    'MATCH',
    'STAGE_CHANGE',
    'NOTE',
    'QUOTE',
    'CREATE'
);


ALTER TYPE "public"."ActionType" OWNER TO "postgres";


CREATE TYPE "public"."ChinaEntityStatus" AS ENUM (
    'OPERATING',
    'REVOKED',
    'CANCELLED'
);


ALTER TYPE "public"."ChinaEntityStatus" OWNER TO "postgres";


CREATE TYPE "public"."CustomerLevel" AS ENUM (
    'L2',
    'L3',
    'L4',
    'L5',
    'L6'
);


ALTER TYPE "public"."CustomerLevel" OWNER TO "postgres";


CREATE TYPE "public"."DiscardReason" AS ENUM (
    'NO_CONTACT',
    'MISMATCH_NEEDS',
    'LIMITED_SALES_CAPABILITY',
    'OTHER',
    'RETURN_TO_POOL'
);


ALTER TYPE "public"."DiscardReason" OWNER TO "postgres";


CREATE TYPE "public"."InteractionType" AS ENUM (
    'NOTE',
    'CALL',
    'VISIT',
    'MEETING',
    'EMAIL',
    'STAGE_CHANGE',
    'SYSTEM'
);


ALTER TYPE "public"."InteractionType" OWNER TO "postgres";


CREATE TYPE "public"."LeadCategory" AS ENUM (
    'VISA',
    'COMPANY_REGISTRATION',
    'FINANCIAL_SERVICES',
    'PERMIT_SERVICES',
    'TAX_SERVICES'
);


ALTER TYPE "public"."LeadCategory" OWNER TO "postgres";


CREATE TYPE "public"."LeadSource" AS ENUM (
    'wechat',
    'referral',
    'facebook',
    'website',
    'cold_outreach'
);


ALTER TYPE "public"."LeadSource" OWNER TO "postgres";


CREATE TYPE "public"."LeadStatus" AS ENUM (
    'new',
    'contacted',
    'no_interest',
    'ready_for_opportunity',
    'discarded',
    'public_pool',
    'converted'
);


ALTER TYPE "public"."LeadStatus" OWNER TO "postgres";


CREATE TYPE "public"."LeadUrgency" AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE "public"."LeadUrgency" OWNER TO "postgres";


CREATE TYPE "public"."OpportunityStatus" AS ENUM (
    'active',
    'won',
    'lost'
);


ALTER TYPE "public"."OpportunityStatus" OWNER TO "postgres";


CREATE TYPE "public"."ServiceType" AS ENUM (
    'VISA',
    'COMPANY_REGISTRATION',
    'FACTORY_SETUP',
    'TAX_SERVICES',
    'PERMIT_SERVICES',
    'FINANCIAL_SERVICES',
    'IMMIGRATION',
    'OTHER'
);


ALTER TYPE "public"."ServiceType" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."action_log_attachments" (
    "id" "text" NOT NULL,
    "actionLogId" "text" NOT NULL,
    "fileName" "text" NOT NULL,
    "fileSize" integer NOT NULL,
    "fileUrl" "text" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."action_log_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."action_logs" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "operatorId" "text" NOT NULL,
    "stageId" "text",
    "actionType" "public"."ActionType" NOT NULL,
    "actionLabel" "text" NOT NULL,
    "remark" "text",
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."action_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_contacts" (
    "id" "text" NOT NULL,
    "customerId" "text" NOT NULL,
    "contactName" "text" NOT NULL,
    "position" "text",
    "phone" "text",
    "email" "text",
    "wechat" "text",
    "isPrimary" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."customer_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_followup_attachments" (
    "id" "text" NOT NULL,
    "followupId" "text" NOT NULL,
    "fileName" "text" NOT NULL,
    "fileSize" integer NOT NULL,
    "fileUrl" "text" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."customer_followup_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_followups" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "customerId" "text" NOT NULL,
    "operatorId" "text",
    "followupType" "text" DEFAULT 'general'::"text" NOT NULL,
    "content" "text" NOT NULL,
    "nextAction" "text",
    "nextActionDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."customer_followups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "customerId" "text" NOT NULL,
    "customerName" "text" NOT NULL,
    "passportNo" "text",
    "phone" "text",
    "email" "text",
    "wechat" "text",
    "level" "public"."CustomerLevel" DEFAULT 'L5'::"public"."CustomerLevel" NOT NULL,
    "levelDictId" "text",
    "industryId" "text",
    "isLocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dict_customer_levels" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "nameZh" "text" NOT NULL,
    "nameId" "text",
    "nameEn" "text",
    "weight" integer DEFAULT 1 NOT NULL,
    "description" "text",
    "colorClass" "text",
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."dict_customer_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dict_industries" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "nameZh" "text" NOT NULL,
    "nameId" "text",
    "nameEn" "text",
    "parentId" "text",
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."dict_industries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domestic_entities" (
    "id" "text" NOT NULL,
    "creditCode" "text" NOT NULL,
    "companyName" "text" NOT NULL,
    "legalPerson" "text",
    "regCapital" "text",
    "businessScope" "text",
    "status" "public"."ChinaEntityStatus" NOT NULL,
    "industry" "text",
    "foundedDate" timestamp(3) without time zone,
    "registrationLocation" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."domestic_entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domestic_entity_associations" (
    "id" "text" NOT NULL,
    "customerId" "text" NOT NULL,
    "chinaEntityId" "text" NOT NULL,
    "businessMatch" "text" DEFAULT 'medium'::"text" NOT NULL,
    "riskLevel" "text" DEFAULT 'medium'::"text" NOT NULL,
    "notes" "text",
    "associatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."domestic_entity_associations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expense_items" (
    "id" "text" NOT NULL,
    "p8DataId" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" double precision NOT NULL,
    "category" "text" DEFAULT 'other'::"text" NOT NULL,
    "receiptUrl" "text",
    "receiptFileName" "text",
    "createdBy" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "approvedBy" "text",
    "approvedAt" timestamp(3) without time zone
);


ALTER TABLE "public"."expense_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."foreign_company_entities" (
    "id" "text" NOT NULL,
    "customerId" "text" NOT NULL,
    "companyName" "text" NOT NULL,
    "country" "text" NOT NULL,
    "registrationNumber" "text",
    "legalPerson" "text",
    "regCapital" "text",
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."foreign_company_entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interaction_attachments" (
    "id" "text" NOT NULL,
    "interactionId" "text" NOT NULL,
    "fileName" "text" NOT NULL,
    "fileUrl" "text" NOT NULL,
    "fileSize" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."interaction_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "customerId" "text",
    "leadId" "text",
    "opportunityId" "text",
    "operatorId" "text",
    "type" "public"."InteractionType" DEFAULT 'NOTE'::"public"."InteractionType" NOT NULL,
    "content" "text" NOT NULL,
    "nextAction" "text",
    "nextActionDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "leadCode" "text" NOT NULL,
    "wechatName" "text" NOT NULL,
    "phone" "text",
    "source" "public"."LeadSource" NOT NULL,
    "category" "public"."LeadCategory",
    "budgetMin" double precision,
    "budgetMax" double precision,
    "budgetCurrency" "text" DEFAULT 'CNY'::"text" NOT NULL,
    "urgency" "public"."LeadUrgency" DEFAULT 'MEDIUM'::"public"."LeadUrgency" NOT NULL,
    "initialIntent" "text" NOT NULL,
    "assigneeId" "text",
    "nextFollowDate" timestamp(3) without time zone,
    "lastActionAt" timestamp(3) without time zone,
    "status" "public"."LeadStatus" DEFAULT 'new'::"public"."LeadStatus" NOT NULL,
    "discardedAt" timestamp(3) without time zone,
    "discardReason" "public"."DiscardReason",
    "discardedById" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "notes" "text",
    "convertedOpportunityId" "text",
    "assignedToId" "text",
    "updatedById" "text",
    "createdById" "text",
    "customerId" "text",
    "wechatGroupId" integer,
    "wechatGroupName" "text"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_items" (
    "id" "text" NOT NULL,
    "p6DataId" "text" NOT NULL,
    "productId" "text",
    "name" "text" NOT NULL,
    "requirement" "text",
    "status" "text" DEFAULT 'missing'::"text" NOT NULL,
    "fileUrl" "text",
    "fileName" "text",
    "fileSize" integer,
    "ocrStatus" "text" DEFAULT 'pending'::"text" NOT NULL,
    "rejectionReason" "text",
    "uploadedAt" timestamp(3) without time zone,
    "uploadedBy" "text",
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" "text"
);


ALTER TABLE "public"."material_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "opportunityCode" "text" NOT NULL,
    "customerId" "text" NOT NULL,
    "stageId" "text" DEFAULT 'P1'::"text" NOT NULL,
    "status" "public"."OpportunityStatus" DEFAULT 'active'::"public"."OpportunityStatus" NOT NULL,
    "serviceType" "public"."ServiceType" NOT NULL,
    "serviceTypeLabel" "text" NOT NULL,
    "estimatedAmount" double precision NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "requirements" "text",
    "notes" "text",
    "destination" "text",
    "travelDate" timestamp(3) without time zone,
    "assigneeId" "text" NOT NULL,
    "wechatGroupId" integer,
    "wechatGroupName" "text",
    "pinnedByUsers" "text"[] DEFAULT ARRAY[]::"text"[],
    "expectedCloseDate" timestamp(3) without time zone,
    "actualCloseDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "convertedFromLeadId" "text"
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p2_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "productId" "text" NOT NULL,
    "cycle" "text"
);


ALTER TABLE "public"."opportunity_p2_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p3_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "productId" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "lockedPrice" double precision NOT NULL,
    "currency" "text" NOT NULL,
    "recommendedPrice" double precision,
    "costFloor" double precision,
    "profitMargin" double precision,
    "approvalStatus" "text" DEFAULT 'auto-approved'::"text" NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "approvedById" "text"
);


ALTER TABLE "public"."opportunity_p3_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p4_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "contractFileUrl" "text",
    "contractStatus" "text" DEFAULT 'pending'::"text" NOT NULL,
    "uploadedAt" timestamp(3) without time zone,
    "notes" "text"
);


ALTER TABLE "public"."opportunity_p4_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p5_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "bankAccount" "text",
    "bankName" "text",
    "accountHolder" "text",
    "swiftCode" "text",
    "dueAmount" double precision NOT NULL,
    "receivedAmount" double precision DEFAULT 0 NOT NULL,
    "receiptFileUrl" "text",
    "receiptFileName" "text",
    "receiptUploadedAt" timestamp(3) without time zone,
    "receiptUploadedBy" "text",
    "paymentStatus" "text" DEFAULT 'pending'::"text" NOT NULL,
    "rejectionReason" "text",
    "confirmedAt" timestamp(3) without time zone,
    "confirmedById" "text"
);


ALTER TABLE "public"."opportunity_p5_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p6_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "lastUpdatedAt" timestamp(3) without time zone
);


ALTER TABLE "public"."opportunity_p6_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p7_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "finalDocumentUrl" "text",
    "finalDocumentName" "text",
    "deliveryStatus" "text" DEFAULT 'in_transit'::"text" NOT NULL,
    "deliveredAt" timestamp(3) without time zone,
    "notes" "text",
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE "public"."opportunity_p7_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunity_p8_data" (
    "id" "text" NOT NULL,
    "opportunityId" "text" NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision DEFAULT 0 NOT NULL,
    "balanceDue" double precision NOT NULL,
    "balanceReceiptUrl" "text",
    "balanceReceivedAt" timestamp(3) without time zone,
    "balanceStatus" "text" DEFAULT 'pending'::"text" NOT NULL,
    "totalRefund" double precision DEFAULT 0 NOT NULL,
    "totalExpense" double precision DEFAULT 0 NOT NULL,
    "netBalance" double precision NOT NULL,
    "profitMargin" double precision,
    "settledAt" timestamp(3) without time zone,
    "settledById" "text",
    "archived" boolean DEFAULT false NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."opportunity_p8_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "site" "text" DEFAULT 'ID'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "module" "text" NOT NULL,
    "description" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "productCode" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "price" double precision NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "description" "text",
    "difficulty" integer DEFAULT 1 NOT NULL,
    "billingCycles" "text"[] DEFAULT ARRAY['一次性'::"text"],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progress_points" (
    "id" "text" NOT NULL,
    "p7DataId" "text" NOT NULL,
    "productId" "text",
    "label" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "timestamp" timestamp(3) without time zone
);


ALTER TABLE "public"."progress_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refund_items" (
    "id" "text" NOT NULL,
    "p8DataId" "text" NOT NULL,
    "serviceId" "text" NOT NULL,
    "serviceName" "text" NOT NULL,
    "originalAmount" double precision NOT NULL,
    "refundedAmount" double precision NOT NULL,
    "reason" "text" NOT NULL,
    "refundedAt" timestamp(3) without time zone,
    "refundedBy" "text",
    "receiptUrl" "text"
);


ALTER TABLE "public"."refund_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "roleId" "text" NOT NULL,
    "permissionId" "text" NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_counters" (
    "id" "text" NOT NULL,
    "sequence" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."system_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_organizations" (
    "userId" "text" NOT NULL,
    "organizationId" "text" NOT NULL,
    "roleId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."user_organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users_auth" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."users_auth" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wechat_group_sequences" (
    "id" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."wechat_group_sequences" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."wechat_group_sequences_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."wechat_group_sequences_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."wechat_group_sequences_id_seq" OWNED BY "public"."wechat_group_sequences"."id";



ALTER TABLE ONLY "public"."wechat_group_sequences" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."wechat_group_sequences_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."action_log_attachments"
    ADD CONSTRAINT "action_log_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."action_logs"
    ADD CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_contacts"
    ADD CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_followup_attachments"
    ADD CONSTRAINT "customer_followup_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_followups"
    ADD CONSTRAINT "customer_followups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dict_customer_levels"
    ADD CONSTRAINT "dict_customer_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dict_industries"
    ADD CONSTRAINT "dict_industries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domestic_entities"
    ADD CONSTRAINT "domestic_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domestic_entity_associations"
    ADD CONSTRAINT "domestic_entity_associations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."foreign_company_entities"
    ADD CONSTRAINT "foreign_company_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_attachments"
    ADD CONSTRAINT "interaction_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_items"
    ADD CONSTRAINT "material_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p2_data"
    ADD CONSTRAINT "opportunity_p2_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p3_data"
    ADD CONSTRAINT "opportunity_p3_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p4_data"
    ADD CONSTRAINT "opportunity_p4_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p5_data"
    ADD CONSTRAINT "opportunity_p5_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p6_data"
    ADD CONSTRAINT "opportunity_p6_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p7_data"
    ADD CONSTRAINT "opportunity_p7_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_p8_data"
    ADD CONSTRAINT "opportunity_p8_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progress_points"
    ADD CONSTRAINT "progress_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refund_items"
    ADD CONSTRAINT "refund_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_counters"
    ADD CONSTRAINT "system_counters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("userId", "organizationId");



ALTER TABLE ONLY "public"."users_auth"
    ADD CONSTRAINT "users_auth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wechat_group_sequences"
    ADD CONSTRAINT "wechat_group_sequences_pkey" PRIMARY KEY ("id");



CREATE INDEX "action_logs_operatorId_idx" ON "public"."action_logs" USING "btree" ("operatorId");



CREATE INDEX "action_logs_opportunityId_idx" ON "public"."action_logs" USING "btree" ("opportunityId");



CREATE INDEX "action_logs_organizationId_idx" ON "public"."action_logs" USING "btree" ("organizationId");



CREATE INDEX "action_logs_timestamp_idx" ON "public"."action_logs" USING "btree" ("timestamp");



CREATE INDEX "customer_followups_customerId_idx" ON "public"."customer_followups" USING "btree" ("customerId");



CREATE INDEX "customer_followups_operatorId_idx" ON "public"."customer_followups" USING "btree" ("operatorId");



CREATE INDEX "customer_followups_organizationId_idx" ON "public"."customer_followups" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "customers_customerId_key" ON "public"."customers" USING "btree" ("customerId");



CREATE INDEX "customers_industryId_idx" ON "public"."customers" USING "btree" ("industryId");



CREATE INDEX "customers_levelDictId_idx" ON "public"."customers" USING "btree" ("levelDictId");



CREATE UNIQUE INDEX "customers_organizationId_customerId_key" ON "public"."customers" USING "btree" ("organizationId", "customerId");



CREATE INDEX "customers_organizationId_idx" ON "public"."customers" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "dict_customer_levels_code_key" ON "public"."dict_customer_levels" USING "btree" ("code");



CREATE INDEX "dict_customer_levels_sortOrder_idx" ON "public"."dict_customer_levels" USING "btree" ("sortOrder");



CREATE UNIQUE INDEX "dict_industries_code_key" ON "public"."dict_industries" USING "btree" ("code");



CREATE INDEX "dict_industries_parentId_idx" ON "public"."dict_industries" USING "btree" ("parentId");



CREATE INDEX "dict_industries_sortOrder_idx" ON "public"."dict_industries" USING "btree" ("sortOrder");



CREATE UNIQUE INDEX "domestic_entities_creditCode_key" ON "public"."domestic_entities" USING "btree" ("creditCode");



CREATE UNIQUE INDEX "domestic_entity_associations_customerId_chinaEntityId_key" ON "public"."domestic_entity_associations" USING "btree" ("customerId", "chinaEntityId");



CREATE INDEX "interactions_customerId_idx" ON "public"."interactions" USING "btree" ("customerId");



CREATE INDEX "interactions_leadId_idx" ON "public"."interactions" USING "btree" ("leadId");



CREATE INDEX "interactions_operatorId_idx" ON "public"."interactions" USING "btree" ("operatorId");



CREATE INDEX "interactions_opportunityId_idx" ON "public"."interactions" USING "btree" ("opportunityId");



CREATE INDEX "interactions_organizationId_idx" ON "public"."interactions" USING "btree" ("organizationId");



CREATE INDEX "leads_assigneeId_idx" ON "public"."leads" USING "btree" ("assigneeId");



CREATE UNIQUE INDEX "leads_convertedOpportunityId_key" ON "public"."leads" USING "btree" ("convertedOpportunityId");



CREATE INDEX "leads_discardedAt_idx" ON "public"."leads" USING "btree" ("discardedAt");



CREATE UNIQUE INDEX "leads_leadCode_key" ON "public"."leads" USING "btree" ("leadCode");



CREATE INDEX "leads_organizationId_idx" ON "public"."leads" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "leads_organizationId_leadCode_key" ON "public"."leads" USING "btree" ("organizationId", "leadCode");



CREATE INDEX "leads_status_idx" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "opportunities_assigneeId_idx" ON "public"."opportunities" USING "btree" ("assigneeId");



CREATE UNIQUE INDEX "opportunities_convertedFromLeadId_key" ON "public"."opportunities" USING "btree" ("convertedFromLeadId");



CREATE INDEX "opportunities_customerId_idx" ON "public"."opportunities" USING "btree" ("customerId");



CREATE UNIQUE INDEX "opportunities_opportunityCode_key" ON "public"."opportunities" USING "btree" ("opportunityCode");



CREATE INDEX "opportunities_organizationId_idx" ON "public"."opportunities" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "opportunities_organizationId_opportunityCode_key" ON "public"."opportunities" USING "btree" ("organizationId", "opportunityCode");



CREATE INDEX "opportunities_stageId_idx" ON "public"."opportunities" USING "btree" ("stageId");



CREATE UNIQUE INDEX "opportunity_p4_data_opportunityId_key" ON "public"."opportunity_p4_data" USING "btree" ("opportunityId");



CREATE UNIQUE INDEX "opportunity_p5_data_opportunityId_key" ON "public"."opportunity_p5_data" USING "btree" ("opportunityId");



CREATE UNIQUE INDEX "opportunity_p6_data_opportunityId_key" ON "public"."opportunity_p6_data" USING "btree" ("opportunityId");



CREATE UNIQUE INDEX "opportunity_p7_data_opportunityId_key" ON "public"."opportunity_p7_data" USING "btree" ("opportunityId");



CREATE UNIQUE INDEX "opportunity_p8_data_opportunityId_key" ON "public"."opportunity_p8_data" USING "btree" ("opportunityId");



CREATE UNIQUE INDEX "organizations_code_key" ON "public"."organizations" USING "btree" ("code");



CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions" USING "btree" ("code");



CREATE INDEX "products_organizationId_idx" ON "public"."products" USING "btree" ("organizationId");



CREATE UNIQUE INDEX "products_organizationId_productCode_key" ON "public"."products" USING "btree" ("organizationId", "productCode");



CREATE UNIQUE INDEX "products_productCode_key" ON "public"."products" USING "btree" ("productCode");



CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles" USING "btree" ("code");



CREATE UNIQUE INDEX "users_auth_email_key" ON "public"."users_auth" USING "btree" ("email");



ALTER TABLE ONLY "public"."action_log_attachments"
    ADD CONSTRAINT "action_log_attachments_actionLogId_fkey" FOREIGN KEY ("actionLogId") REFERENCES "public"."action_logs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_logs"
    ADD CONSTRAINT "action_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."users_auth"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."action_logs"
    ADD CONSTRAINT "action_logs_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_logs"
    ADD CONSTRAINT "action_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_contacts"
    ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_followup_attachments"
    ADD CONSTRAINT "customer_followup_attachments_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "public"."customer_followups"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_followups"
    ADD CONSTRAINT "customer_followups_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_followups"
    ADD CONSTRAINT "customer_followups_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."users_auth"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_followups"
    ADD CONSTRAINT "customer_followups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "public"."dict_industries"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_levelDictId_fkey" FOREIGN KEY ("levelDictId") REFERENCES "public"."dict_customer_levels"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dict_industries"
    ADD CONSTRAINT "dict_industries_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."dict_industries"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."domestic_entity_associations"
    ADD CONSTRAINT "domestic_entity_associations_chinaEntityId_fkey" FOREIGN KEY ("chinaEntityId") REFERENCES "public"."domestic_entities"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."domestic_entity_associations"
    ADD CONSTRAINT "domestic_entity_associations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expense_items"
    ADD CONSTRAINT "expense_items_p8DataId_fkey" FOREIGN KEY ("p8DataId") REFERENCES "public"."opportunity_p8_data"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."foreign_company_entities"
    ADD CONSTRAINT "foreign_company_entities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction_attachments"
    ADD CONSTRAINT "interaction_attachments_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "public"."interactions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "public"."users_auth"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users_auth"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_customerid_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_items"
    ADD CONSTRAINT "material_items_p6DataId_fkey" FOREIGN KEY ("p6DataId") REFERENCES "public"."opportunity_p6_data"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_items"
    ADD CONSTRAINT "material_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users_auth"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_convertedFromLeadId_fkey" FOREIGN KEY ("convertedFromLeadId") REFERENCES "public"."leads"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p2_data"
    ADD CONSTRAINT "opportunity_p2_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p2_data"
    ADD CONSTRAINT "opportunity_p2_data_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_p3_data"
    ADD CONSTRAINT "opportunity_p3_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p3_data"
    ADD CONSTRAINT "opportunity_p3_data_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_p4_data"
    ADD CONSTRAINT "opportunity_p4_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p5_data"
    ADD CONSTRAINT "opportunity_p5_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p6_data"
    ADD CONSTRAINT "opportunity_p6_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p7_data"
    ADD CONSTRAINT "opportunity_p7_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_p8_data"
    ADD CONSTRAINT "opportunity_p8_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_points"
    ADD CONSTRAINT "progress_points_p7DataId_fkey" FOREIGN KEY ("p7DataId") REFERENCES "public"."opportunity_p7_data"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progress_points"
    ADD CONSTRAINT "progress_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."refund_items"
    ADD CONSTRAINT "refund_items_p8DataId_fkey" FOREIGN KEY ("p8DataId") REFERENCES "public"."opportunity_p8_data"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_organizations"
    ADD CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users_auth"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."action_log_attachments" TO "anon";
GRANT ALL ON TABLE "public"."action_log_attachments" TO "authenticated";



GRANT ALL ON TABLE "public"."action_logs" TO "anon";
GRANT ALL ON TABLE "public"."action_logs" TO "authenticated";



GRANT ALL ON TABLE "public"."customer_contacts" TO "anon";
GRANT ALL ON TABLE "public"."customer_contacts" TO "authenticated";



GRANT ALL ON TABLE "public"."customer_followup_attachments" TO "anon";
GRANT ALL ON TABLE "public"."customer_followup_attachments" TO "authenticated";



GRANT ALL ON TABLE "public"."customer_followups" TO "anon";
GRANT ALL ON TABLE "public"."customer_followups" TO "authenticated";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";



GRANT ALL ON TABLE "public"."dict_customer_levels" TO "anon";
GRANT ALL ON TABLE "public"."dict_customer_levels" TO "authenticated";



GRANT ALL ON TABLE "public"."dict_industries" TO "anon";
GRANT ALL ON TABLE "public"."dict_industries" TO "authenticated";



GRANT ALL ON TABLE "public"."domestic_entities" TO "anon";
GRANT ALL ON TABLE "public"."domestic_entities" TO "authenticated";



GRANT ALL ON TABLE "public"."domestic_entity_associations" TO "anon";
GRANT ALL ON TABLE "public"."domestic_entity_associations" TO "authenticated";



GRANT ALL ON TABLE "public"."expense_items" TO "anon";
GRANT ALL ON TABLE "public"."expense_items" TO "authenticated";



GRANT ALL ON TABLE "public"."foreign_company_entities" TO "anon";
GRANT ALL ON TABLE "public"."foreign_company_entities" TO "authenticated";



GRANT ALL ON TABLE "public"."interaction_attachments" TO "anon";
GRANT ALL ON TABLE "public"."interaction_attachments" TO "authenticated";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";



GRANT ALL ON TABLE "public"."material_items" TO "anon";
GRANT ALL ON TABLE "public"."material_items" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunities" TO "anon";
GRANT ALL ON TABLE "public"."opportunities" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p2_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p2_data" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p3_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p3_data" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p4_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p4_data" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p5_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p5_data" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p6_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p6_data" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p7_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p7_data" TO "authenticated";



GRANT ALL ON TABLE "public"."opportunity_p8_data" TO "anon";
GRANT ALL ON TABLE "public"."opportunity_p8_data" TO "authenticated";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";



GRANT ALL ON TABLE "public"."progress_points" TO "anon";
GRANT ALL ON TABLE "public"."progress_points" TO "authenticated";



GRANT ALL ON TABLE "public"."refund_items" TO "anon";
GRANT ALL ON TABLE "public"."refund_items" TO "authenticated";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";



GRANT ALL ON TABLE "public"."system_counters" TO "anon";
GRANT ALL ON TABLE "public"."system_counters" TO "authenticated";



GRANT ALL ON TABLE "public"."user_organizations" TO "anon";
GRANT ALL ON TABLE "public"."user_organizations" TO "authenticated";



GRANT ALL ON TABLE "public"."users_auth" TO "anon";
GRANT ALL ON TABLE "public"."users_auth" TO "authenticated";



GRANT ALL ON TABLE "public"."wechat_group_sequences" TO "anon";
GRANT ALL ON TABLE "public"."wechat_group_sequences" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."wechat_group_sequences_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."wechat_group_sequences_id_seq" TO "authenticated";


































