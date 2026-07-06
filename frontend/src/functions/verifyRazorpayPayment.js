import { laravel } from '@/api/laravelClient';

export async function verifyRazorpayPayment(data) {
  return laravel.functions.invoke('verifyRazorpayPayment', data);
}
