import type { CommandDefinition } from '../commandRegistry';
import { registerCommand } from '../commandRegistry';

export interface CoffeeOrder {
  step: number;
  method?: string;
  bean?: string;
  roast?: string;
  intensity?: string;
  size?: string;
  temperature?: string;
  milk?: string;
  foam?: string;
  sugar?: string;
  extras: string[];
}

const COFFEE_METHODS = [
  { id: 'espresso', name: 'Espresso', icon: '☕', time: '25-30s', desc: 'Bold, concentrated' },
  { id: 'americano', name: 'Americano', icon: '🫖', time: '30s', desc: 'Espresso + water' },
  { id: 'v60', name: 'V60 Pour Over', icon: '🫗', time: '2:30', desc: 'Clean, aromatic' },
  { id: 'french', name: 'French Press', icon: '🏺', time: '4min', desc: 'Full-bodied' },
  { id: 'coldbrew', name: 'Cold Brew', icon: '🧊', time: '12h', desc: 'Smooth, cold' },
  { id: 'cappuccino', name: 'Cappuccino', icon: '☕', time: '1min', desc: 'Espresso + foam' },
  { id: 'latte', name: 'Café Latte', icon: '🥛', time: '1min', desc: 'Espresso + milk' },
  { id: 'mocha', name: 'Mocha', icon: '🍫', time: '2min', desc: 'Chocolate + coffee' },
];

const COFFEE_BEANS = [
  { id: 'ethiopian', name: 'Ethiopian Yirgacheffe', icon: '🌍', desc: 'Floral, citrus' },
  { id: 'colombian', name: 'Colombian Huila', icon: '🌎', desc: 'Caramel, nutty' },
  { id: 'brazilian', name: 'Brazilian Santos', icon: '🌎', desc: 'Chocolate, smooth' },
  { id: 'guatemalan', name: 'Guatemalan Antigua', icon: '🌎', desc: 'Spicy, smoky' },
  { id: 'kenyan', name: 'Kenyan AA', icon: '🌍', desc: 'Bold, berry' },
  { id: 'house', name: 'House Blend', icon: '🏠', desc: 'Balanced' },
  { id: 'decaf', name: 'Swiss Water Decaf', icon: '💤', desc: 'Zero caffeine' },
  { id: 'robusta', name: 'Robusta Vietnam', icon: '💪', desc: 'Maximum caffeine' },
];

const ROAST_LEVELS = [
  { id: 'light', name: 'Light Roast', icon: '🟡', desc: 'Bright, acidic' },
  { id: 'medium', name: 'Medium Roast', icon: '🟠', desc: 'Balanced' },
  { id: 'dark', name: 'Dark Roast', icon: '🟤', desc: 'Bold, smoky' },
  { id: 'french', name: 'French Roast', icon: '⚫', desc: 'Very dark' },
];

const INTENSITY_LEVELS = [
  { id: 'mild', name: 'Mild', icon: '🌸' },
  { id: 'balanced', name: 'Balanced', icon: '⚖️' },
  { id: 'strong', name: 'Strong', icon: '💪' },
  { id: 'espresso', name: 'Espresso Style', icon: '☕' },
];

const SIZES = [
  { id: 'small', name: 'Small (150ml)', icon: '☕' },
  { id: 'medium', name: 'Medium (250ml)', icon: '☕☕' },
  { id: 'large', name: 'Large (350ml)', icon: '☕☕☕' },
  { id: 'xlarge', name: 'XL (500ml)', icon: '🧋' },
];

const TEMPERATURES = [
  { id: 'iced', name: 'Iced (0°C)', icon: '🧊' },
  { id: 'cold', name: 'Cold (10-15°C)', icon: '❄️' },
  { id: 'hot', name: 'Hot (60-70°C)', icon: '☕' },
  { id: 'extraHot', name: 'Extra Hot (80°C)', icon: '🔥' },
];

const MILK_OPTIONS = [
  { id: 'none', name: 'Black (No Milk)', icon: '🚫' },
  { id: 'whole', name: 'Whole Milk', icon: '🥛' },
  { id: 'oat', name: 'Oat Milk', icon: '🌾' },
  { id: 'almond', name: 'Almond Milk', icon: '🌰' },
  { id: 'soy', name: 'Soy Milk', icon: '🫘' },
  { id: 'coconut', name: 'Coconut Milk', icon: '🥥' },
];

