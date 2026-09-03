<?php

namespace Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
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

    protected function createSafetyBridge(): object
    {
        return new class('test') extends DatabaseTestCase
        {
            public function invokeSafetyCheck(): void
            {
                $this->enforceDatabaseSafety();
            }
        };
    }

    public function test_valid_configuration_passes_safety_check(): void
    {
        $testBridge = $this->createSafetyBridge();

        config([
            'app.env' => 'testing',
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'final_web_test',
        ]);

        $testBridge->invokeSafetyCheck();

        $this->assertSame('testing', config('app.env'));
        $this->assertSame('mysql', config('database.default'));
        $this->assertSame('final_web_test', config('database.connections.mysql.database'));
    }

    public function test_non_testing_app_env_is_rejected(): void
    {
        $testBridge = $this->createSafetyBridge();

        config(['app.env' => 'production']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: APP_ENV must be exactly 'testing'");

        $testBridge->invokeSafetyCheck();
    }

    public function test_non_mysql_connection_is_rejected(): void
    {
        $testBridge = $this->createSafetyBridge();

        config(['database.default' => 'sqlite']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active DB connection must be exactly 'mysql'");

        $testBridge->invokeSafetyCheck();
    }

    public function test_wrong_database_is_rejected(): void
    {
        $testBridge = $this->createSafetyBridge();

        config(['database.connections.mysql.database' => 'final_web']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active database must be exactly 'final_web_test'");

        $testBridge->invokeSafetyCheck();
    }

    public function test_arbitrary_test_suffix_database_is_rejected(): void
    {
        $testBridge = $this->createSafetyBridge();

        config(['database.connections.mysql.database' => 'other_test']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("Database safety violation: Active database must be exactly 'final_web_test'");

        $testBridge->invokeSafetyCheck();
    }

    public function test_safety_guard_executes_in_set_up_traits_before_trait_lifecycle(): void
    {
        $testCase = new class('test') extends DatabaseTestCase
        {
            use RefreshDatabase;

            public bool $refreshDatabaseInvoked = false;

            public function invokeSetUpTraits(): array
            {
                return $this->setUpTraits();
            }

            public function refreshDatabase(): void
            {
                $this->refreshDatabaseInvoked = true;
            }
        };

        // Case A: When database configuration is invalid, setUpTraits() aborts BEFORE parent traits run
        config(['database.connections.mysql.database' => 'final_web']);

        try {
            $testCase->invokeSetUpTraits();
            $this->fail('Expected RuntimeException was not thrown');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString("Database safety violation: Active database must be exactly 'final_web_test'", $e->getMessage());
            $this->assertFalse($testCase->refreshDatabaseInvoked, 'RefreshDatabase was not invoked because safety guard threw first');
        }

        // Case B: When database configuration is valid, setUpTraits() runs guard, passes, and invokes RefreshDatabase
        config(['database.connections.mysql.database' => 'final_web_test']);
        $traits = $testCase->invokeSetUpTraits();

        $this->assertTrue($testCase->refreshDatabaseInvoked, 'RefreshDatabase was invoked by parent trait lifecycle after guard passed');
        $this->assertArrayHasKey(RefreshDatabase::class, $traits);
    }
}
