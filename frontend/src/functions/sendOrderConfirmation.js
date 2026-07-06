import { laravel } from '@/api/laravelClient';

export async function sendOrderConfirmation(data) {
  return laravel.functions.invoke('sendOrderConfirmation', data);
}
