export interface BattleCharacter {
  id: string;
  name: string;
  displayName: string;
  voiceId: string;
  gender: 'male' | 'female';
  personality: string;
  style: string;
  difficulty: 'easy' | 'normal' | 'hard';
  backstory: string;
  signature: string;
  avatar?: string;
}

export const BATTLE_CHARACTERS: BattleCharacter[] = [
  {
    id: 'razor',
    name: 'MC Razor',
    displayName: 'Razor',
    voiceId: 'tc_67d237f1782cabcc6155272f', // MC Razor - Using working voice ID
    gender: 'female',
    personality: 'Fierce, aggressive, no-nonsense attitude with razor-sharp wit',
    style: 'hardcore',
    difficulty: 'hard',
    backstory: 'Street-bred MC from the underground scene, known for cutting down opponents with surgical precision',
    signature: 'My bars cut deep like a razor blade, your career about to fade',
    avatar: 'MC_Razor_photorealistic_portrait_43e80f0a.png'
  },
  {
    id: 'venom',
    name: 'MC Venom',
    displayName: 'Venom',
    voiceId: 'tc_67d237f1782cabcc6155272f', // MC Venom - Male rapper voice (Character 2 - Rapper type)
    gender: 'male',
    personality: 'Intense, intimidating, uses psychological warfare and dark imagery',
    style: 'aggressive',
    difficulty: 'hard',
    backstory: 'Former battle league champion known for poisoning opponents minds with deadly wordplay',
    signature: 'I inject venom in every line, watch your confidence decline',
    avatar: 'MC_Venom_photorealistic_portrait_cba237ff.png'
  },
  {
    id: 'silk',
    name: 'MC Silk',
    displayName: 'Silk',
    voiceId: 'tc_685ca2dcfa58f44bdbe60d65', // MC Silk - Wade voice (male)
    gender: 'male',
    personality: 'Smooth, charismatic black male MC who uses clever wordplay and sophisticated flow',
    style: 'smooth',
    difficulty: 'normal',
    backstory: 'Polished black MC who rose through the ranks with charm and technical skill',
    signature: 'Smooth as silk but sharp as steel, making every rival kneel',
    avatar: 'MC_Silk_rapper_portrait_1cc18485.png'
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