const FOAM_LEVELS = [
  { id: 'none', name: 'No Foam', icon: '🚫' },
  { id: 'light', name: 'Light Foam', icon: '☁️' },
  { id: 'medium', name: 'Medium Foam', icon: '⛅' },
  { id: 'thick', name: 'Thick Foam', icon: '🧁' },
];

const SUGAR_LEVELS = [
  { id: 'none', name: 'No Sugar', icon: '🚫' },
  { id: 'light', name: 'Light (1 tsp)', icon: '🍬' },
  { id: 'medium', name: 'Medium (2 tsp)', icon: '🍬🍬' },
  { id: 'sweet', name: 'Sweet (3 tsp)', icon: '🍭' },
  { id: 'honey', name: 'Honey', icon: '🍯' },
];

const EXTRAS = [
  { id: 'whipped', name: 'Whipped Cream', icon: '🍦' },
  { id: 'chocolate', name: 'Chocolate Syrup', icon: '🍫' },
  { id: 'caramel', name: 'Caramel Syrup', icon: '🍯' },
  { id: 'vanilla', name: 'Vanilla Syrup', icon: '🍦' },
  { id: 'cinnamon', name: 'Cinnamon', icon: '🌿' },
  { id: 'ice', name: 'Extra Ice', icon: '🧊' },
];

const COFFEE_ASCII = `
     ( (
      ) )
    .______.
    |      |]
    \\      /
     \`----'`;

let coffeeGameState: CoffeeOrder | null = null;

function formatMenu(title: string, items: any[], currentStep: number): string {
  let output = `\n${'═'.repeat(45)}\n`;
  output += `  ☕ JLMT COFFEE LAB - ${title}\n`;
  output += `${'═'.repeat(45)}\n\n`;

  items.forEach((item, idx) => {
    output += `  [${idx + 1}] ${item.icon || '•'} ${item.name}\n`;
    output += `      └─ ${item.desc || item.time || ''}\n`;
  });

  output += `\n  [0] Exit coffee game\n`;
  output += `${'─'.repeat(45)}\n`;
  output += `\n  Step ${currentStep}/10 | Press number to select\n`;

  return output;
}

function calculatePrice(order: CoffeeOrder): number {
  let price = 2.50;
  
  if (order.size === 'medium') price += 0.50;
  if (order.size === 'large') price += 1.00;
  if (order.size === 'xlarge') price += 1.50;
  
  if (order.bean === 'ethiopian' || order.bean === 'guatemalan') price += 1.50;
  if (order.bean === 'kenyan' || order.bean === 'robusta') price += 2.00;
  
  if (order.milk === 'oat' || order.milk === 'almond' || order.milk === 'soy' || order.milk === 'coconut') {
    price += 0.50;
  }
  
  if (order.sugar === 'honey') price += 0.50;
  
  order.extras.forEach(extra => {
    if (extra === 'whipped') price += 0.70;
    if (extra === 'chocolate' || extra === 'caramel' || extra === 'vanilla') price += 0.50;
  });
  
  return price;
}

function getNextStep(currentStep: number): number {
  const skipConditions: Record<number, (order: CoffeeOrder) => boolean> = {
    7: (o) => o.method === 'espresso' || o.method === 'americano',
    8: (o) => o.milk === 'none',
  };
  
  for (let s = currentStep + 1; s <= 10; s++) {
    if (skipConditions[s] && skipConditions[s](coffeeGameState!)) {
      continue;
    }
    return s;
  }
  return 10;
}

