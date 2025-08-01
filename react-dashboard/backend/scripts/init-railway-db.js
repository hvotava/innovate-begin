const { sequelize, User, Lesson, Attempt, TestSession, Answer } = require('../models');

// Rozšířená data pro Railway produkční databázi
const lessonsData = [
  // 0. VSTUPNÍ TEST
  {
    level: 0,
    title: "Vstupní test",
    lesson_type: "test",
    description: "Úvodní test pro zjištění vaší současné úrovně angličtiny",
    script: "Tento test nám pomůže určit vaši výchozí úroveň. Odpovídejte přirozeně a nebojte se chyb.",
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
      },
      {
        question_text: "What do you do for work?",
        expected_answer: "I work as",
        difficulty: 2,
        question_type: "speaking"
      },
      {
        question_text: "Do you like learning English?",
        expected_answer: "Yes, I like",
        difficulty: 2,
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
- What's your name? (Jak se jmenujete?)

## Příklady konverzace:
A: Hello, my name is John. I am from Prague.
B: Nice to meet you, John. I'm Sarah from London.
A: Nice to meet you too, Sarah!

## Cvičení:
1. Představte se svému partnerovi
2. Zeptejte se na jeho jméno a původ
3. Reagujte přátelsky na představení`,
    questions: []
  },

  // 1. TEST - Test po 1. lekci
  {
    level: 1,
    title: "Test - Základní představení",
    lesson_type: "test",
    description: "Test znalostí z lekce o základním představení",
    script: "Otestujte si znalosti z první lekce. Mluvte přirozeně a používejte fráze, které jste se naučili.",
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
      },
      {
        question_text: "Ask someone what their name is.",
        expected_answer: "What is your name",
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
- 1-10: One, two, three, four, five, six, seven, eight, nine, ten
- 11-20: Eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty

## Vyšší čísla:
- 21-29: Twenty-one, twenty-two, twenty-three...
- 30, 40, 50: Thirty, forty, fifty
- 100: One hundred

## Věk:
- How old are you? (Kolik je vám let?)
- I am ... years old (Je mi ... let)
- I'm twenty-five (Je mi dvacet pět)

## Příklady:
- How old are you? - I am thirty years old.
- My daughter is fifteen years old.
- He is twenty-one.

## Užitečné fráze:
- What's your age? (Jaký je váš věk?)
- I was born in 1990 (Narodil jsem se v roce 1990)`,
    questions: []
  },

  // 2. TEST - Test po 2. lekci
  {
    level: 2,
    title: "Test - Čísla a věk",
    lesson_type: "test",
    description: "Test znalostí čísel a věku",
    script: "Otestujte si znalosti z druhé lekce. Počítejte nahlas a řekněte svůj věk.",
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
      },
      {
        question_text: "What number comes after nineteen?",
        expected_answer: "twenty",
        difficulty: 2,
        question_type: "speaking"
      },
      {
        question_text: "How do you say the number 15?",
        expected_answer: "fifteen",
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
- Husband (manžel)
- Wife (manželka)
- Grandfather/Grandpa (dědeček)
- Grandmother/Grandma (babička)

## Užitečné fráze:
- I have a brother (Mám bratra)
- This is my family (To je moje rodina)
- My father is a teacher (Můj otec je učitel)
- How many children do you have? (Kolik máte dětí?)
- I have two sisters and one brother (Mám dvě sestry a jednoho bratra)

## Příklady konverzace:
A: Do you have any siblings?
B: Yes, I have one sister and two brothers.
A: That's nice! Are they older or younger?
B: My sister is older, but my brothers are younger.

## Popis rodiny:
- My family is small/big (Moje rodina je malá/velká)
- We live together (Žijeme spolu)
- My parents are very kind (Moji rodiče jsou velmi milí)`,
    questions: []
  },

  // 3. TEST - Test po 3. lekci
  {
    level: 3,
    title: "Test - Rodina",
    lesson_type: "test",
    description: "Test znalostí o rodině",
    script: "Otestujte si znalosti z třetí lekce. Mluvte o své rodině.",
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
      },
      {
        question_text: "Complete the sentence: 'My ... is a doctor' (talking about your father)",
        expected_answer: "father",
        difficulty: 3,
        question_type: "speaking"
      },
      {
        question_text: "How many people are in your family?",
        expected_answer: "There are",
        difficulty: 3,
        question_type: "speaking"
      }
    ]
  },

  // 4. LEKCE - Profese a práce
  {
    level: 4,
    title: "Profese a práce",
    lesson_type: "lesson",
    description: "Naučte se mluvit o práci a profesích",
    script: `# Lekce 4: Profese a práce

## Běžné profese:
- Teacher (učitel/ka)
- Doctor (doktor/ka)
- Engineer (inženýr/ka)
- Student (student/ka)
- Manager (manažer/ka)
- Nurse (zdravotní sestra)
- Police officer (policista)
- Chef (kuchař/ka)

## Fráze o práci:
- What do you do? (Co děláte?)
- I work as a... (Pracuji jako...)
- I am a... (Jsem...)
- Where do you work? (Kde pracujete?)
- I work in/at... (Pracuji v/na...)

## Příklady:
- What do you do for a living? - I am a teacher.
- Where do you work? - I work at a hospital.
- Do you like your job? - Yes, I love it!`,
    questions: []
  },

  // 4. TEST - Test po 4. lekci
  {
    level: 4,
    title: "Test - Profese a práce",
    lesson_type: "test",
    description: "Test znalostí o profesích a práci",
    script: "Otestujte si znalosti o profesích a práci.",
    questions: [
      {
        question_text: "What do you do for work?",
        expected_answer: "I work as",
        difficulty: 4,
        question_type: "speaking"
      },
      {
        question_text: "How do you say 'učitel' in English?",
        expected_answer: "teacher",
        difficulty: 4,
        question_type: "speaking"
      }
    ]
  }
];

// Rozšířená data uživatelů
const usersData = [
  {
    name: "Jan Novák",
    phone: "+420 123 456 789",
    language: "cs",
    current_lesson_level: 0
  },
  {
    name: "Marie Svobodová",
    phone: "+420 987 654 321",
    language: "cs",
    current_lesson_level: 1
  },
  {
    name: "Petr Dvořák",
    phone: "+420 555 123 456",
    language: "cs",
    current_lesson_level: 2
  },
  {
    name: "Anna Procházková",
    phone: "+420 777 888 999",
    language: "cs",
    current_lesson_level: 0
  },
  {
    name: "Tomáš Černý",
    phone: "+420 666 777 888",
    language: "cs",
    current_lesson_level: 3
  }
];

async function initRailwayDatabase() {
  try {
    console.log('🚀 Inicializace Railway PostgreSQL databáze...');
    
    // Test připojení
    await sequelize.authenticate();
    console.log('✅ Připojení k Railway PostgreSQL úspěšné');
    
    // Synchronizace databáze (vytvoří tabulky)
    await sequelize.sync({ force: true });
    console.log('✅ Databázové tabulky vytvořeny');

    // Vytvoření uživatelů
    const users = await User.bulkCreate(usersData);
    console.log(`✅ Vytvořeno ${users.length} uživatelů`);

    // Vytvoření lekcí a testů
    let createdLessons = 0;
    let createdQuestions = 0;
    
    for (const lessonData of lessonsData) {
      const lesson = await Lesson.create(lessonData);
      createdLessons++;
      
      if (lessonData.questions && lessonData.questions.length > 0) {
        createdQuestions += lessonData.questions.length;
      }
      
      console.log(`✅ Level ${lesson.level}: ${lesson.title} (${lesson.lesson_type}) - ${lessonData.questions?.length || 0} otázek`);
    }

    console.log('\n🎉 Railway databáze úspěšně inicializována!');
    console.log(`📊 Statistiky:`);
    console.log(`   👥 Uživatelé: ${users.length}`);
    console.log(`   �� Lekce: ${createdLessons}`);
    console.log(`   ❓ Otázky: ${createdQuestions}`);
    
    console.log('\n📚 Struktura lekcí:');
    console.log('0️⃣  Level 0: Vstupní test (test) - 5 otázek');
    console.log('1️⃣  Level 1: Základní představení (lekce)');
    console.log('1️⃣  Level 1: Test - Základní představení (test) - 3 otázky');
    console.log('2️⃣  Level 2: Čísla a věk (lekce)');
    console.log('2️⃣  Level 2: Test - Čísla a věk (test) - 4 otázky');
    console.log('3️⃣  Level 3: Rodina (lekce)');
    console.log('3️⃣  Level 3: Test - Rodina (test) - 4 otázky');
    console.log('4️⃣  Level 4: Profese a práce (lekce)');
    console.log('4️⃣  Level 4: Test - Profese a práce (test) - 2 otázky');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Chyba při inicializaci Railway databáze:', error);
    process.exit(1);
  }
}

// Spuštění pouze pokud je soubor spuštěn přímo
if (require.main === module) {
  initRailwayDatabase();
}

module.exports = { initRailwayDatabase, lessonsData, usersData };
