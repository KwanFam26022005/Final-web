<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\DatabaseTestCase;

class MySqlFoundationTest extends DatabaseTestCase
{
    /**
     * Verify MySQL 8.x foundation, database isolation, utf8mb4 charset, and collation.
     */
    public function test_mysql_foundation_connection_and_metadata(): void
    {
        // 1. Connection driver is mysql
        $connection = DB::connection();
        $this->assertSame('mysql', $connection->getDriverName());

        // 2. Active database is final_web_test
        $activeDatabase = $connection->getDatabaseName();
        $this->assertSame('final_web_test', $activeDatabase);

        // 3. Server reports MySQL 8.x
        $versionResult = DB::selectOne('SELECT VERSION() as version');
        $version = (string) $versionResult->version;
        $this->assertStringStartsWith('8.', $version);

        // 4. Database character set is utf8mb4 and collation is utf8mb4_unicode_ci
        $schemaResult = DB::selectOne(
            'SELECT DEFAULT_CHARACTER_SET_NAME as charset, DEFAULT_COLLATION_NAME as collation FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
            ['final_web_test']
        );

        $this->assertNotNull($schemaResult);
        $this->assertSame('utf8mb4', $schemaResult->charset);
        $this->assertSame('utf8mb4_unicode_ci', $schemaResult->collation);

        // 5. Verify storage engine capability includes InnoDB
        $engineResult = DB::selectOne(
            "SELECT SUPPORT FROM information_schema.ENGINES WHERE ENGINE = 'InnoDB'"
        );
        $this->assertNotNull($engineResult);
        $this->assertContains($engineResult->SUPPORT, ['YES', 'DEFAULT']);
    }
}
