const setupEnvironment = () => {
  process.env.TZ = 'UTC';
};

export const setup = () => {
  setupEnvironment();
};
