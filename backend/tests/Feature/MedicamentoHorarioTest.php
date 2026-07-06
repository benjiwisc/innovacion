<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\MedicamentoHorario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MedicamentoHorarioTest extends TestCase
{
    use RefreshDatabase;

    public function test_adulto_mayor_can_manage_medicamento_horarios(): void
    {
        // Crear un adulto mayor
        $adulto = User::factory()->create([
            'rol' => 'adulto_mayor',
            'codigo_vinculacion' => 'ADULTO12',
        ]);

        // Autenticar mediante Sanctum
        Sanctum::actingAs($adulto);

        // Crear un horario de medicamento
        $payload = [
            'nombre_medicamento' => 'Paracetamol',
            'dosis' => '1 tableta',
            'dia_semana' => 'Lunes',
            'hora' => '08:00',
        ];

        $response = $this->postJson('/api/medicamentos', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'nombre_medicamento' => 'Paracetamol',
                'dosis' => '1 tableta',
                'dia_semana' => 'Lunes',
                'hora' => '08:00',
            ]);

        $this->assertDatabaseHas('medicamento_horarios', [
            'adulto_mayor_id' => $adulto->id,
            'nombre_medicamento' => 'Paracetamol',
        ]);

        // Listar los horarios
        $responseList = $this->getJson('/api/medicamentos');
        $responseList->assertStatus(200)
            ->assertJsonCount(1);

        $horarioId = $responseList->json()[0]['id'];

        // Eliminar el horario
        $responseDelete = $this->deleteJson("/api/medicamentos/{$horarioId}");
        $responseDelete->assertStatus(200);

        $this->assertDatabaseMissing('medicamento_horarios', [
            'id' => $horarioId,
        ]);
    }
}