function showOrderSummary(): string {
  const order = coffeeGameState!;
  const method = COFFEE_METHODS.find(m => m.id === order.method);
  const bean = COFFEE_BEANS.find(b => b.id === order.bean);
  const roast = ROAST_LEVELS.find(r => r.id === order.roast);
  const intensity = INTENSITY_LEVELS.find(i => i.id === order.intensity);
  const size = SIZES.find(s => s.id === order.size);
  const temp = TEMPERATURES.find(t => t.id === order.temperature);
  const milk = MILK_OPTIONS.find(m => m.id === order.milk);
  const foam = FOAM_LEVELS.find(f => f.id === order.foam);
  const sugar = SUGAR_LEVELS.find(s => s.id === order.sugar);

  const price = calculatePrice(order);

  let output = `\n${'═'.repeat(45)}\n`;
  output += `  ☕ YOUR ORDER\n`;
  output += `${'═'.repeat(45)}\n\n`;
  output += `  Method:     ${method?.icon} ${method?.name}\n`;
  output += `  Bean:       ${bean?.icon} ${bean?.name}\n`;
  output += `  Roast:      ${roast?.icon} ${roast?.name}\n`;
  output += `  Intensity:  ${intensity?.icon} ${intensity?.name}\n`;
  output += `  Size:       ${size?.icon} ${size?.name}\n`;
  output += `  Temp:       ${temp?.icon} ${temp?.name}\n`;
  output += `  Milk:       ${milk?.icon} ${milk?.name}\n`;
  output += `  Foam:       ${foam?.icon} ${foam?.name}\n`;
  output += `  Sugar:      ${sugar?.icon} ${sugar?.name}\n`;

  if (order.extras.length > 0) {
    const extraNames = order.extras.map(e => {
      const ex = EXTRAS.find(x => x.id === e);
      return `${ex?.icon} ${ex?.name}`;
    }).join(', ');
    output += `  Extras:     ${extraNames}\n`;
  }

  output += `\n${'-'.repeat(45)}\n`;
  output += `  💶 TOTAL: €${price.toFixed(2)}\n`;
  output += `${'─'.repeat(45)}\n\n`;
  output += `  [1] Confirm order\n`;
  output += `  [2] Start over\n`;
  output += `  [0] Cancel\n`;

  return output;
}

function showBrewingAnimation(): string {
  let output = `\n${'═'.repeat(45)}\n`;
  output += `  🔧 BREWING YOUR COFFEE\n`;
  output += `${'═'.repeat(45)}\n\n`;

  const method = COFFEE_METHODS.find(m => m.id === coffeeGameState?.method);
  output += `  ☕ Method: ${method?.name}\n`;
  output += `  ⏱️  Time: ${method?.time}\n`;
  output += `  🌡️  Temp: 93°C\n\n`;

  output += `  [`;
  for (let i = 0; i <= 100; i += 10) {
    output += '█';
  }
  output += `] 100%\n\n`;

  output += `  Brewing in progress...\n`;

  return output;
}

