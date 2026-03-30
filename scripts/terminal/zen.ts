#!/usr/bin/env node

const ZEN_MESSAGES = [
  'The code compiles...',
  'The bug is not a bug... the bug is a feature...',
  ' Silence... ',
  'You are one with the codebase...',
  'The codebase is one with you...',
  'Breathe...',
  'Error 404: Stress not found...',
  'undefined === undefined...',
  'null === null...',
  'You are valid...',
  'The git commit is clean...',
  'The tests pass...',
  'The build succeeds...',
  'There is only paste...',
  '🤫',
  'The bamboo sways...',
  'Water flows...',
  'Code runs...',
  'All is well...',
  '...',
  'Beep boop...',
  'I am become code, destroyer of bugs...',
];

const BAMBOO_ART = `
                                    ) (
                                   (   )  )
                                    ) ( (
                                  _______)_
                               .-'---------|
                              ( C|/\/\/\/\/|
                               '-./\/\/\/\/|
                                 '_________'
                                  '-------'
`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.clear();
  
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║         🧘 JLMT ZEN MODE ACTIVATED 🧘           ║
  ║                                                  ║
  ║        "Code is poetry, bugs are haiku"         ║
  ║                                                  ║
  ║        Press any key to exit zen mode           ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
  
  await sleep(1500);
  
  let zenIndex = 0;
  let showBamboo = false;
  let running = true;
  
  process.stdin.setRawMode && process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    running = false;
    console.clear();
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║           🧘 ZEN SESSION COMPLETE 🧘            ║
  ║                                                  ║
  ║     "The journey of a thousand lines            ║
  ║      begins with a single console.log"         ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `);
    process.exit(0);
  });
  
  while (running) {
    console.clear();
    
    if (showBamboo) {
      console.log('\x1b[32m' + BAMBOO_ART + '\x1b[0m');
    }
    
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║`);
    
    const msg = ZEN_MESSAGES[zenIndex % ZEN_MESSAGES.length];
    const padding = Math.max(0, Math.floor((40 - msg.length) / 2));
    console.log(`  ║${' '.repeat(padding + 12)}${msg}${' '.repeat(40 - padding - msg.length - 12)}║`);
    
    console.log(`  ║                                                  ║`);
    console.log(`  ╚══════════════════════════════════════════════════╝`);
    
    if (showBamboo) {
      console.log('\x1b[32m' + BAMBOO_ART + '\x1b[0m');
    }
    
    await sleep(3000);
    zenIndex++;
    if (zenIndex % 5 === 0) showBamboo = !showBamboo;
  }
}

main().catch(() => {
  console.clear();
  console.log('Zen mode exited.');
});
