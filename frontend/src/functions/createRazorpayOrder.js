import { laravel } from '@/api/laravelClient';

export async function createRazorpayOrder(data) {
  return laravel.functions.invoke('createRazorpayOrder', data);
}
