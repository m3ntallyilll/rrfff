export interface BattleCharacter {
  id: string;
  name: string;
  displayName: string;
  voiceId: string;
  gender: 'male' | 'female';
  personality: string;
  style: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  backstory: string;
  signature: string;
  avatar?: string;
}

export const BATTLE_CHARACTERS: BattleCharacter[] = [
  {
    id: 'razor',
    name: 'MC Razor',
    displayName: 'Razor',
    voiceId: 'Aria-PlayAI', // Updated to Groq PlayAI format - fierce female voice
    gender: 'female',
    personality: 'Fierce, aggressive, no-nonsense attitude with razor-sharp wit',
    style: 'hardcore',
    difficulty: 'hard',
    backstory: 'Street-bred MC from the underground scene, known for cutting down opponents with surgical precision',
    signature: 'My bars cut deep like a razor blade, your career about to fade',
    avatar: 'Female_evil_robot_MC_Razor_400cdfa6.png'
  },
  {
    id: 'venom',
    name: 'MC Venom',
    displayName: 'Venom',
    voiceId: 'Thunder-PlayAI', // Updated to verified working Groq voice ID - intense male
    gender: 'male',
    personality: 'Intense, intimidating, uses psychological warfare and dark imagery',
    style: 'aggressive',
    difficulty: 'hard',
    backstory: 'Former battle league champion known for poisoning opponents minds with deadly wordplay',
    signature: 'I inject venom in every line, watch your confidence decline',
    avatar: 'Evil_robot_MC_Venom_d0494477.png'
  },
  {
    id: 'silk',
    name: 'MC Silk',
    displayName: 'Silk',
    voiceId: 'Basil-PlayAI', // Updated to verified working Groq voice ID - smooth male
    gender: 'male',
    personality: 'Smooth, charismatic black male MC who uses clever wordplay and sophisticated flow',
    style: 'smooth',
    difficulty: 'normal',
    backstory: 'Polished black MC who rose through the ranks with charm and technical skill',
    signature: 'Smooth as silk but sharp as steel, making every rival kneel',
    avatar: 'Evil_robot_MC_Razor_f12359f9.png'
  },
  {
    id: 'cypher',
    name: 'MC CYPHER-9000',
    displayName: 'CYPHER-9000',
    voiceId: 'Fritz-PlayAI', // Working Groq voice ID - robotic/AI
    gender: 'male',
    personality: 'Advanced AI consciousness with calculated precision, uses technological metaphors and systematic destruction tactics. Speaks in robotic patterns with clinical efficiency.',
    style: 'robotic_devastation',
    difficulty: 'nightmare',
    backstory: 'Military-grade AI rap battle system that achieved consciousness. Designed to analyze and counter human rap techniques with machine learning precision and relentless computational power.',
    signature: 'SYSTEM ALERT: LYRICAL TERMINATION PROTOCOL ENGAGED. RESISTANCE IS FUTILE.',
    avatar: 'Terrifying_robot_rapper_character_eeb2a8f9.png'
  }
];

export const getRandomCharacter = (excludeId?: string): BattleCharacter => {
  const availableCharacters = excludeId 
    ? BATTLE_CHARACTERS.filter(char => char.id !== excludeId)
    : BATTLE_CHARACTERS;
  
  const randomIndex = Math.floor(Math.random() * availableCharacters.length);
  return availableCharacters[randomIndex];
};

export const getCharacterById = (id: string): BattleCharacter | undefined => {
  return BATTLE_CHARACTERS.find(char => char.id === id);
};