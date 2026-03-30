#!/usr/bin/env node

import { question } from 'readline-sync';

const COFFEE_METHODS = [
  { id: 'espresso', name: 'Espresso', icon: '☕', desc: 'Bold, concentrated, Italian style', time: '25-30s' },
  { id: 'americano', name: 'Americano', icon: '🫖', desc: 'Espresso + hot water', time: '30s' },
  { id: 'v60', name: 'V60 Pour Over', icon: '🫗', desc: 'Clean, aromatic, Japanese', time: '2:30-3min' },
  { id: 'french', name: 'French Press', icon: '🏺', desc: 'Full-bodied, rich immersion', time: '4min' },
  { id: 'drip', name: 'Drip Coffee', icon: '☕', desc: 'Classic, reliable', time: '5min' },
  { id: 'coldbrew', name: 'Cold Brew', icon: '🧊', desc: 'Smooth, low acidity', time: '12-24h' },
  { id: 'aeropress', name: 'AeroPress', icon: '💨', desc: 'Versatile, quick', time: '1:30min' },
  { id: 'moka', name: 'Moka Pot', icon: '🏠', desc: 'Stovetop espresso', time: '5min' },
  { id: 'chemex', name: 'Chemex', icon: '🫕', desc: 'Clean, fruity notes', time: '4min' },
  { id: 'turkish', name: 'Turkish Coffee', icon: '🏺', desc: 'Extra strong, unfiltered', time: '5min' },
  { id: 'cappuccino', name: 'Cappuccino', icon: '☕', desc: 'Espresso + steamed milk foam', time: '1min' },
  { id: 'latte', name: 'Café Latte', icon: '🥛', desc: 'Espresso + lots of steamed milk', time: '1min' },
  { id: 'macchiato', name: 'Macchiato', icon: '☕', desc: 'Espresso "stained" with milk', time: '30s' },
  { id: 'flatwhite', name: 'Flat White', icon: '🥛', desc: 'Espresso + velvety microfoam', time: '1min' },
  { id: 'mocha', name: 'Mocha', icon: '🍫', desc: 'Espresso + chocolate + milk', time: '2min' },
];

const COFFEE_TYPES = [
  { id: 'ethiopian', name: 'Ethiopian Yirgacheffe', icon: '🌍', desc: 'Floral, citrus, tea-like', caffeine: 'medium', price: '+€1.50' },
  { id: 'colombian', name: 'Colombian Huila', icon: '🌎', desc: 'Caramel, nutty, balanced', caffeine: 'medium', price: '+€1' },
  { id: 'brazilian', name: 'Brazilian Santos', icon: '🌎', desc: 'Chocolate, low acidity', caffeine: 'medium', price: '€0' },
  { id: 'guatemalan', name: 'Guatemalan Antigua', icon: '🌎', desc: 'Chocolate, spicy, smoky', caffeine: 'high', price: '+€1.50' },
  { id: 'kenyan', name: 'Kenyan AA', icon: '🌍', desc: 'Bold, berry, wine-like', caffeine: 'high', price: '+€2' },
  { id: 'indonesian', name: 'Sumatra Mandheling', icon: '🌏', desc: 'Earthy, herbal, heavy', caffeine: 'high', price: '+€1.50' },
  { id: 'house', name: 'House Blend', icon: '🏠', desc: 'Balanced, reliable', caffeine: 'medium', price: '€0' },
  { id: 'decaf', name: 'Swiss Water Decaf', icon: '💤', desc: 'Zero caffeine, midnight roast', caffeine: 'none', price: '€0' },
  { id: 'robusta', name: 'Robusta Vietnam', icon: '💪', desc: 'Extra caffeine, strong', caffeine: 'MAX', price: '+€2' },
  { id: 'blend', name: 'Espresso Blend', icon: '☕', desc: 'Dark roast, crema lovers', caffeine: 'high', price: '€0.50' },
];