function processCoffeeInput(input: string): { output: string; isComplete: boolean } {
  const trimmed = input.trim().toLowerCase();
  
  if (trimmed === '0' || trimmed === 'exit' || trimmed === 'q' || trimmed === 'cancel') {
    coffeeGameState = null;
    return {
      output: `\n  👋 Coffee game cancelled.\n  Type 'coffee' to start a new order.\n`,
      isComplete: true
    };
  }

  if (trimmed === '2' && coffeeGameState?.step === 10) {
    coffeeGameState = { step: 1, extras: [] };
    return {
      output: formatMenu('SELECT METHOD', COFFEE_METHODS, 1),
      isComplete: false
    };
  }

  const num = parseInt(trimmed);
  const step = coffeeGameState!.step;

  if (step === 1) {
    if (num < 1 || num > COFFEE_METHODS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${COFFEE_METHODS.length}\n`, isComplete: false };
    }
    coffeeGameState!.method = COFFEE_METHODS[num - 1].id;
    coffeeGameState!.step = 2;
    return {
      output: formatMenu('SELECT BEAN', COFFEE_BEANS, 2),
      isComplete: false
    };
  }

  if (step === 2) {
    if (num < 1 || num > COFFEE_BEANS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${COFFEE_BEANS.length}\n`, isComplete: false };
    }
    coffeeGameState!.bean = COFFEE_BEANS[num - 1].id;
    coffeeGameState!.step = 3;
    return {
      output: formatMenu('SELECT ROAST', ROAST_LEVELS, 3),
      isComplete: false
    };
  }

  if (step === 3) {
    if (num < 1 || num > ROAST_LEVELS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${ROAST_LEVELS.length}\n`, isComplete: false };
    }
    coffeeGameState!.roast = ROAST_LEVELS[num - 1].id;
    coffeeGameState!.step = 4;
    return {
      output: formatMenu('SELECT INTENSITY', INTENSITY_LEVELS, 4),
      isComplete: false
    };
  }

  if (step === 4) {
    if (num < 1 || num > INTENSITY_LEVELS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${INTENSITY_LEVELS.length}\n`, isComplete: false };
    }
    coffeeGameState!.intensity = INTENSITY_LEVELS[num - 1].id;
    coffeeGameState!.step = 5;
    return {
      output: formatMenu('SELECT SIZE', SIZES, 5),
      isComplete: false
    };
  }

  if (step === 5) {
    if (num < 1 || num > SIZES.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${SIZES.length}\n`, isComplete: false };
    }
    coffeeGameState!.size = SIZES[num - 1].id;
    coffeeGameState!.step = 6;
    return {
      output: formatMenu('SELECT TEMPERATURE', TEMPERATURES, 6),
      isComplete: false
    };
  }

  if (step === 6) {
    if (num < 1 || num > TEMPERATURES.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${TEMPERATURES.length}\n`, isComplete: false };
    }
    coffeeGameState!.temperature = TEMPERATURES[num - 1].id;
    coffeeGameState!.step = 7;
    return {
      output: formatMenu('SELECT MILK', MILK_OPTIONS, 7),
      isComplete: false
    };
  }

  if (step === 7) {
    if (num < 1 || num > MILK_OPTIONS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${MILK_OPTIONS.length}\n`, isComplete: false };
    }
    coffeeGameState!.milk = MILK_OPTIONS[num - 1].id;
    coffeeGameState!.step = 8;
    
    if (coffeeGameState!.method === 'espresso' || coffeeGameState!.method === 'americano') {
      coffeeGameState!.step = 9;
      return {
        output: formatMenu('SELECT SUGAR', SUGAR_LEVELS, 9),
        isComplete: false
      };
    }
    return {
      output: formatMenu('SELECT FOAM', FOAM_LEVELS, 8),
      isComplete: false
    };
  }

  if (step === 8) {
    if (num < 1 || num > FOAM_LEVELS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${FOAM_LEVELS.length}\n`, isComplete: false };
    }
    coffeeGameState!.foam = FOAM_LEVELS[num - 1].id;
    coffeeGameState!.step = 9;
    return {
      output: formatMenu('SELECT SUGAR', SUGAR_LEVELS, 9),
      isComplete: false
    };
  }

  if (step === 9) {
    if (num < 1 || num > SUGAR_LEVELS.length) {
      return { output: `  ⚠️ Invalid choice. Select 1-${SUGAR_LEVELS.length}\n`, isComplete: false };
    }
    coffeeGameState!.sugar = SUGAR_LEVELS[num - 1].id;
    coffeeGameState!.step = 10;

    let output = `\n${'═'.repeat(45)}\n`;
    output += `  ✨ EXTRAS (multi-select)\n`;
    output += `${'═'.repeat(45)}\n\n`;
    EXTRAS.forEach((extra, idx) => {
      output += `  [${idx + 1}] ${extra.icon} ${extra.name}\n`;
    });
    output += `\n  [D] Done adding extras\n`;
    output += `  [0] Skip extras\n`;

    return { output, isComplete: false };
  }

  if (step === 10) {
    if (trimmed === 'd') {
      coffeeGameState!.step = 11;
      return { output: showOrderSummary(), isComplete: false };
    }
    
    if (trimmed === '0') {
      coffeeGameState!.step = 11;
      return { output: showOrderSummary(), isComplete: false };
    }
    
    const extraNum = parseInt(trimmed);
    if (extraNum >= 1 && extraNum <= EXTRAS.length) {
      const extraId = EXTRAS[extraNum - 1].id;
      if (coffeeGameState!.extras.includes(extraId)) {
        coffeeGameState!.extras = coffeeGameState!.extras.filter(e => e !== extraId);
      } else {
        coffeeGameState!.extras.push(extraId);
      }
      
      let output = `\n  ✨ Your extras:\n`;
      if (coffeeGameState!.extras.length === 0) {
        output += `     (none)\n`;
      } else {
        coffeeGameState!.extras.forEach(e => {
          const ex = EXTRAS.find(x => x.id === e);
          output += `     - ${ex?.icon} ${ex?.name}\n`;
        });
      }
      output += `\n  [D] Done | [0] Skip | [1-${EXTRAS.length}] Toggle\n`;
      return { output, isComplete: false };
    }
    
    return { output: `  ⚠️ Invalid choice\n`, isComplete: false };
  }

  if (step === 11) {
    if (num === 1) {
      const price = calculatePrice(coffeeGameState!);
      const orderNum = Math.floor(Math.random() * 900) + 100;
      
      let output = showBrewingAnimation();
      output += `\n${'═'.repeat(45)}\n`;
      output += `  ☕☕☕ COFFEE READY! ☕☕☕\n`;
      output += `${'═'.repeat(45)}\n\n`;
      output += `  🏷️  Order #${orderNum}\n`;
      output += `  📦 Size: ${SIZES.find(s => s.id === coffeeGameState!.size)?.name}\n`;
      output += `  ☕ ${COFFEE_BEANS.find(b => b.id === coffeeGameState!.bean)?.name}\n`;
      output += `  🔥 ${ROAST_LEVELS.find(r => r.id === coffeeGameState!.roast)?.name}\n`;
      output += `\n  💶 Price: €${price.toFixed(2)}\n`;
      output += `\n  "Served with precision by JLMT LAB Barista"\n`;
      output += `\n  Type 'coffee' to order another!\n`;
      
      coffeeGameState = null;
      return { output, isComplete: true };
    }
    
    if (num === 2) {
      coffeeGameState = { step: 1, extras: [] };
      return {
        output: formatMenu('SELECT METHOD', COFFEE_METHODS, 1),
        isComplete: false
      };
    }
    
    if (num === 0) {
      coffeeGameState = null;
      return {
        output: `\n  👋 Order cancelled.\n  Type 'coffee' to start a new order.\n`,
        isComplete: true
      };
    }
    
    return { output: `  ⚠️ Invalid choice\n`, isComplete: false };
  }

  return { output: '  ⚠️ Error\n', isComplete: true };
}

