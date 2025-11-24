-- CreateTable
CREATE TABLE "LeaderboardGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardGroupInvitation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardGroupInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardGroup_inviteCode_key" ON "LeaderboardGroup"("inviteCode");

-- CreateIndex
CREATE INDEX "LeaderboardGroup_createdBy_idx" ON "LeaderboardGroup"("createdBy");

-- CreateIndex
CREATE INDEX "LeaderboardGroup_inviteCode_idx" ON "LeaderboardGroup"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardGroupMember_groupId_userId_key" ON "LeaderboardGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "LeaderboardGroupMember_groupId_idx" ON "LeaderboardGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "LeaderboardGroupMember_userId_idx" ON "LeaderboardGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardGroupInvitation_groupId_email_key" ON "LeaderboardGroupInvitation"("groupId", "email");

-- CreateIndex
CREATE INDEX "LeaderboardGroupInvitation_groupId_idx" ON "LeaderboardGroupInvitation"("groupId");

-- CreateIndex
CREATE INDEX "LeaderboardGroupInvitation_email_idx" ON "LeaderboardGroupInvitation"("email");

-- CreateIndex
CREATE INDEX "LeaderboardGroupInvitation_status_idx" ON "LeaderboardGroupInvitation"("status");

-- AddForeignKey
ALTER TABLE "LeaderboardGroup" ADD CONSTRAINT "LeaderboardGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardGroupMember" ADD CONSTRAINT "LeaderboardGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LeaderboardGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardGroupMember" ADD CONSTRAINT "LeaderboardGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardGroupInvitation" ADD CONSTRAINT "LeaderboardGroupInvitation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LeaderboardGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardGroupInvitation" ADD CONSTRAINT "LeaderboardGroupInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
