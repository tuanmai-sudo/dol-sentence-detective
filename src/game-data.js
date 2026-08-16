export const missions = [
  {
    idea: ['study at a foreign university', 'many benefits'],
    words: ['STUDY ABROAD', 'LEAD TO', 'MANY BENEFITS'],
    pattern: 'lead to + N',
    category: 'Overview',
    prompt: 'Let’s begin!',
    sample: 'Studying at a foreign university leads to many benefits.',
  },
  {
    idea: ['it', 'students learn from the best teachers and programs'],
    words: ['IT', 'STUDENTS', 'LEARN', 'BEST TEACHERS & PROGRAMS'],
    pattern: 'allow + O + to V',
    category: 'Benefit',
    prompt: 'Great job! Here’s another one.',
    sample: 'It allows students to learn from the best teachers and programs.',
  },
  {
    idea: ['this', 'expand their knowledge'],
    words: ['THIS', 'HELP', 'THEM', 'EXPAND THEIR KNOWLEDGE'],
    pattern: 'help + O + V',
    category: 'Benefit',
    prompt: 'Very well done! Here’s something a bit harder!',
    sample: 'This helps them expand their knowledge.',
  },
  {
    idea: ['study abroad', 'meet people from different countries'],
    words: ['STUDY ABROAD', 'ENABLE', 'STUDENTS', 'MEET PEOPLE'],
    pattern: 'enable + O + to V',
    category: 'Benefit',
    prompt: 'You aced it! How about this one?',
    sample: 'Studying abroad enables students to meet people from different countries.',
  },
  {
    idea: ['this', 'become more open-minded'],
    words: ['THIS', 'HELP', 'THEM', 'BECOME MORE OPEN-MINDED'],
    pattern: 'help + O + V',
    category: 'Benefit',
    prompt: 'Another idea for you!',
    sample: 'This helps them to become open-minded.',
  },
  {
    idea: ['study at a foreign university', 'several disadvantages'],
    words: ['STUDY ABROAD', 'RESULT IN', 'DISADVANTAGES'],
    pattern: 'result in + N',
    category: 'Contrast',
    prompt: 'This one’s easy. See if you can do it in 1 minute!',
    timed: true,
    sample: 'Studying at a foreign university results in several disadvantages.',
  },
  {
    idea: ['having bad English', 'not communicate well'],
    words: ['BAD ENGLISH', 'PREVENT', 'STUDENTS', 'COMMUNICATING WELL'],
    pattern: 'prevent + O + from V-ing',
    category: 'Challenge',
    prompt: 'This one’s hard! Challenge your best friend! Who can do it faster?',
    timed: true,
    sample: 'Having bad English prevents students from communicating well.',
  },
  {
    idea: ['this', 'feel lonely and homesick'],
    words: ['THIS', 'MAKE', 'THEM', 'FEEL LONELY & HOMESICK'],
    pattern: 'make + O + V',
    category: 'Disadvantage',
    prompt: 'You’re really good! Try this!',
    sample: 'This makes them feel lonely and homesick.',
  },
  {
    idea: ['studying abroad — students', 'feel stressed'],
    words: ['STUDY ABROAD', 'CAUSE', 'STUDENTS', 'FEEL STRESSED'],
    pattern: 'cause + O + to V',
    category: 'Disadvantage',
    prompt: 'Finally! We’re nearly done. Only one more!',
    sample: 'Studying abroad causes students to feel stressed.',
  },
  {
    idea: ['this', 'the need to pay high tuition fees and rents'],
    words: ['THIS', 'STEM FROM', 'HIGH TUITION FEES', 'RENTS'],
    pattern: 'stem from + N',
    category: 'Disadvantage',
    prompt: 'I lied! But really, here’s the last one!',
    direction: 'backward',
    sample: 'This stems from the need to pay high tuition fees and rents.',
  },
]

export const linkSlots = [
  { before: 1, answer: 'First,', kind: 'benefit' },
  { before: 3, answer: 'Second,', kind: 'benefit' },
  { before: 5, answer: 'However,', kind: 'contrast' },
  { before: 6, answer: 'First,', kind: 'disadvantage' },
  { before: 8, answer: 'Besides,', kind: 'disadvantage' },
]

export function isValidLinkLabel(before, label) {
  if (before === 3 || before === 8) return label === 'Second,' || label === 'Besides,'
  return linkSlots.find((slot) => slot.before === before)?.answer === label
}