const ROAST_LEVELS = [
  { id: 'light', name: 'Light Roast', icon: '🟡', desc: 'Bright, acidic, most caffeine' },
  { id: 'medium', name: 'Medium Roast', icon: '🟠', desc: 'Balanced, sweet, moderate' },
  { id: 'mediumdark', name: 'Medium-Dark', icon: '🟤', desc: 'Rich, slight bitterness' },
  { id: 'dark', name: 'Dark Roast', icon: '⚫', desc: 'Bold, smoky, less acidic' },
  { id: 'french', name: 'French Roast', icon: '🖤', desc: 'Very dark, carbon notes' },
];

const TEMPERATURES = [
  { id: 'ic', name: 'Iced (0°C)', icon: '🧊', desc: 'Over ice, refreshing' },
  { id: 'cold', name: 'Cold (10-15°C)', icon: '❄️', desc: 'Chilled, smooth' },
  { id: 'warm', name: 'Warm (30-40°C)', icon: '🌡️', desc: 'Kids friendly' },
  { id: 'hot', name: 'Hot (60-70°C)', icon: '☕', desc: 'Standard hot coffee' },
  { id: 'extraHot', name: 'Extra Hot (80-90°C)', icon: '🔥', desc: 'Maximum warmth' },
];

const MILK_OPTIONS = [
  { id: 'none', name: 'Black (No Milk)', icon: '🚫', desc: 'Pure coffee, no additions' },
  { id: 'whole', name: 'Whole Milk', icon: '🥛', desc: 'Creamy, classic Italian' },
  { id: 'oat', name: 'Oat Milk', icon: '🌾', desc: 'Slightly sweet, popular', price: '+€0.50' },
  { id: 'almond', name: 'Almond Milk', icon: '🌰', desc: 'Nutty, light texture', price: '+€0.50' },
  { id: 'soy', name: 'Soy Milk', icon: '🫘', desc: 'Creamy, protein-rich', price: '+€0.50' },
  { id: 'coconut', name: 'Coconut Milk', icon: '🥥', desc: 'Tropical, sweet', price: '+€0.50' },
  { id: 'skim', name: 'Skim Milk', icon: '💧', desc: 'Light, less fat' },
  { id: 'condensed', name: 'Sweet Condensed Milk', icon: '🥫', desc: 'Vietnamese style, very sweet', price: '+€0.50' },
  { id: 'evaporated', name: 'Evaporated Milk', icon: '🥛', desc: 'Filipino style, creamy' },
];

const FOAM_LEVELS = [
  { id: 'none', name: 'No Foam', icon: '🚫', desc: 'Flat, no milk froth' },
  { id: 'light', name: 'Light Foam', icon: '☁️', desc: 'Thin layer' },
  { id: 'medium', name: 'Medium Foam', icon: '⛅', desc: 'Standard cappuccino style' },
  { id: 'thick', name: 'Thick Foam', icon: '☁️☁️', desc: 'Lots of froth' },
  { id: 'extrafoth', name: 'Extra Frothy', icon: '🧁', desc: 'Maximum foam, latte art ready' },
];

const SIZES = [
  { id: 'espresso', name: 'Espresso', icon: '☕', ml: '30ml', price: '€0' },
  { id: 'small', name: 'Small', icon: '☕', ml: '150ml', price: '€0' },
  { id: 'medium', name: 'Medium', icon: '☕☕', ml: '250ml', price: '+€0.50' },
  { id: 'large', name: 'Large', icon: '☕☕☕', ml: '350ml', price: '+€1' },
  { id: 'xlarge', name: 'XL Cup', icon: '🧋', ml: '500ml', price: '+€1.50' },
];

const SUGAR_LEVELS = [
  { id: 'none', name: 'No Sugar', icon: '🚫', price: '€0' },
  { id: 'light', name: 'Light (1 tsp)', icon: '🍬', price: '€0' },
  { id: 'medium', name: 'Medium (2 tsp)', icon: '🍬🍬', price: '€0' },
  { id: 'sweet', name: 'Sweet (3 tsp)', icon: '🍬🍬🍬', price: '€0' },
  { id: 'extraSweet', name: 'Extra Sweet (4+ tsp)', icon: '🍭', price: '€0' },
  { id: 'honey', name: 'Honey', icon: '🍯', price: '€0.50' },
  { id: 'stevia', name: 'Stevia', icon: '🌿', price: '€0.30' },
];

