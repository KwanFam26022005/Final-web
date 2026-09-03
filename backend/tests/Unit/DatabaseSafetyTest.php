<?php

namespace Tests\Unit;

use RuntimeException;
use Tests\DatabaseTestCase;
use Tests\TestCase;

class DatabaseSafetyTest extends TestCase
{
    protected function tearDown(): void
    {
        // Restore deterministic test configuration after each test case
        config([
            'app.env' => 'testing',
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'final_web_test',
        ]);

        parent::tearDown();
    }

    public function test_valid_configuration_passes_safety_check(): void
    {
        $testCase = new class('test') extends DatabaseTestCase {};

        config([
            'app.env' => 'testing',
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'final_web_test',
        ]);

        $testCase->enforceDatabaseSafety();
        $this->assertTrue(true, 'Safety check passed under valid testing configuration');
    }

    public function test_non_testing_app_env_is_rejected(): void
    {
        $testCase = new class('test') extends DatabaseTestCase {};

        config(['app.env' => 'production']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: APP_ENV must be exactly 'testing'");

        $testCase->enforceDatabaseSafety();
    }

    public function test_non_mysql_connection_is_rejected(): void
    {
        $testCase = new class('test') extends DatabaseTestCase {};

        config(['database.default' => 'sqlite']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active DB connection must be exactly 'mysql'");

        $testCase->enforceDatabaseSafety();
    }

    public function test_wrong_database_is_rejected(): void
    {
        $testCase = new class('test') extends DatabaseTestCase {};

        config(['database.connections.mysql.database' => 'final_web']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active database must be exactly 'final_web_test'");

        $testCase->enforceDatabaseSafety();
    }

    public function test_arbitrary_test_suffix_database_is_rejected(): void
    {
        $testCase = new class('test') extends DatabaseTestCase {};

        config(['database.connections.mysql.database' => 'other_test']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active database must be exactly 'final_web_test'");

        $testCase->enforceDatabaseSafety();
    }

    public function test_safety_guard_executes_in_set_up_traits_before_trait_lifecycle(): void
    {
        $testCase = new class('test') extends DatabaseTestCase
        {
            public bool $traitBooted = false;

            public function invokeSetUpTraits(): array
            {
                return $this->setUpTraits();
            }

            public function refreshDatabase(): void
            {
                $this->traitBooted = true;
            }
        };

        // Case A: When database configuration is invalid, setUpTraits() aborts BEFORE parent traits run
        config(['database.connections.mysql.database' => 'final_web']);

        try {
            $testCase->invokeSetUpTraits();
            $this->fail('Expected RuntimeException was not thrown');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString("Database safety violation: Active database must be exactly 'final_web_test'", $e->getMessage());
            $this->assertFalse($testCase->traitBooted, 'Database trait was not executed because safety guard threw first');
        }

        // Case B: When database configuration is valid, setUpTraits() succeeds
        config(['database.connections.mysql.database' => 'final_web_test']);
        $traits = $testCase->invokeSetUpTraits();
        $this->assertIsArray($traits);
    }
}
