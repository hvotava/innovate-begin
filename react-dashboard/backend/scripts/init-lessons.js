const { sequelize, User, Lesson, Attempt, TestSession, Answer } = require('../models');

// Nová logika: 0. test → 1. lekce → 1. test → 2. lekce → 2. test atd.
const lessonsData = [
  // 0. VSTUPNÍ TEST
  {
    level: 0,
    title: "Vstupní test",
    lesson_type: "test",
    description: "Úvodní test pro zjištění vaší současné úrovně angličtiny",
    script: "Tento test nám pomůže určit vaši výchozí úroveň.",
    questions: [
      {
        question_text: "What is your name?",
        expected_answer: "My name is",
        difficulty: 1,
        question_type: "speaking"
      },
      {
        question_text: "How old are you?",
        expected_answer: "I am",
        difficulty: 1,
        question_type: "speaking"
      },
      {
        question_text: "Where are you from?",
        expected_answer: "I am from",
        difficulty: 1,
        question_type: "speaking"
      }
    ]
  },

  // 1. LEKCE - Základní představení
  {
    level: 1,
    title: "Základní představení",
    lesson_type: "lesson",
    description: "Naučíte se základní fráze pro představení",
    script: `# Lekce 1: Základní představení

## Klíčové fráze:
- Hello, my name is... (Ahoj, jmenuji se...)
- I am from... (Jsem z...)
- Nice to meet you (Těší mě)
- How are you? (Jak se máte?)
- I'm fine, thank you (Mám se dobře, děkuji)

## Příklady:
- Hello, my name is John. I am from Prague.
- Nice to meet you too!`,
    questions: []
  },

  // 1. TEST - Test po 1. lekci
  {
    level: 1,
    title: "Test - Základní představení",
    lesson_type: "test",
    description: "Test znalostí z lekce o základním představení",
    script: "Otestujte si znalosti z první lekce.",
    questions: [
      {
        question_text: "Introduce yourself. Say your name and where you are from.",
        expected_answer: "Hello, my name is",
        difficulty: 1,
        question_type: "speaking"
      },
      {
        question_text: "How do you respond when someone says 'Nice to meet you'?",
        expected_answer: "Nice to meet you too",
        difficulty: 1,
        question_type: "speaking"
      }
    ]
  },

  // 2. LEKCE - Čísla a věk
  {
    level: 2,
    title: "Čísla a věk",
    lesson_type: "lesson",
    description: "Naučíte se čísla a jak říct svůj věk",
    script: `# Lekce 2: Čísla a věk

## Čísla 1-20:
- One, two, three, four, five
- Six, seven, eight, nine, ten
- Eleven, twelve, thirteen, fourteen, fifteen
- Sixteen, seventeen, eighteen, nineteen, twenty

## Věk:
- How old are you? (Kolik je vám let?)
- I am ... years old (Je mi ... let)

## Příklady:
- How old are you? - I am thirty years old.
- My daughter is fifteen years old.`,
    questions: []
  },

  // 2. TEST - Test po 2. lekci
  {
    level: 2,
    title: "Test - Čísla a věk",
    lesson_type: "test",
    description: "Test znalostí čísel a věku",
    script: "Otestujte si znalosti z druhé lekce.",
    questions: [
      {
        question_text: "How old are you? Answer with your age.",
        expected_answer: "I am",
        difficulty: 2,
        question_type: "speaking"
      },
      {
        question_text: "Count from one to ten.",
        expected_answer: "one two three four five six seven eight nine ten",
        difficulty: 2,
        question_type: "speaking"
      }
    ]
  },

  // 3. LEKCE - Rodina
  {
    level: 3,
    title: "Rodina",
    lesson_type: "lesson",
    description: "Slovní zásoba a fráze o rodině",
    script: `# Lekce 3: Rodina

## Členové rodiny:
- Father/Dad (otec/táta)
- Mother/Mom (matka/máma)
- Brother (bratr)
- Sister (sestra)
- Son (syn)
- Daughter (dcera)

## Užitečné fráze:
- I have a brother (Mám bratra)
- This is my family (To je moje rodina)
- My father is a teacher (Můj otec je učitel)

## Příklady:
- I have two sisters and one brother.
- My mother is very kind.`,
    questions: []
  },

  // 3. TEST - Test po 3. lekci
  {
    level: 3,
    title: "Test - Rodina",
    lesson_type: "test",
    description: "Test znalostí o rodině",
    script: "Otestujte si znalosti z třetí lekce.",
    questions: [
      {
        question_text: "Tell me about your family. Do you have brothers or sisters?",
        expected_answer: "I have",
        difficulty: 3,
        question_type: "speaking"
      },
      {
        question_text: "How do you say 'matka' in English?",
        expected_answer: "mother",
        difficulty: 3,
        question_type: "speaking"
      }
    ]
  }
];

async function initDatabase() {
  try {
    console.log('🔄 Inicializace databáze...');
    
    // Synchronizace databáze
    await sequelize.sync({ force: true });
    console.log('✅ Databáze synchronizována');

    // Vytvoření testovacích uživatelů
    const users = await User.bulkCreate([
      {
        name: "Test Uživatel",
        phone: "+420 123 456 789",
        language: "cs",
        current_lesson_level: 0
      },
      {
        name: "Marie Testová",
        phone: "+420 987 654 321",
        language: "cs",
        current_lesson_level: 1
      }
    ]);
    console.log('✅ Testovací uživatelé vytvořeni');

    // Vytvoření lekcí a testů
    for (const lessonData of lessonsData) {
      const lesson = await Lesson.create(lessonData);
      console.log(`✅ Vytvořena: Level ${lesson.level} - ${lesson.title} (${lesson.lesson_type})`);
      
      if (lessonData.questions && lessonData.questions.length > 0) {
        console.log(`   📝 ${lessonData.questions.length} otázek uloženo`);
      }
    }

    console.log('\n🎉 Databáze úspěšně inicializována!');
    console.log('\n📚 Nová struktura lekcí:');
    console.log('0️⃣  Level 0: Vstupní test (test) - 3 otázky');
    console.log('1️⃣  Level 1: Základní představení (lekce)');
    console.log('1️⃣  Level 1: Test - Základní představení (test) - 2 otázky');
    console.log('2️⃣  Level 2: Čísla a věk (lekce)');
    console.log('2️⃣  Level 2: Test - Čísla a věk (test) - 2 otázky');
    console.log('3️⃣  Level 3: Rodina (lekce)');
    console.log('3️⃣  Level 3: Test - Rodina (test) - 2 otázky');
    console.log('\n🔄 Logika: Test → Lekce → Test → Lekce → Test...');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Chyba při inicializaci:', error);
    process.exit(1);
  }
}

// Spuštění pouze pokud je soubor spuštěn přímo
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, lessonsData };
