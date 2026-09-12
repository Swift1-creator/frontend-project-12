import leoProfanity from 'leo-profanity';

leoProfanity.loadDictionary('en');
leoProfanity.loadDictionary('ru');

export const cleanText = (value) => (
  leoProfanity.clean(String(value ?? ''))
);