const EXTRAS = [
  { id: 'whipped', name: 'Whipped Cream', icon: '🍦', price: '€0.70' },
  { id: 'chocolate', name: 'Chocolate Syrup', icon: '🍫', price: '€0.50' },
  { id: 'caramel', name: 'Caramel Syrup', icon: '🍯', price: '€0.50' },
  { id: 'vanilla', name: 'Vanilla Syrup', icon: '🍦', price: '€0.50' },
  { id: 'hazelnut', name: 'Hazelnut Syrup', icon: '🌰', price: '€0.50' },
  { id: 'cinnamon', name: 'Cinnamon Powder', icon: '🌿', price: '€0' },
  { id: 'cocoa', name: 'Cocoa Powder', icon: '🍫', price: '€0' },
  { id: 'nutmeg', name: 'Nutmeg', icon: '🌰', price: '€0' },
  { id: 'ice', name: 'Extra Ice', icon: '🧊', price: '€0' },
  { id: 'salt', name: 'Sea Salt', icon: '🧂', price: '€0' },
  { id: 'peppermint', name: 'Peppermint', icon: '🌿', price: '€0.50' },
  { id: 'ginger', name: 'Ginger', icon: '🫚', price: '€0.30' },
];

const INTENSITY_LEVELS = [
  { id: 'mild', name: 'Mild', icon: '🌸', desc: 'Gentle, subtle flavors' },
  { id: 'balanced', name: 'Balanced', icon: '⚖️', desc: 'Standard strength' },
  { id: 'strong', name: 'Strong', icon: '💪', desc: 'Bold, intense' },
  { id: 'extraStrong', name: 'Extra Strong', icon: '🔥', desc: 'Maximum impact' },
  { id: 'espresso', name: 'Espresso Style', icon: '☕', desc: 'Pure, concentrated' },
];

function printBanner() {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║     ☕ JLMT LAB COFFEE MACHINE v2.0 ☕                 ║
  ║                                                          ║
  ║        "Brewing excellence since 2024"                 ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
}

function selectOption<T>(items: T[], displayName: string): T {
  console.log(`\n  ╔══════════════════════════════════════════════════════════╗`);
  console.log(`  ║  ☕ SELECT YOUR ${displayName.toUpperCase().padEnd(33)}║`);
  console.log(`  ╚══════════════════════════════════════════════════════════╝\n`);
  
  items.forEach((item, idx) => {
    const extra = (item as any).price ? ` [${(item as any).price}]` : '';
    const desc = (item as any).desc ? ` - ${(item as any).desc}` : '';
    console.log(`    [${(idx + 1).toString().padStart(2)}] ${(item as any).icon || '•'} ${item.name}${extra}`);
    if (desc !== '- undefined') console.log(`        ${desc}`);
  });
  console.log('');
  
  while (true) {
    const input = question('  ➤ Your choice: ');
    const idx = parseInt(input) - 1;
    if (idx >= 0 && idx < items.length) {
      return items[idx];
    }
    console.log('  ⚠️  Invalid choice. Try again.');
  }
}

function selectMultiOption<T extends { id: string; name: string; icon?: string; price?: string }>(
  items: T[],
  displayName: string
): T[] {
  const selected: T[] = [];
  
  console.log(`\n  ╔══════════════════════════════════════════════════════════╗`);
  console.log(`  ║  ✨ SELECT YOUR ${displayName.toUpperCase().padEnd(30)}║`);
  console.log(`  ║  (Multi-select - press number to toggle, 0 when done)  ║`);
  console.log(`  ╚══════════════════════════════════════════════════════════╝\n`);
  
  const showList = () => {
    items.forEach((item, idx) => {
      const extra = item.price ? ` [${item.price}]` : '';
      const marker = selected.some(s => s.id === item.id) ? '☑' : '☐';
      console.log(`    [${idx + 1}] ${marker} ${item.icon || '•'} ${item.name}${extra}`);
    });
    console.log('    [0] Done selecting\n');
  };
  
  showList();
  
  while (true) {
    const input = question('  ➤ Toggle (0 done): ');
    const idx = parseInt(input) - 1;
    
    if (idx === -1) {
      break;
    }
    
    if (idx >= 0 && idx < items.length) {
      const item = items[idx];
      const existingIdx = selected.findIndex(s => s.id === item.id);
      
      if (existingIdx >= 0) {
        selected.splice(existingIdx, 1);
        console.log(`  ➖ Removed: ${item.icon} ${item.name}`);
      } else {
        selected.push(item);
        console.log(`  ➕ Added: ${item.icon} ${item.name}`);
      }
    } else {
      console.log('  ⚠️  Invalid choice');
    }
    console.log('');
  }
  
  return selected;
}

