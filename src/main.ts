/**
 * Matrix Rain Story — Entry Point
 *
 * Creates the MatrixEngine and starts the application.
 */

import { MatrixEngine } from "./engine/MatrixEngine.js";

const engine = new MatrixEngine();

engine
  .init()
  .then(() => {
    console.log("Matrix Rain Story initialized");
  })
  .catch((err: unknown) => {
    console.error("Failed to initialize:", err);
  });
