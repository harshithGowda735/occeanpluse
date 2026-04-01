import serverless from 'serverless-http';
import { setupApp } from '../../server.js';

// The function will cache the Express app and MongoDB connection
// inside the file scope for persistence between invocations.
let handler: any;

export const handler = async (event: any, context: any) => {
  if (!handler) {
    const app = await setupApp();
    handler = serverless(app);
  }
  return handler(event, context);
};
