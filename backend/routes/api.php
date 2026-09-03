<?php

use App\Http\Controllers\Auth\AuthController;
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
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});
