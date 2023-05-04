export default function sleep(ms: number, onTimeout?: (id: NodeJS.Timeout) => void) {
  return new Promise((resolve) => {
    const id: NodeJS.Timeout = setTimeout(resolve, ms);
    if (onTimeout) onTimeout(id);
  });
}