function startCoffeeGame(): string {
  coffeeGameState = { step: 1, extras: [] };

  let output = `\n${COFFEE_ASCII}\n`;
  output += `\n${'═'.repeat(45)}\n`;
  output += `  ☕ JLMT COFFEE LAB - INTERACTIVE ORDERING\n`;
  output += `${'═'.repeat(45)}\n\n`;
  output += `  Welcome to JLMT Coffee Lab!\n`;
  output += `  Your personal barista awaits.\n\n`;
  output += `  Step 1: Select your brewing method\n`;
  output += `  Step 2: Choose your bean origin\n`;
  output += `  Step 3: Pick your roast level\n`;
  output += `  Step 4: Set intensity\n`;
  output += `  Step 5: Choose size\n`;
  output += `  Step 6: Temperature\n`;
  output += `  Step 7: Milk preference\n`;
  output += `  Step 8: Foam level\n`;
  output += `  Step 9: Sweetness\n`;
  output += `  Step 10: Extras\n`;
  output += `  Step 11: Confirm & brew!\n\n`;
  output += `${'-'.repeat(45)}\n`;
  output += `  Press [0] anytime to exit\n`;
  output += `${'-'.repeat(45)}\n\n`;

  output += formatMenu('SELECT METHOD', COFFEE_METHODS, 1);

  return output;
}

function handleCoffeeCommand(input: string): string {
  if (!coffeeGameState) {
    return startCoffeeGame();
  }
  
  const { output } = processCoffeeInput(input);
  return output;
}

function isCoffeeGameActive(): boolean {
  return coffeeGameState !== null;
}

function exitCoffeeGame(): void {
  coffeeGameState = null;
}

export { handleCoffeeCommand, isCoffeeGameActive, exitCoffeeGame };

const coffeeInteractiveCommand: CommandDefinition = {
  aliases: ['coffee', 'make coffee', 'brew', 'order coffee', 'cafe'],
  description: '☕ Order coffee - interactive coffee game',
  category: 'easter',
  execute: (args) => {
    const input = args.join(' ');
    const output = handleCoffeeCommand(input);
    return { output, action: 'none' };
  },
};

export function registerCoffeeCommands() {
  registerCommand(coffeeInteractiveCommand);
}
