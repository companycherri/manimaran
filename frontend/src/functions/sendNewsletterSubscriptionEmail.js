import { laravel } from '@/api/laravelClient';

export async function sendNewsletterSubscriptionEmail(data) {
  return laravel.functions.invoke('sendNewsletterSubscriptionEmail', data);
}
