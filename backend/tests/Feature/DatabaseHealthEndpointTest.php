<?php

namespace Tests\Feature;

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
}
