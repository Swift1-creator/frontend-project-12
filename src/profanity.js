import leoProfanity from 'leo-profanity';

leoProfanity.loadDictionary('en');
leoProfanity.loadDictionary('ru');

leoProfanity.add([
  'boob',
  'boobs',
]);

export const cleanText = (value) => (
  leoProfanity.clean(String(value ?? ''))
);