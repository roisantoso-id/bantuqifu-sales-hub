-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('wechat', 'referral', 'facebook', 'website', 'cold_outreach');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'no_interest', 'ready_for_opportunity', 'discarded', 'public_pool');

-- CreateEnum
CREATE TYPE "LeadUrgency" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "LeadCategory" AS ENUM ('VISA', 'COMPANY_REGISTRATION', 'FINANCIAL_SERVICES', 'PERMIT_SERVICES', 'TAX_SERVICES');

-- CreateEnum
CREATE TYPE "DiscardReason" AS ENUM ('NO_CONTACT', 'MISMATCH_NEEDS', 'LIMITED_SALES_CAPABILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerLevel" AS ENUM ('L2', 'L3', 'L4', 'L5', 'L6');

-- CreateEnum
CREATE TYPE "ChinaEntityStatus" AS ENUM ('OPERATING', 'REVOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('VISA', 'COMPANY_REGISTRATION', 'FACTORY_SETUP', 'TAX_SERVICES', 'PERMIT_SERVICES', 'FINANCIAL_SERVICES', 'IMMIGRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('active', 'won', 'lost');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('FORM', 'MATCH', 'STAGE_CHANGE', 'NOTE', 'QUOTE', 'CREATE');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('NOTE', 'CALL', 'VISIT', 'MEETING', 'EMAIL', 'STAGE_CHANGE', 'SYSTEM');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "site" TEXT NOT NULL DEFAULT 'ID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "users_auth" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("userId","organizationId")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadCode" TEXT NOT NULL,
    "wechatName" TEXT NOT NULL,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "category" "LeadCategory",
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "budgetCurrency" TEXT NOT NULL DEFAULT 'CNY',
    "urgency" "LeadUrgency" NOT NULL DEFAULT 'MEDIUM',
    "initialIntent" TEXT NOT NULL,
    "assigneeId" TEXT,
    "nextFollowDate" TIMESTAMP(3),
    "lastActionAt" TIMESTAMP(3),
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "discardedAt" TIMESTAMP(3),
    "discardReason" "DiscardReason",
    "discardedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "convertedOpportunityId" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "passportNo" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "wechat" TEXT,
    "level" "CustomerLevel" NOT NULL DEFAULT 'L5',
    "levelDictId" TEXT,
    "industryId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "wechat" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_followups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "operatorId" TEXT,
    "followupType" TEXT NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_followup_attachments" (
    "id" TEXT NOT NULL,
    "followupId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_followup_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domestic_entities" (
    "id" TEXT NOT NULL,
    "creditCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalPerson" TEXT,
    "regCapital" TEXT,
    "businessScope" TEXT,
    "status" "ChinaEntityStatus" NOT NULL,
    "industry" TEXT,
    "foundedDate" TIMESTAMP(3),
    "registrationLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domestic_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domestic_entity_associations" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "chinaEntityId" TEXT NOT NULL,
    "businessMatch" TEXT NOT NULL DEFAULT 'medium',
    "riskLevel" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "associatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domestic_entity_associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foreign_company_entities" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "legalPerson" TEXT,
    "regCapital" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foreign_company_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "description" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "billingCycles" TEXT[] DEFAULT ARRAY['一次性']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "opportunityCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL DEFAULT 'P1',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'active',
    "serviceType" "ServiceType" NOT NULL,
    "serviceTypeLabel" TEXT NOT NULL,
    "estimatedAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "requirements" TEXT,
    "notes" TEXT,
    "destination" TEXT,
    "travelDate" TIMESTAMP(3),
    "assigneeId" TEXT NOT NULL,
    "wechatGroupId" INTEGER,
    "wechatGroupName" TEXT,
    "pinnedByUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "convertedFromLeadId" TEXT,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p2_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cycle" TEXT,

    CONSTRAINT "opportunity_p2_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p3_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lockedPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "recommendedPrice" DOUBLE PRECISION,
    "costFloor" DOUBLE PRECISION,
    "profitMargin" DOUBLE PRECISION,
    "approvalStatus" TEXT NOT NULL DEFAULT 'auto-approved',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,

    CONSTRAINT "opportunity_p3_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p4_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "contractFileUrl" TEXT,
    "contractStatus" TEXT NOT NULL DEFAULT 'pending',
    "uploadedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "opportunity_p4_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p5_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "accountHolder" TEXT,
    "swiftCode" TEXT,
    "dueAmount" DOUBLE PRECISION NOT NULL,
    "receivedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receiptFileUrl" TEXT,
    "receiptFileName" TEXT,
    "receiptUploadedAt" TIMESTAMP(3),
    "receiptUploadedBy" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,

    CONSTRAINT "opportunity_p5_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p6_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "opportunity_p6_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_items" (
    "id" TEXT NOT NULL,
    "p6DataId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "requirement" TEXT,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "uploadedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "material_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p7_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "finalDocumentUrl" TEXT,
    "finalDocumentName" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'in_transit',
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "opportunity_p7_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_points" (
    "id" TEXT NOT NULL,
    "p7DataId" TEXT NOT NULL,
    "productId" TEXT,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "timestamp" TIMESTAMP(3),

    CONSTRAINT "progress_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_p8_data" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceDue" DOUBLE PRECISION NOT NULL,
    "balanceReceiptUrl" TEXT,
    "balanceReceivedAt" TIMESTAMP(3),
    "balanceStatus" TEXT NOT NULL DEFAULT 'pending',
    "totalRefund" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netBalance" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION,
    "settledAt" TIMESTAMP(3),
    "settledById" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "opportunity_p8_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_items" (
    "id" TEXT NOT NULL,
    "p8DataId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "refundedAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "refundedAt" TIMESTAMP(3),
    "refundedBy" TEXT,
    "receiptUrl" TEXT,

    CONSTRAINT "refund_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" TEXT NOT NULL,
    "p8DataId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "receiptUrl" TEXT,
    "receiptFileName" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "stageId" TEXT,
    "actionType" "ActionType" NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "remark" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_log_attachments" (
    "id" TEXT NOT NULL,
    "actionLogId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_log_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dict_industries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameId" TEXT,
    "nameEn" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dict_customer_levels" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameId" TEXT,
    "nameEn" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "colorClass" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dict_customer_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wechat_group_sequences" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wechat_group_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_counters" (
    "id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "leadId" TEXT,
    "opportunityId" TEXT,
    "operatorId" TEXT,
    "type" "InteractionType" NOT NULL DEFAULT 'NOTE',
    "content" TEXT NOT NULL,
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interaction_attachments" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_email_key" ON "users_auth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_leadCode_key" ON "leads"("leadCode");

-- CreateIndex
CREATE UNIQUE INDEX "leads_convertedOpportunityId_key" ON "leads"("convertedOpportunityId");

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assigneeId_idx" ON "leads"("assigneeId");

-- CreateIndex
CREATE INDEX "leads_discardedAt_idx" ON "leads"("discardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_organizationId_leadCode_key" ON "leads"("organizationId", "leadCode");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerId_key" ON "customers"("customerId");

-- CreateIndex
CREATE INDEX "customers_organizationId_idx" ON "customers"("organizationId");

-- CreateIndex
CREATE INDEX "customers_levelDictId_idx" ON "customers"("levelDictId");

-- CreateIndex
CREATE INDEX "customers_industryId_idx" ON "customers"("industryId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_organizationId_customerId_key" ON "customers"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "customer_followups_organizationId_idx" ON "customer_followups"("organizationId");

-- CreateIndex
CREATE INDEX "customer_followups_customerId_idx" ON "customer_followups"("customerId");

-- CreateIndex
CREATE INDEX "customer_followups_operatorId_idx" ON "customer_followups"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "domestic_entities_creditCode_key" ON "domestic_entities"("creditCode");

-- CreateIndex
CREATE UNIQUE INDEX "domestic_entity_associations_customerId_chinaEntityId_key" ON "domestic_entity_associations"("customerId", "chinaEntityId");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_organizationId_idx" ON "products"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "products_organizationId_productCode_key" ON "products"("organizationId", "productCode");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_opportunityCode_key" ON "opportunities"("opportunityCode");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_convertedFromLeadId_key" ON "opportunities"("convertedFromLeadId");

-- CreateIndex
CREATE INDEX "opportunities_organizationId_idx" ON "opportunities"("organizationId");

-- CreateIndex
CREATE INDEX "opportunities_customerId_idx" ON "opportunities"("customerId");

-- CreateIndex
CREATE INDEX "opportunities_stageId_idx" ON "opportunities"("stageId");

-- CreateIndex
CREATE INDEX "opportunities_assigneeId_idx" ON "opportunities"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_organizationId_opportunityCode_key" ON "opportunities"("organizationId", "opportunityCode");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_p4_data_opportunityId_key" ON "opportunity_p4_data"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_p5_data_opportunityId_key" ON "opportunity_p5_data"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_p6_data_opportunityId_key" ON "opportunity_p6_data"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_p7_data_opportunityId_key" ON "opportunity_p7_data"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_p8_data_opportunityId_key" ON "opportunity_p8_data"("opportunityId");

-- CreateIndex
CREATE INDEX "action_logs_organizationId_idx" ON "action_logs"("organizationId");

-- CreateIndex
CREATE INDEX "action_logs_opportunityId_idx" ON "action_logs"("opportunityId");

-- CreateIndex
CREATE INDEX "action_logs_operatorId_idx" ON "action_logs"("operatorId");

-- CreateIndex
CREATE INDEX "action_logs_timestamp_idx" ON "action_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "dict_industries_code_key" ON "dict_industries"("code");

-- CreateIndex
CREATE INDEX "dict_industries_parentId_idx" ON "dict_industries"("parentId");

-- CreateIndex
CREATE INDEX "dict_industries_sortOrder_idx" ON "dict_industries"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "dict_customer_levels_code_key" ON "dict_customer_levels"("code");

-- CreateIndex
CREATE INDEX "dict_customer_levels_sortOrder_idx" ON "dict_customer_levels"("sortOrder");

-- CreateIndex
CREATE INDEX "interactions_organizationId_idx" ON "interactions"("organizationId");

-- CreateIndex
CREATE INDEX "interactions_customerId_idx" ON "interactions"("customerId");

-- CreateIndex
CREATE INDEX "interactions_leadId_idx" ON "interactions"("leadId");

-- CreateIndex
CREATE INDEX "interactions_opportunityId_idx" ON "interactions"("opportunityId");

-- CreateIndex
CREATE INDEX "interactions_operatorId_idx" ON "interactions"("operatorId");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users_auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_levelDictId_fkey" FOREIGN KEY ("levelDictId") REFERENCES "dict_customer_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "dict_industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_followups" ADD CONSTRAINT "customer_followups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_followups" ADD CONSTRAINT "customer_followups_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_followups" ADD CONSTRAINT "customer_followups_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_followup_attachments" ADD CONSTRAINT "customer_followup_attachments_followupId_fkey" FOREIGN KEY ("followupId") REFERENCES "customer_followups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domestic_entity_associations" ADD CONSTRAINT "domestic_entity_associations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domestic_entity_associations" ADD CONSTRAINT "domestic_entity_associations_chinaEntityId_fkey" FOREIGN KEY ("chinaEntityId") REFERENCES "domestic_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foreign_company_entities" ADD CONSTRAINT "foreign_company_entities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users_auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_convertedFromLeadId_fkey" FOREIGN KEY ("convertedFromLeadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p2_data" ADD CONSTRAINT "opportunity_p2_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p2_data" ADD CONSTRAINT "opportunity_p2_data_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p3_data" ADD CONSTRAINT "opportunity_p3_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p3_data" ADD CONSTRAINT "opportunity_p3_data_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p4_data" ADD CONSTRAINT "opportunity_p4_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p5_data" ADD CONSTRAINT "opportunity_p5_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p6_data" ADD CONSTRAINT "opportunity_p6_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_p6DataId_fkey" FOREIGN KEY ("p6DataId") REFERENCES "opportunity_p6_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p7_data" ADD CONSTRAINT "opportunity_p7_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_points" ADD CONSTRAINT "progress_points_p7DataId_fkey" FOREIGN KEY ("p7DataId") REFERENCES "opportunity_p7_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_points" ADD CONSTRAINT "progress_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_p8_data" ADD CONSTRAINT "opportunity_p8_data_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_items" ADD CONSTRAINT "refund_items_p8DataId_fkey" FOREIGN KEY ("p8DataId") REFERENCES "opportunity_p8_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_p8DataId_fkey" FOREIGN KEY ("p8DataId") REFERENCES "opportunity_p8_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users_auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_log_attachments" ADD CONSTRAINT "action_log_attachments_actionLogId_fkey" FOREIGN KEY ("actionLogId") REFERENCES "action_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dict_industries" ADD CONSTRAINT "dict_industries_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "dict_industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interaction_attachments" ADD CONSTRAINT "interaction_attachments_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

