<?php

use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Api\Admin\InventoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Auth\AuthenticatedUserController;
use App\Http\Controllers\Api\Auth\EmailVerificationController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CmsEntityController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\FunctionController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RazorpayController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('register', [AuthenticatedUserController::class, 'register']);
    Route::post('login', [AuthenticatedUserController::class, 'login']);
    Route::post('admin/login', [AuthenticatedUserController::class, 'adminLogin']);

    Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword'])
        ->middleware('throttle:5,1');
    Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);

    Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('me', [AuthenticatedUserController::class, 'me']);
        Route::patch('me', [AuthenticatedUserController::class, 'updateMe']);
        Route::post('logout', [AuthenticatedUserController::class, 'logout']);
        Route::post('email/verification-notification', [EmailVerificationController::class, 'send'])
            ->middleware('throttle:6,1')
            ->name('verification.send');
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->get('admin/auth-check', function () {
    return response()->json([
        'message' => 'Admin access granted.',
    ]);
});

Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{category:slug}', [CategoryController::class, 'show']);
Route::get('products', [ProductController::class, 'index']);
Route::get('products/id/{product}', [ProductController::class, 'showById']);
Route::get('products/{product:slug}', [ProductController::class, 'show']);
Route::get('entities/{entity}', [CmsEntityController::class, 'index']);
Route::get('orders/track/{orderNumber}', [OrderController::class, 'track']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('uploads', [UploadController::class, 'store']);

    Route::post('entities/{entity}', [CmsEntityController::class, 'store']);
    Route::patch('entities/{entity}/{cmsEntity}', [CmsEntityController::class, 'update']);
    Route::delete('entities/{entity}/{cmsEntity}', [CmsEntityController::class, 'destroy']);

    Route::get('cart', [CartController::class, 'index']);
    Route::post('cart/items', [CartController::class, 'store']);
    Route::patch('cart/items/{cartItem}', [CartController::class, 'update']);
    Route::delete('cart/items/{cartItem}', [CartController::class, 'destroy']);
    Route::delete('cart', [CartController::class, 'clear']);

    Route::get('wishlist', [WishlistController::class, 'index']);
    Route::post('wishlist/items', [WishlistController::class, 'store']);
    Route::delete('wishlist/items/{wishlistItem}', [WishlistController::class, 'destroy']);

    Route::post('coupons/validate', [CouponController::class, 'validateCoupon']);

    Route::get('orders', [OrderController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::post('orders/base44', [OrderController::class, 'storeFromBase44']);
    Route::get('orders/{order}', [OrderController::class, 'show']);

    Route::post('razorpay/orders', [RazorpayController::class, 'createOrder']);
    Route::post('razorpay/verify', [RazorpayController::class, 'verifyPayment']);
    Route::post('razorpay/standalone-orders', [RazorpayController::class, 'createStandaloneOrder']);
    Route::post('razorpay/standalone-verify', [RazorpayController::class, 'verifyStandalonePayment']);

    Route::post('functions/send-contact-email', [FunctionController::class, 'sendContactEmail']);
    Route::post('functions/send-newsletter-subscription-email', [FunctionController::class, 'sendNewsletterSubscriptionEmail']);
    Route::post('functions/send-order-confirmation', [FunctionController::class, 'sendOrderConfirmation']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function (): void {
    Route::get('users', [AdminUserController::class, 'index']);
    Route::apiResource('categories', AdminCategoryController::class);
    Route::apiResource('products', AdminProductController::class);
    Route::apiResource('coupons', AdminCouponController::class);
    Route::get('orders', [AdminOrderController::class, 'index']);
    Route::get('orders/{order}', [AdminOrderController::class, 'show']);
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    Route::post('products/{product}/images', [ProductImageController::class, 'store']);
    Route::delete('products/{product}/images/{mediaAsset}', [ProductImageController::class, 'destroy']);

    Route::patch('inventory/variants/{variant}', [InventoryController::class, 'update']);
});
