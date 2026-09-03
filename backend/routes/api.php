<?php

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
