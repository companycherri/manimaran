import { laravel } from '@/api/laravelClient';

export async function sendContactEmail(data) {
  return laravel.functions.invoke('sendContactEmail', data);
}
