<?php

use App\Http\Controllers\Account\AvatarController;
use App\Http\Controllers\Account\PasswordChangeController;
use App\Http\Controllers\Account\PreferenceController;
use App\Http\Controllers\Account\ProfileController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NoteProtectionController;
use App\Http\Controllers\NoteShareController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'backend',
    ]);
});

Route::get('/health/database', function () {
    try {
        DB::connection()->select('SELECT 1');

        return response()->json([
            'status' => 'ok',
            'service' => 'database',
        ], 200);
    } catch (Throwable) {
        return response()->json([
            'status' => 'unavailable',
            'service' => 'database',
        ], 503);
    }
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:registration');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:forgot-password');
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:reset-password');

    Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:30,1'])
        ->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/email/resend', [VerificationController::class, 'resend'])->middleware('throttle:verification-resend');
    });
});

Route::prefix('account')->middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::patch('/profile', [ProfileController::class, 'update']);

    Route::post('/avatar', [AvatarController::class, 'upload']);
    Route::delete('/avatar', [AvatarController::class, 'destroy']);
    Route::get('/avatar', [AvatarController::class, 'show']);

    Route::post('/password', [PasswordChangeController::class, 'update'])->middleware('throttle:10,1');

    Route::get('/preferences', [PreferenceController::class, 'show']);
    Route::patch('/preferences', [PreferenceController::class, 'update']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notes', [NoteController::class, 'index']);
    Route::post('/notes', [NoteController::class, 'store']);
    Route::get('/notes/{note}', [NoteController::class, 'show']);
    Route::patch('/notes/{note}', [NoteController::class, 'update']);
    Route::delete('/notes/{note}', [NoteController::class, 'destroy']);
    Route::patch('/notes/{note}/pin', [NoteController::class, 'pin']);
    Route::put('/notes/{note}/labels', [NoteController::class, 'syncLabels']);

    Route::put('/notes/{note}/protection', [NoteProtectionController::class, 'protect']);
    Route::post('/notes/{note}/unlock', [NoteProtectionController::class, 'unlock'])->middleware('throttle:note-unlock');
    Route::post('/notes/{note}/lock', [NoteProtectionController::class, 'lock']);
    Route::delete('/notes/{note}/protection', [NoteProtectionController::class, 'remove']);

    Route::get('/notes/{note}/shares', [NoteShareController::class, 'index']);
    Route::post('/notes/{note}/shares', [NoteShareController::class, 'store']);
    Route::patch('/note-shares/{share}', [NoteShareController::class, 'update']);
    Route::delete('/note-shares/{share}', [NoteShareController::class, 'destroy']);

    Route::get('/labels', [LabelController::class, 'index']);
    Route::post('/labels', [LabelController::class, 'store']);
    Route::patch('/labels/{label}', [LabelController::class, 'update']);
    Route::delete('/labels/{label}', [LabelController::class, 'destroy']);

    Route::get('/notes/{note}/attachments', [AttachmentController::class, 'index']);
    Route::post('/notes/{note}/attachments', [AttachmentController::class, 'store']);
    Route::get('/attachments/{attachment}/content', [AttachmentController::class, 'content']);
    Route::get('/attachments/{attachment}/download', [AttachmentController::class, 'download']);
    Route::delete('/attachments/{attachment}', [AttachmentController::class, 'destroy']);
});
