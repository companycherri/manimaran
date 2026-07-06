import { laravel } from './laravelClient';

export const base44 = {
  auth: laravel.auth,
  entities: laravel.entities,
  functions: laravel.functions,
  integrations: {
    Core: {
      UploadFile: laravel.uploadFile,
    },
  },
  appLogs: {
    logUserInApp: async () => ({ ok: true }),
  },
};

export default base44;
