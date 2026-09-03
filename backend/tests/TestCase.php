<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Safety guard ensuring database operations only target an isolated test database.
     */
    protected function assertDatabaseSafety(): void
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($database === 'final_web' || ! str_ends_with((string) $database, '_test')) {
            throw new RuntimeException(
                "Database safety violation: Refusing to run tests against active database '{$database}'. Active database must be an isolated test database (e.g., 'final_web_test')."
            );
        }
    }
}