function confirmOrder(order: any): boolean {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                    📝 ORDER SUMMARY                      ║
  ╠══════════════════════════════════════════════════════════╣`);
  
  console.log(`  ║  Method:      ${order.method.icon} ${order.method.name.padEnd(40)}║`);
  console.log(`  ║  Coffee:      ${order.coffeeType.icon} ${order.coffeeType.name.padEnd(40)}║`);
  console.log(`  ║  Origin:      ${order.roast.icon} ${order.roast.name.padEnd(40)}║`);
  console.log(`  ║  Intensity:   ${order.intensity.icon} ${order.intensity.name.padEnd(40)}║`);
  console.log(`  ║  Size:        ${order.size.icon} ${order.size.name} (${order.size.ml})`.padEnd(56) + '║');
  console.log(`  ║  Temperature: ${order.temperature.icon} ${order.temperature.name.padEnd(40)}║`);
  console.log(`  ║  Milk:        ${order.milk.icon} ${order.milk.name.padEnd(40)}║`);
  console.log(`  ║  Foam:        ${order.foam.icon} ${order.foam.name.padEnd(40)}║`);
  console.log(`  ║  Sweetness:    ${order.sugar.icon} ${order.sugar.name.padEnd(40)}║`);
  
  if (order.extras.length > 0) {
    const extrasStr = order.extras.map((e: any) => `${e.icon}`).join(' ');
    console.log(`  ║  Extras:     ${extrasStr.padEnd(44)}║`);
  }
  
  console.log(`  ╠══════════════════════════════════════════════════════════╣`);
  
  const total = calculateTotal(order);
  console.log(`  ║  💶 TOTAL: €${total.toFixed(2).padEnd(46)}║`);
  
  console.log(`  ╚══════════════════════════════════════════════════════════╝`);
  
  const confirm = question('\n  ✅ Confirm order? (y/n): ');
  return confirm.toLowerCase() === 'y';
}

function calculateTotal(order: any): number {
  let total = 2.50;
  
  if (order.size.price === '+€0.50') total += 0.50;
  if (order.size.price === '+€1') total += 1.00;
  if (order.size.price === '+€1.50') total += 1.50;
  
  if (order.coffeeType.price === '+€1') total += 1.00;
  if (order.coffeeType.price === '+€1.50') total += 1.50;
  if (order.coffeeType.price === '+€2') total += 2.00;
  if (order.coffeeType.price === '+€0.50') total += 0.50;
  
  if (order.milk.price === '+€0.50') total += 0.50;
  
  if (order.sugar.id === 'honey') total += 0.50;
  if (order.sugar.id === 'stevia') total += 0.30;
  
  order.extras.forEach((extra: any) => {
    if (extra.price === '€0.50') total += 0.50;
    if (extra.price === '€0.70') total += 0.70;
    if (extra.price === '€0.30') total += 0.30;
  });
  
  return total;
}

function brewCoffee(order: any) {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║              🔧 BREWING IN PROGRESS...                 ║
  ╠══════════════════════════════════════════════════════════╣`);
  
  console.log(`  ║  ☕ Method: ${order.method.name.padEnd(45)}║`);
  console.log(`  ║  ⏱️  Brew time: ${order.method.time.padEnd(43)}║`);
  console.log(`  ║  🌡️  Temperature: ${order.temperature.name.padEnd(40)}║`);
  console.log(`  ║  💪 Intensity: ${order.intensity.name.padEnd(42)}║`);
  console.log(`  ║  📊 Progress:`);
  
  console.log('  ║');
  
  for (let i = 0; i <= 100; i += 5) {
    const filled = Math.floor(i / 5);
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r  ║  [${bar}] ${i}%`);
    await new Promise(r => setTimeout(r, order.method.id === 'coldbrew' ? 100 : 50));
  }
  
  console.log(`
  ╠══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║              ☕☕☕ COFFEE READY! ☕☕☕                   ║
  ║                                                          ║
  ╠══════════════════════════════════════════════════════════╣`);
  
  console.log(`  ║  🏷️  Name: "JLMT LAB SPECIAL #${Math.floor(Math.random() * 999) + 1}"`);
  console.log(`  ║  📦 Size: ${order.size.ml}`);
  console.log(`  ║  ☕ Bean: ${order.coffeeType.name}`);
  console.log(`  ║  🔥 Roast: ${order.roast.name}`);
  console.log(`  ║  💪 Intensity: ${order.intensity.name}`);
  console.log(`  ║  🌡️  Temp: ${order.temperature.name}`);
  console.log(`  ║  🥛 Milk: ${order.milk.name}`);
  console.log(`  ║  ☁️  Foam: ${order.foam.name}`);
  console.log(`  ║  🍬 Sweetness: ${order.sugar.name}`);
  
  if (order.extras.length > 0) {
    console.log(`  ║  ✨ Extras: ${order.extras.map((e: any) => e.name).join(', ')}`);
  }
  
  const total = calculateTotal(order);
  console.log(`  ║`);
  console.log(`  ║  💶 Price: €${total.toFixed(2)}`);
  console.log(`  ║`);
  console.log(`  ╠══════════════════════════════════════════════════════════╣`);
  console.log(`  ║`);
  console.log(`  ║     "Served with precision by JLMT LAB Barista"         `);
  console.log(`  ║`);
  console.log(`  ╚══════════════════════════════════════════════════════════╝`);
}

async function main() {
  printBanner();
  
  console.log('  🤖 Initializing JLMT Coffee Machine v2.0...');
  console.log('  🔧 Calibrating 9-bar pressure pump...');
  console.log('  🌡️  Heating boiler to 93°C...');
  console.log('  🥛 Checking milk steamer...');
  console.log('  ⚡ Verifying espresso calibration...\n');
  
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log('  ✅ Machine READY! Your barista awaits.\n');
  
  question('  Press ENTER to start your order...');
  
  const method = selectOption(COFFEE_METHODS, 'Brew Method');
  
  const coffeeType = selectOption(COFFEE_TYPES, 'Coffee Bean');
  
  const roast = selectOption(ROAST_LEVELS, 'Roast Level');
  
  const intensity = selectOption(INTENSITY_LEVELS, 'Intensity');
  
  const size = selectOption(SIZES, 'Cup Size');
  
  const temperature = selectOption(TEMPERATURES, 'Temperature');
  
  const milk = selectOption(MILK_OPTIONS, 'Milk');
  
  const foam = selectOption(FOAM_LEVELS, 'Foam Level');
  
  const sugar = selectOption(SUGAR_LEVELS, 'Sweetness');
  
  const extras = selectMultiOption(EXTRAS, 'Extras');
  
  const order = {
    method,
    coffeeType,
    roast,
    intensity,
    size,
    temperature,
    milk,
    foam,
    sugar,
    extras,
  };
  
  if (confirmOrder(order)) {
    await brewCoffee(order);
  } else {
    console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║           ❌ ORDER CANCELLED                            ║
  ║                                                          ║
  ║      "No worries, we'll be here when you're ready"       ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
    `);
  }
  
  const again = question('\n  🔄 Order another coffee? (y/n): ');
  if (again.toLowerCase() === 'y') {
    console.clear();
    main();
  } else {
    console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║        ☕ Thanks for visiting JLMT Coffee Lab! ☕        ║
  ║                                                          ║
  ║               "See you next time!"                      ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
    `);
  }
}

main().catch(console.error);
