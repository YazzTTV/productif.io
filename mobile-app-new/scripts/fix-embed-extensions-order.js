#!/usr/bin/env node
/**
 * Remonte la phase "Embed Foundation Extensions" juste après "Resources" dans
 * le target applicatif.
 *
 * Pourquoi ce script et pas un config plugin Expo :
 *
 * 1. L'ordre final des phases n'est pas décidé par `expo prebuild` mais par
 *    `pod install`, qui insère ensuite ses propres phases sans sorties
 *    déclarées. Un plugin qui réordonne pendant le prebuild voit son travail
 *    défait.
 * 2. Un hook `post_install` dans le Podfile s'exécute bien au bon moment, mais
 *    il doit appeler `project.save`, et la librairie xcodeproj refuse de
 *    sérialiser ce projet : le plugin expo-live-activity ajoute le même
 *    PBXBuildFile (`ViewHelpers.swift`) dans deux phases Sources, ce que
 *    xcodeproj considère comme une incohérence. Xcode, lui, la tolère.
 *
 * D'où une réécriture textuelle du pbxproj, qui ne valide rien.
 *
 * Sans ce correctif, Xcode échoue sur "Cycle inside Productifio; building could
 * produce unreliable results" : les phases de script ne déclarent aucune sortie,
 * Xcode considère donc qu'elles écrivent dans tout le bundle, et l'intégration
 * des extensions y écrit aussi.
 *
 * Remonter l'intégration est sûr : les extensions sont des dépendances du
 * target applicatif, leurs `.appex` sont déjà construits quand ses phases
 * démarrent.
 *
 * À relancer après chaque `pod install`. Idempotent.
 *
 *   node scripts/fix-embed-extensions-order.js
 */

const fs = require('fs');
const path = require('path');

const PBXPROJ = path.join(
  __dirname,
  '..',
  'ios',
  'Productifio.xcodeproj',
  'project.pbxproj'
);

const EMBED = 'Embed Foundation Extensions';
const ANCHOR = 'Resources';

function main() {
  if (!fs.existsSync(PBXPROJ)) {
    console.error(`Fichier projet introuvable: ${PBXPROJ}`);
    process.exit(1);
  }

  const source = fs.readFileSync(PBXPROJ, 'utf8');

  // Le target applicatif, repéré par son productType.
  const targetMatch = source.match(
    /([0-9A-F]{24}) \/\* \w+ \*\/ = \{\s*isa = PBXNativeTarget;[\s\S]*?productType = "com\.apple\.product-type\.application";[\s\S]*?\n\t\t\};/
  );
  if (!targetMatch) {
    console.error('Target applicatif introuvable');
    process.exit(1);
  }

  const targetBlock = targetMatch[0];
  const phasesMatch = targetBlock.match(/buildPhases = \(([\s\S]*?)\);/);
  if (!phasesMatch) {
    console.error('Section buildPhases introuvable');
    process.exit(1);
  }

  const lines = phasesMatch[1]
    .split('\n')
    .filter(line => line.trim().length > 0);

  const isEmbed = line => line.includes(`/* ${EMBED} */`);
  const isAnchor = line => line.includes(`/* ${ANCHOR} */`);

  const embedLines = lines.filter(isEmbed);
  if (embedLines.length === 0) {
    console.log('Aucune phase d\'integration, rien a faire');
    return;
  }

  const anchorIndex = lines.findIndex(isAnchor);
  if (anchorIndex === -1) {
    console.error(`Phase "${ANCHOR}" introuvable`);
    process.exit(1);
  }

  const lastEmbedIndex = lines.reduce(
    (acc, line, i) => (isEmbed(line) ? i : acc),
    -1
  );
  if (lastEmbedIndex < anchorIndex) {
    console.log('Deja dans le bon ordre, rien a faire');
    return;
  }

  const remaining = lines.filter(line => !isEmbed(line));
  const newAnchorIndex = remaining.findIndex(isAnchor);
  const reordered = [
    ...remaining.slice(0, newAnchorIndex + 1),
    ...embedLines,
    ...remaining.slice(newAnchorIndex + 1),
  ];

  const newPhases = `buildPhases = (\n${reordered.join('\n')}\n\t\t\t);`;
  const newTargetBlock = targetBlock.replace(
    /buildPhases = \([\s\S]*?\);/,
    newPhases
  );

  fs.writeFileSync(PBXPROJ, source.replace(targetBlock, newTargetBlock));
  console.log(
    `${embedLines.length} phase(s) "${EMBED}" remontee(s) apres "${ANCHOR}"`
  );
}

main();
