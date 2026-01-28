let queue = Promise.resolve();
let paused = false;

export const pauseDB = () => {
  paused = true;
};

export const resumeDB = () => {
  paused = false;
};

export const runDB = async (task) => {
  // ⏸️ Wait if DB is paused
  while (paused) {
    await new Promise((r) => setTimeout(r, 50));
  }

  queue = queue
    .then(() => task())
    .catch((err) => {
      console.error("DB Queue error:", err);
    });

  return queue;
};
