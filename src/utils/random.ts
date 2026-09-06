export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function sample<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function optionsAround<T extends { id: string }>(target: T, items: readonly T[], count = 4): T[] {
  return shuffle([target, ...shuffle(items.filter((item) => item.id !== target.id)).slice(0, count - 1)]);
}
