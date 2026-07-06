<?php

namespace App\Http\Controllers;

use App\Models\MedicamentoHorario;
use App\Models\Vinculo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MedicamentoHorarioController extends Controller
{
    /**
     * Obtener el ID del adulto mayor según el rol del usuario autenticado.
     */
    private function getAdultoMayorId(Request $request): int|null
    {
        $user = $request->user();

        if ($user->rol === 'adulto_mayor') {
            return $user->id;
        }

        // Familiar o cuidador → buscar su vínculo
        $vinculo = Vinculo::where('vinculado_id', $user->id)->first();
        return $vinculo?->adulto_mayor_id;
    }

    /**
     * Listar todos los horarios del adulto mayor asociado.
     */
    public function index(Request $request): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);

        if (!$adultoMayorId) {
            return response()->json(['message' => 'No estás vinculado a ningún adulto mayor'], 403);
        }

        $horarios = MedicamentoHorario::where('adulto_mayor_id', $adultoMayorId)
            ->orderByRaw("CASE dia_semana 
                WHEN 'Lunes' THEN 1 
                WHEN 'Martes' THEN 2 
                WHEN 'Miércoles' THEN 3 
                WHEN 'Jueves' THEN 4 
                WHEN 'Viernes' THEN 5 
                WHEN 'Sábado' THEN 6 
                WHEN 'Domingo' THEN 7 
                ELSE 8 
            END")
            ->orderBy('hora')
            ->get();

        return response()->json($horarios);
    }

    /**
     * Guardar un nuevo horario de medicamento.
     */
    public function store(Request $request): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);

        if (!$adultoMayorId) {
            return response()->json(['message' => 'No estás vinculado a ningún adulto mayor'], 403);
        }

        $request->validate([
            'nombre_medicamento' => ['required', 'string', 'max:255'],
            'dosis'              => ['required', 'string', 'max:255'],
            'dia_semana'         => ['required', 'string', 'in:Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo'],
            'hora'               => ['required', 'date_format:H:i'],
        ]);

        $horario = MedicamentoHorario::create([
            'adulto_mayor_id'    => $adultoMayorId,
            'nombre_medicamento' => $request->nombre_medicamento,
            'dosis'              => $request->dosis,
            'dia_semana'         => $request->dia_semana,
            'hora'               => $request->hora,
        ]);

        return response()->json($horario, 201);
    }

    /**
     * Eliminar un horario de medicamento.
     */
    public function destroy(Request $request, MedicamentoHorario $horario): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);

        if (!$adultoMayorId || $horario->adulto_mayor_id !== $adultoMayorId) {
            return response()->json(['message' => 'No autorizado o no coincide con tu adulto mayor vinculado'], 403);
        }

        $horario->delete();

        return response()->json(['message' => 'Horario de medicamento eliminado exitosamente']);
    }
}
