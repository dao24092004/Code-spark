
const { v4: uuidv4 } = require('uuid');
const db = require('../src/models');

// --- MOCK DATA ---
const ORG_ID = uuidv4();
const INSTRUCTOR_ID = uuidv4();
const STUDENT_ID_1 = 1001;
const STUDENT_ID_2 = 1002;

async function createSampleData() {
  console.log('--- Starting Data Seeding ---');

  try {
    // 1. Create a Quiz (Exam)
    const quiz = await db.Quiz.create({
      id: uuidv4(),
      orgId: ORG_ID,
      title: 'Sample Quiz: General Knowledge',
      description: 'A short quiz to test your general knowledge.',
      startAt: new Date(),
      endAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      durationMinutes: 15,
      passScore: 70,
      maxAttempts: 2,
      createdBy: INSTRUCTOR_ID,
      status: 'ACTIVE',
    });
    console.log(`✅ Created Quiz: ${quiz.title}`);

    // 2. Create Questions
    const question1 = await db.Question.create({
      id: uuidv4(),
      type: 'multiple-choice',
      content: { text: 'What is the capital of France?' },
      text: 'What is the capital of France?',
      difficulty: 2,
      score: 10,
    });

    const question2 = await db.Question.create({
      id: uuidv4(),
      type: 'multiple-choice',
      content: { text: 'Which planet is known as the Red Planet?' },
      text: 'Which planet is known as the Red Planet?',
      difficulty: 3,
      score: 10,
    });
    console.log('✅ Created 2 Questions.');

    // 3. Create Options for Questions
    // Options for Question 1
    await db.QuestionOption.bulkCreate([
      { id: uuidv4(), questionId: question1.id, content: 'Berlin', isCorrect: false },
      { id: uuidv4(), questionId: question1.id, content: 'Madrid', isCorrect: false },
      { id: uuidv4(), questionId: question1.id, content: 'Paris', isCorrect: true },
      { id: uuidv4(), questionId: question1.id, content: 'Rome', isCorrect: false },
    ]);

    // Options for Question 2
    await db.QuestionOption.bulkCreate([
      { id: uuidv4(), questionId: question2.id, content: 'Earth', isCorrect: false },
      { id: uuidv4(), questionId: question2.id, content: 'Mars', isCorrect: true },
      { id: uuidv4(), questionId: question2.id, content: 'Jupiter', isCorrect: false },
      { id: uuidv4(), questionId: question2.id, content: 'Venus', isCorrect: false },
    ]);
    console.log('✅ Created Options for Questions.');

    // 4. Link Questions to the Quiz
    await db.ExamQuestion.bulkCreate([
      { id: uuidv4(), examId: quiz.id, questionId: question1.id, displayOrder: 1 },
      { id: uuidv4(), examId: quiz.id, questionId: question2.id, displayOrder: 2 },
    ]);
    console.log(`✅ Linked Questions to Quiz.`);

    // 5. Create a Sample Submission
    const submission = await db.QuizSubmission.create({
        id: uuidv4(),
        quizId: quiz.id,
        studentId: STUDENT_ID_1,
        score: 85, // Example score
        submittedAt: new Date(),
        startedAt: new Date(new Date().getTime() - 10 * 60 * 1000), // 10 minutes ago
        timeSpentSeconds: 600,
        correctAnswers: 1,
        wrongAnswers: 1,
        totalQuestions: 2,
        answers: JSON.stringify([
            { questionId: question1.id, selectedAnswer: 'Paris' },
            { questionId: question2.id, selectedAnswer: 'Mars' }
        ])
    });
    console.log(`✅ Created a Quiz Submission for student ${STUDENT_ID_1}.`);
    
    // 6. Create Answers for the Submission
    const optionsQ1 = await db.QuestionOption.findAll({ where: { questionId: question1.id } });
    const correctOptionQ1 = optionsQ1.find(o => o.isCorrect);

    const optionsQ2 = await db.QuestionOption.findAll({ where: { questionId: question2.id } });
    const correctOptionQ2 = optionsQ2.find(o => o.isCorrect);


    await db.Answer.bulkCreate([
        {
            id: uuidv4(),
            submissionId: submission.id,
            questionId: question1.id,
            selectedAnswer: correctOptionQ1.id, // Student chose the correct answer
            score: 10,
        },
        {
            id: uuidv4(),
            submissionId: submission.id,
            questionId: question2.id,
            selectedAnswer: optionsQ2.find(o => !o.isCorrect).id, // Student chose a wrong answer
            score: 0,
        }
    ]);
    console.log(`✅ Created detailed Answers for the submission.`);


    console.log('--- Data Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('--- Error during data seeding: ---');
    console.error(error);
    process.exit(1);
  }
}

async function clearData() {
  console.log('--- Clearing existing data ---');
  try {
    // Delete in reverse order of creation to respect foreign key constraints
    await db.Answer.destroy({ where: {}, truncate: true, cascade: true });
    await db.QuizSubmission.destroy({ where: {}, truncate: true, cascade: true });
    await db.ExamQuestion.destroy({ where: {}, truncate: true, cascade: true });
    await db.QuestionOption.destroy({ where: {}, truncate: true, cascade: true });
    await db.Question.destroy({ where: {}, truncate: true, cascade: true });
    await db.Quiz.destroy({ where: {}, truncate: true, cascade: true });
    console.log('✅ All data cleared.');
  } catch (error) {
    console.error('--- Error clearing data: ---');
    console.error(error);
    process.exit(1);
  }
}


db.sequelize.sync({ force: false }).then(async () => {
  console.log('Database synchronized.');
  // Clear existing data first
  await clearData();
  // Create new sample data
  await createSampleData();
  // Close the database connection
  await db.sequelize.close();
});
