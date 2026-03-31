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

let coffeeGameState: CoffeeOrder | null = null;

export function getCoffeeGameState(): CoffeeOrder | null {
  return coffeeGameState;
}

export function setCoffeeGameState(state: CoffeeOrder | null): void {
  coffeeGameState = state;
}

export function isCoffeeGameActive(): boolean {
  return coffeeGameState !== null;
}

export function startCoffeeGame(): CoffeeOrder {
  coffeeGameState = { step: 1, extras: [] };
  return coffeeGameState;
}

export function exitCoffeeGame(): void {
  coffeeGameState = null;
}
