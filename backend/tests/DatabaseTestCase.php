<?php

namespace Tests;

use RuntimeException;

abstract class DatabaseTestCase extends TestCase
{
    /**
     * Boot testing helper traits with pre-execution database safety enforcement.
     *
     * @return array
     */
    protected function setUpTraits()
    {
        $this->enforceDatabaseSafety();

        return parent::setUpTraits();
    }

    /**
     * Reject execution if APP_ENV != testing, connection != mysql, or database != final_web_test.
     */
    protected function enforceDatabaseSafety(): void
    {
        $appEnv = config('app.env');
        if ($appEnv !== 'testing') {
            throw new RuntimeException(
                "Database safety violation: APP_ENV must be exactly 'testing', but got '{$appEnv}'."
            );
        }

        $connection = config('database.default');
        if ($connection !== 'mysql') {
            throw new RuntimeException(
                "Database safety violation: Active DB connection must be exactly 'mysql', but got '{$connection}'."
            );
        }

        $database = config("database.connections.{$connection}.database");
        if ($database !== 'final_web_test') {
            throw new RuntimeException(
                "Database safety violation: Active database must be exactly 'final_web_test', but got '{$database}'."
            );
        }
    }
}
