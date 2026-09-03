<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Mockery;
use PDOException;
use Tests\DatabaseTestCase;

class DatabaseHealthEndpointTest extends DatabaseTestCase
{
    /**
     * Test GET /api/health/database returns 200 OK and safe exact JSON payload.
     */
    public function test_database_health_endpoint_returns_ok_status(): void
    {
        $response = $this->getJson('/api/health/database');

        $response->assertStatus(200)
            ->assertExactJson([
                'status' => 'ok',
                'service' => 'database',
            ]);
    }

    /**
     * Test GET /api/health/database returns 503 and safe exact JSON when database connection fails.
     */
    public function test_database_health_endpoint_returns_503_on_database_failure(): void
    {
        $connectionMock = Mockery::mock();
        $connectionMock->shouldReceive('select')
            ->once()
            ->with('SELECT 1')
            ->andThrow(new PDOException('SQLSTATE[HY000] [2002] Connection refused (sensitive_db_credentials)'));

        DB::shouldReceive('connection')
            ->once()
            ->andReturn($connectionMock);

        $response = $this->getJson('/api/health/database');

        $response->assertStatus(503)
            ->assertExactJson([
                'status' => 'unavailable',
                'service' => 'database',
            ]);

        $content = (string) $response->getContent();
        $this->assertStringNotContainsString('Connection refused', $content);
        $this->assertStringNotContainsString('SQLSTATE', $content);
        $this->assertStringNotContainsString('sensitive_db_credentials', $content);
    }
}
