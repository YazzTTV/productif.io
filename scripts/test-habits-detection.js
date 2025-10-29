const lowerCmd = "Quels sont mes habitudes qu'il me reste à faire ?".toLowerCase();

const habitPatterns = [
    /quels? (sont|mes|tes|nos|vos)? habitudes? (qu'il|qu'ils|qu'elle|qu'elles)? (me|m'|te|t'|nous|vous|il|ils|elle|elles) (reste|restent)/i,
    /quels? habitudes? (me|m'|te|t'|nous|vous) (reste|restent)/i,
    /habitudes? manquantes?/i,
    /quels? habitudes? (à|a|en) (fai?re?|realiser?)/i,
    /restantes? à (fai?re?|realiser?)/i
];

const isAboutHabits1 = habitPatterns.some(pattern => pattern.test(lowerCmd));
const isAboutHabits2 = (lowerCmd.includes('habitudes') && (lowerCmd.includes('reste') || lowerCmd.includes('restent') || lowerCmd.includes('restants') || lowerCmd.includes('manquantes')));

console.log('Message:', lowerCmd);
console.log('Pattern 1 (regex):', isAboutHabits1);
console.log('Pattern 2 (keywords):', isAboutHabits2);
console.log('Total:', isAboutHabits1 || isAboutHabits2);

console.log('\nTest avec différents patterns:');
habitPatterns.forEach((pattern, idx) => {
    const match = pattern.test(lowerCmd);
    console.log(`Pattern ${idx + 1}:`, match, '→', pattern.toString());
});

