import { createServer } from 'http';
import { config } from '../config';


export const httpServer = createServer();

export const startHttpServer = () => {
  return new Promise<void>((resolve) => {
    httpServer.listen(config.server.port, () => {
      console.log(`✅ HTTP Server running on :${config.server.port}`);
      resolve();
    });
  });
};
