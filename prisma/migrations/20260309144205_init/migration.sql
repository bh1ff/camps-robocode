-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL,
    "capacityPerDay" INTEGER NOT NULL,
    "hafSeatsTotal" INTEGER NOT NULL,
    "allowsPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Camp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "adminPassword" TEXT NOT NULL DEFAULT 'admin2026',
    "teacherPassword" TEXT NOT NULL DEFAULT 'teacher2026',
    "lunchTime" TEXT NOT NULL DEFAULT '11:45-12:15',
    "locationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Camp_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "campId" TEXT NOT NULL,
    CONSTRAINT "CampDay_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "parentFirstName" TEXT NOT NULL,
    "parentLastName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "hafCode" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "stripeSessionId" TEXT,
    "stripePaymentStatus" TEXT,
    "campId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    CONSTRAINT "Area_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "campId" TEXT NOT NULL,
    CONSTRAINT "Session_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "ageRange" TEXT NOT NULL,
    "campId" TEXT NOT NULL,
    CONSTRAINT "Group_campId_fkey" FOREIGN KEY ("campId") REFERENCES "Camp" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    CONSTRAINT "ScheduleSlot_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleSlot_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "age" INTEGER NOT NULL,
    "hasSEND" BOOLEAN NOT NULL DEFAULT false,
    "hasEHCP" BOOLEAN NOT NULL DEFAULT false,
    "ehcpDetails" TEXT,
    "hasAllergies" BOOLEAN NOT NULL DEFAULT false,
    "allergyDetails" TEXT,
    "photoPermission" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "groupId" TEXT,
    CONSTRAINT "Child_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Child_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChildDayBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "campDayId" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedOut" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ChildDayBooking_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChildDayBooking_campDayId_fkey" FOREIGN KEY ("campDayId") REFERENCES "CampDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Attendance_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleSlot_groupId_sessionId_key" ON "ScheduleSlot"("groupId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildDayBooking_childId_campDayId_key" ON "ChildDayBooking"("childId", "campDayId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_childId_sessionId_key" ON "Attendance"("childId", "sessionId");
