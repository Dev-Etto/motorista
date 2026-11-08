const listeners = new Set<() => void>();

export function subscribeDataChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDataChanged(): void {
  listeners.forEach((listener) => listener());
}
