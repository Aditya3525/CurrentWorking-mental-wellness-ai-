/**
 * Script to safely delete a user and all related data
 * Usage: npx tsx backend/scripts/delete-user.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteUser(email: string) {
  try {
    console.log(`\n🔍 Looking for user: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        assessments: true,
        moodEntries: true,
        planModules: true,
        conversations: true,
        chatMessages: true,
        conversationMemory: true,
        conversationGoals: true,
        progressTracking: true,
        assessmentInsight: true,
        assessmentSessions: true,
        contentEngagements: true,
        chatbotConversations: true,
        dashboardInsights: true,
      }
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log(`\n📊 User found: ${user.name} (${user.email})`);
    console.log(`📋 Related data:`);
    console.log(`   - ${user.assessments.length} assessment results`);
    console.log(`   - ${user.moodEntries.length} mood entries`);
    console.log(`   - ${user.planModules.length} plan modules`);
    console.log(`   - ${user.conversations.length} conversations`);
    console.log(`   - ${user.chatMessages.length} chat messages`);
    console.log(`   - ${user.conversationGoals.length} conversation goals`);
    console.log(`   - ${user.progressTracking.length} progress tracking records`);
    console.log(`   - ${user.assessmentSessions.length} assessment sessions`);
    console.log(`   - ${user.contentEngagements.length} content engagements`);
    console.log(`   - ${user.chatbotConversations.length} chatbot conversations`);

    console.log(`\n⚠️  This will permanently delete the user and ALL related data.`);
    
    // If CASCADE is working properly, this single delete should handle everything
    console.log(`\n🗑️  Deleting user...`);
    
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log(`✅ User successfully deleted: ${email}\n`);
    
  } catch (error) {
    console.error(`\n❌ Error deleting user:`, error);
    
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      console.log(`\n💡 Foreign key constraint issue detected.`);
      console.log(`   This might be because SQLite foreign keys are not enabled.`);
      console.log(`   Attempting manual cascade deletion...\n`);
      
      await manualCascadeDelete(email);
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function manualCascadeDelete(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log(`🔄 Manually deleting related records...`);

    // Delete in order of dependencies
    await prisma.contentEngagement.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted content engagements`);

    await prisma.dashboardInsights.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted dashboard insights`);

    await prisma.chatbotConversation.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted chatbot conversations`);

    await prisma.assessmentInsight.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted assessment insights`);

    await prisma.progressTracking.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted progress tracking`);

    await prisma.conversationGoal.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted conversation goals`);

    await prisma.conversationMemory.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted conversation memory`);

    await prisma.chatMessage.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted chat messages`);

    await prisma.conversation.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted conversations`);

    await prisma.userPlanModule.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted user plan modules`);

    await prisma.moodEntry.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted mood entries`);

    await prisma.assessmentResult.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted assessment results`);

    await prisma.assessmentSession.deleteMany({ where: { userId: user.id } });
    console.log(`   ✓ Deleted assessment sessions`);

    // Finally delete the user
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`   ✓ Deleted user\n`);

    console.log(`✅ User and all related data successfully deleted: ${email}\n`);
    
  } catch (error) {
    console.error(`\n❌ Error during manual cascade delete:`, error);
    throw error;
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error(`❌ Please provide an email address`);
  console.error(`Usage: npx tsx backend/scripts/delete-user.ts <email>`);
  process.exit(1);
}

deleteUser(email);
