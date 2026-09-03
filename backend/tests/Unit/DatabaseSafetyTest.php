<?php

namespace Tests\Unit;

use RuntimeException;
use Tests\DatabaseTestCase;
use Tests\TestCase;

class DatabaseSafetyTest extends TestCase
{
    public function test_safety_guard_rejects_non_test_database(): void
    {
        $testCase = new class('test') extends DatabaseTestCase
        {
            public function invokeSafetyCheck(): void
            {
                $this->enforceDatabaseSafety();
            }
        };

        // 1. Current config points to final_web_test, safety check passes without exception
        $testCase->invokeSafetyCheck();

        // 2. Temporarily point to development database final_web
        config(['database.connections.mysql.database' => 'final_web']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active database must be exactly 'final_web_test'");

        $testCase->invokeSafetyCheck();
    }
}
