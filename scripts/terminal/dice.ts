#!/usr/bin/env node

import { question } from 'readline-sync';

const DICE_TYPES = [
  { sides: 4, name: 'D4', icon: '🔺' },
  { sides: 6, name: 'D6', icon: '🎲' },
  { sides: 8, name: 'D8', icon: '💠' },
  { sides: 10, name: 'D10', icon: '🔷' },
  { sides: 12, name: 'D12', icon: '⬡' },
  { sides: 20, name: 'D20', icon: '⚀' },
  { sides: 100, name: 'D100', icon: '💯' },
];

const SPECIAL_COMBOS: Record<string, { message: string; icon: string }> = {
  '20': { message: 'NATURAL 20! CRITICAL SUCCESS!', icon: '🎉' },
  '1': { message: 'Critical Fail! Oops...', icon: '💀' },
  '100': { message: 'PERFECT 100! LEGENDARY!', icon: '👑' },
  '69': { message: 'Nice.', icon: '😏' },
  '420': { message: 'Blaze it.', icon: '💨' },
};

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function displayDice(dice: number[], sides: number): string {
  if (sides === 6) {
    const faces: Record<number, string> = {
      1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
    };
    return dice.map(d => faces[d] || d.toString()).join(' ');
  }
  return dice.join(' ');
}

async function main() {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║        🎲 JLMT DICE ROLLER v1.0 🎲              ║
  ║                                                  ║
  ║         "May the odds be ever in your favor"    ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
  
  console.log('  Select dice type:\n');
  DICE_TYPES.forEach((d, i) => {
    console.log(`    [${i + 1}] ${d.icon} ${d.name}`);
  });
  console.log('    [0] Exit\n');
  
  const choice = question('  ➤ Choose dice type: ');
  const idx = parseInt(choice) - 1;
  
  if (idx === -1) {
    console.log('\n  🎲 Thanks for rolling!');
    return;
  }
  
  if (idx < 0 || idx >= DICE_TYPES.length) {
    console.log('\n  ⚠ Invalid choice');
    return;
  }
  
  const diceType = DICE_TYPES[idx];
  
  console.log(`\n  ${diceType.icon} Selected: ${diceType.name}\n`);
  
  const numDiceQuestion = question('  ➤ How many dice? (1-10, default 1): ');
  let numDice = parseInt(numDiceQuestion) || 1;
  if (numDice < 1) numDice = 1;
  if (numDice > 10) numDice = 10;
  
  console.log(`\n  🎲 Rolling ${numDice}x ${diceType.name}...\n`);
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const rolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    process.stdout.write(`    Rolling... ${'.'.repeat(i % 3 + 1)}`);
    await new Promise(r => setTimeout(r, 300));
    const roll = rollDie(diceType.sides);
    rolls.push(roll);
    process.stdout.write(`\r    Roll ${i + 1}: ${roll}\n`);
  }
  
  const total = rolls.reduce((a, b) => a + b, 0);
  
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                  RESULTS                          ║
  ╠══════════════════════════════════════════════════╣
  `);
  
  console.log(`  ║  ${diceType.icon} Rolls: ${displayDice(rolls, diceType.sides).padEnd(30)}║`);
  console.log(`  ║  📊 Total: ${total.toString().padEnd(36)}║`);
  
  const special = SPECIAL_COMBOS[total.toString()];
  if (special) {
    console.log(`  ║                                                  ║`);
    console.log(`  ║  ${special.icon} ${special.message.padEnd(40)}║`);
  }
  
  console.log(`  ║                                                  ║`);
  console.log(`  ╚══════════════════════════════════════════════════╝`);
  
  const rollAgain = question('\n  ➤ Roll again? (y/n): ');
  if (rollAgain.toLowerCase() === 'y') {
    console.clear();
    main();
  }
}

main().catch(console.error);
