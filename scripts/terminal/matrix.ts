#!/usr/bin/env node

function randomChar() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
  return chars[Math.floor(Math.random() * chars.length)];
}

function randomGreen() {
  const shades = ['\x1b[32m', '\x1b[92m', '\x1b[32;1m', '\x1b[38;5;28m', '\x1b[38;5;34m', '\x1b[38;5;35m'];
  return shades[Math.floor(Math.random() * shades.length)];
}

async function main() {
  console.clear();
  
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║  💚 ENTERING THE MATRIX...                      ║
  ║                                                  ║
  ║  Wake up, Neo...                                 ║
  ║  The Matrix has you...                           ║
  ║  Follow the white rabbit.                       ║
  ║                                                  ║
  ║  Press any key to exit...                        ║
  ╚══════════════════════════════════════════════════╝
  `);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.clear();
  
  const width = process.stdout.columns || 80;
  const height = process.stdout.rows ? process.stdout.rows - 5 : 30;
  
  const columns: number[] = new Array(width).fill(0);
  
  let running = true;
  
  process.stdin.setRawMode && process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    running = false;
    console.clear();
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║     💚 LEAVING THE MATRIX                       ║
  ║                                                  ║
  ║     "There is no spoon."                        ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
    `);
    process.exit(0);
  });
  
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  
  while (running) {
    let output = '';
    
    for (let i = 0; i < width; i++) {
      if (columns[i] === 0 && Math.random() > 0.98) {
        columns[i] = Math.floor(Math.random() * height * 0.8);
      }
      
      if (columns[i] > 0) {
        const green = randomGreen();
        output += `${green}${randomChar()}\x1b[0m`;
        columns[i]--;
      } else {
        output += ' ';
      }
    }
    
    process.stdout.write('\r' + output);
    await sleep(50);
  }
}

main().catch(() => {
  console.clear();
  console.log('Matrix exited.');
});
