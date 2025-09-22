const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function showMenu() {
  console.log('\n=== DATABASE DELETION MENU ===');
  console.log('1. Delete all users');
  console.log('2. Delete specific user by email');
  console.log('3. Delete all assessments');
  console.log('4. Delete all chat messages');
  console.log('5. Delete all mood entries');
  console.log('6. Show current data counts');
  console.log('7. Exit');
  console.log('===============================');

  const choice = await askQuestion('Enter your choice (1-7): ');

  switch (choice) {
    case '1':
      await deleteAllUsers();
      break;
    case '2':
      await deleteUserByEmail();
      break;
    case '3':
      await deleteAllAssessments();
      break;
    case '4':
      await deleteAllChatMessages();
      break;
    case '5':
      await deleteAllMoodEntries();
      break;
    case '6':
      await showDataCounts();
      break;
    case '7':
      console.log('Goodbye!');
      rl.close();
      await prisma.$disconnect();
      return;
    default:
      console.log('Invalid choice. Please try again.');
  }

  await showMenu();
}

async function deleteAllUsers() {
  const confirm = await askQuestion('Are you sure you want to delete ALL users? This cannot be undone! (yes/no): ');
  if (confirm.toLowerCase() === 'yes') {
    const result = await prisma.user.deleteMany();
    console.log(`Deleted ${result.count} users.`);
  } else {
    console.log('Operation cancelled.');
  }
}

async function deleteUserByEmail() {
  const email = await askQuestion('Enter the email of the user to delete: ');
  const result = await prisma.user.deleteMany({
    where: { email: email }
  });
  console.log(`Deleted ${result.count} user(s) with email: ${email}`);
}

async function deleteAllAssessments() {
  const confirm = await askQuestion('Are you sure you want to delete ALL assessments? (yes/no): ');
  if (confirm.toLowerCase() === 'yes') {
    const result = await prisma.assessment.deleteMany();
    console.log(`Deleted ${result.count} assessments.`);
  } else {
    console.log('Operation cancelled.');
  }
}

async function deleteAllChatMessages() {
  const confirm = await askQuestion('Are you sure you want to delete ALL chat messages? (yes/no): ');
  if (confirm.toLowerCase() === 'yes') {
    const result = await prisma.chatMessage.deleteMany();
    console.log(`Deleted ${result.count} chat messages.`);
  } else {
    console.log('Operation cancelled.');
  }
}

async function deleteAllMoodEntries() {
  const confirm = await askQuestion('Are you sure you want to delete ALL mood entries? (yes/no): ');
  if (confirm.toLowerCase() === 'yes') {
    const result = await prisma.moodEntry.deleteMany();
    console.log(`Deleted ${result.count} mood entries.`);
  } else {
    console.log('Operation cancelled.');
  }
}

async function showDataCounts() {
  console.log('\n=== CURRENT DATA COUNTS ===');

  const userCount = await prisma.user.count();
  console.log(`Users: ${userCount}`);

  const assessmentCount = await prisma.assessment.count();
  console.log(`Assessments: ${assessmentCount}`);

  const chatMessageCount = await prisma.chatMessage.count();
  console.log(`Chat Messages: ${chatMessageCount}`);

  const moodEntryCount = await prisma.moodEntry.count();
  console.log(`Mood Entries: ${moodEntryCount}`);

  const aiContextCount = await prisma.aIContext.count();
  console.log(`AI Contexts: ${aiContextCount}`);
}

async function main() {
  try {
    console.log('Connected to database successfully!');
    await showDataCounts();
    await showMenu();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();