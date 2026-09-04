<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false)->after('content');
            $table->index(['user_id', 'is_pinned', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_pinned', 'updated_at']);
            $table->dropColumn('is_pinned');
        });
    }
};
