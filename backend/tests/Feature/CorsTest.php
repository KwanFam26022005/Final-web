<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsTest extends TestCase
{
    /**
     * Test allowed frontend origin receives Access-Control-Allow-Origin header.
     */
    public function test_allowed_origin_receives_cors_header(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://127.0.0.1:5173',
        ])->getJson('/api/health');

        $response->assertStatus(200);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    }

    /**
     * Test CORS preflight request from allowed origin returns 204 with required headers.
     */
    public function test_cors_preflight_for_allowed_origin(): void
    {
        $response = $this->call('OPTIONS', '/api/health', [], [], [], [
            'HTTP_ORIGIN' => 'http://127.0.0.1:5173',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ]);

        $this->assertContains($response->getStatusCode(), [200, 204]);
        $response->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    }

    /**
     * Test untrusted origin does not receive Access-Control-Allow-Origin header.
     */
    public function test_untrusted_origin_rejected_by_cors(): void
    {
        $response = $this->withHeaders([
            'Origin' => 'http://unauthorized.example.com',
        ])->getJson('/api/health');

        $response->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
