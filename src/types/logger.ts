const loggingEnabled = import.meta.env.VITE_CONSOLE_LOGGING_ENABLED == 'true';

export const log: (...data: any[]) => void = (...data: any[]) => {
  if (!loggingEnabled) {
    return;
  }
  console.log(...data);
};
