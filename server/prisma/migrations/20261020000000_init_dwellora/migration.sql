-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('resident', 'guard', 'secretary', 'committee', 'facility_manager', 'vendor', 'admin');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PassType" AS ENUM ('GUEST', 'DELIVERY', 'CAB', 'SERVICE', 'FREQUENT');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('PENDING', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "societies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT,
    "total_towers" INTEGER NOT NULL DEFAULT 0,
    "total_flats" INTEGER NOT NULL DEFAULT 0,
    "established_year" INTEGER,
    "gate_count" INTEGER NOT NULL DEFAULT 1,
    "amenities_count" INTEGER NOT NULL DEFAULT 0,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "towers" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "block_code" TEXT,
    "total_floors" INTEGER NOT NULL DEFAULT 1,
    "total_units" INTEGER NOT NULL DEFAULT 0,
    "has_elevator" BOOLEAN NOT NULL DEFAULT true,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "towers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flats" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "tower_id" TEXT NOT NULL,
    "flat_number" TEXT NOT NULL,
    "floor_number" INTEGER NOT NULL DEFAULT 0,
    "intercom_extension" TEXT,
    "bhk_type" TEXT,
    "carpet_area_sqft" DECIMAL(10,2),
    "occupancy_status" TEXT NOT NULL DEFAULT 'VACANT',
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "society_id" TEXT,
    "flat_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'resident',
    "flat_number" TEXT,
    "flat_details" TEXT,
    "designation" TEXT,
    "avatar_url" TEXT,
    "fcm_token" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "preferences" JSONB DEFAULT '{"theme": "dark", "notifications": true}',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "user_id" TEXT,
    "flat_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "resident_type" TEXT NOT NULL DEFAULT 'OWNER',
    "move_in_date" DATE,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT,
    "age" INTEGER,
    "has_app_access" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "make_model" TEXT,
    "color" TEXT,
    "parking_slot_id" TEXT,
    "rfid_tag" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "role_category" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "shift_timings" TEXT,
    "is_police_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domestic_workers" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passcode" TEXT,
    "rating" DECIMAL(2,1) DEFAULT 5.0,
    "associated_flats" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "current_status" TEXT NOT NULL DEFAULT 'OUTSIDE',
    "is_police_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domestic_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gst_number" TEXT,
    "rating" DECIMAL(2,1) DEFAULT 4.8,
    "logo_url" TEXT,
    "document_url" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_passes" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "resident_id" TEXT,
    "flat_id" TEXT,
    "visitor_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pass_type" "PassType" NOT NULL DEFAULT 'GUEST',
    "vehicle_number" TEXT,
    "purpose" TEXT,
    "status" "PassStatus" NOT NULL DEFAULT 'PENDING',
    "qr_code_hash" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "courier_company" TEXT NOT NULL,
    "delivery_partner_name" TEXT,
    "tracking_number" TEXT,
    "arrival_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "picked_up_at" TIMESTAMP(3),
    "pickup_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AT_GATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_cycles" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "cycle_name" TEXT NOT NULL,
    "month_year" TEXT NOT NULL,
    "billing_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "late_fee_amount" DECIMAL(10,2) DEFAULT 0.00,
    "total_billed_amount" DECIMAL(12,2) DEFAULT 0.00,
    "total_collected_amount" DECIMAL(12,2) DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_invoices" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "cycle_id" TEXT,
    "resident_id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "maintenance_amount" DECIMAL(10,2) NOT NULL,
    "utility_amount" DECIMAL(10,2) DEFAULT 0.00,
    "sinking_fund" DECIMAL(10,2) DEFAULT 0.00,
    "late_fee" DECIMAL(10,2) DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) DEFAULT 0.00,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "payment_mode" TEXT,
    "paid_at" TIMESTAMP(3),
    "breakdown" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "capacity_per_slot" INTEGER NOT NULL DEFAULT 10,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "hourly_charge" DECIMAL(10,2) DEFAULT 0.00,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "rules_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_tickets" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "resident_id" TEXT,
    "flat_id" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_staff_name" TEXT,
    "feedback_notes" TEXT,
    "attachment_url" TEXT,
    "rating" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_slots" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "slot_number" TEXT NOT NULL,
    "tower_block" TEXT,
    "slot_type" TEXT NOT NULL DEFAULT 'RESIDENT',
    "allocated_flat_id" TEXT,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_incidents" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "incident_type" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'HIGH',
    "location" TEXT NOT NULL,
    "description" TEXT,
    "dispatch_status" TEXT NOT NULL DEFAULT 'DISPATCHED',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "data" JSONB DEFAULT '{}',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "role" "UserRole",
    "action" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "author_name" TEXT,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "attachment_url" TEXT,
    "attachment_name" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_events" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "rsvp_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "image_url" TEXT,
    "cta_text" TEXT DEFAULT 'Claim Offer',
    "cta_link" TEXT,
    "discount_code" TEXT,
    "category" TEXT NOT NULL DEFAULT 'SERVICES',
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "resident_id" TEXT,
    "user_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "razorpay_signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "payment_method" TEXT DEFAULT 'RAZORPAY',
    "failure_reason" TEXT,
    "refund_id" TEXT,
    "refund_amount" DECIMAL(10,2) DEFAULT 0.00,
    "refund_reason" TEXT,
    "refunded_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_records" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "societies_code_key" ON "societies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "flats_tower_id_flat_number_key" ON "flats"("tower_id", "flat_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_invoice_number_key" ON "billing_invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payments_society_id_status_idx" ON "payments"("society_id", "status");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_event_id_key" ON "webhook_events"("event_id");

-- CreateIndex
CREATE INDEX "entity_records_collection_society_id_idx" ON "entity_records"("collection", "society_id");

-- AddForeignKey
ALTER TABLE "towers" ADD CONSTRAINT "towers_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flats" ADD CONSTRAINT "flats_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flats" ADD CONSTRAINT "flats_tower_id_fkey" FOREIGN KEY ("tower_id") REFERENCES "towers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domestic_workers" ADD CONSTRAINT "domestic_workers_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_passes" ADD CONSTRAINT "visitor_passes_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "billing_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_slots" ADD CONSTRAINT "parking_slots_allocated_flat_id_fkey" FOREIGN KEY ("allocated_flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_incidents" ADD CONSTRAINT "emergency_incidents_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_events" ADD CONSTRAINT "community_events_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "billing_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_records" ADD CONSTRAINT "entity_records_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
