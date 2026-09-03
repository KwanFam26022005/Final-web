<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    /**
     * Test the GET /api/health endpoint returns 200 OK and expected JSON payload.
     */
    public function test_health_endpoint_returns_ok_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertExactJson([
                'status' => 'ok',
                'service' => 'backend',
            ]);
    }
}
