<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\PastilleroEstado;
use App\Models\Vinculo;

class PastilleroController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $codigo = null;

        if ($user->rol === 'adulto_mayor') {
            $codigo = $user->codigo_vinculacion;
        } else {
            
            $vinculo = Vinculo::with('adultoMayor')
                ->where('vinculado_id', $user->id)
                ->first();
            $codigo = $vinculo?->adultoMayor?->codigo_vinculacion;
        }

        if (!$codigo) {
            return response()->json([
                'message' => 'No estás vinculado a ningún adulto mayor.'
            ], 403);
        }

        $estados = PastilleroEstado::where('codigo_adulto', $codigo)
            ->latest()
            ->take(20)
            ->get();

        return response()->json($estados);
    }
    
    public function actualizarEstado(Request $request)
    {
        $request->validate([
            'dispositivo_id' => 'required|string',
            'estado' => 'required|string|in:TOMADA,OLVIDADA,TOMADA_TARDE',
            'codigo_adulto' => 'required|string'
        ]);
        $dispositivo = $request->input('dispositivo_id');
        $estado = $request->input('estado');

        $registro = PastilleroEstado::create([
            'dispositivo_id' => $request->input('dispositivo_id'),
            'estado' => $request->input('estado'),
            'codigo_adulto' => $request->input('codigo_adulto')
        ]);
        
        Log::info("Pastillero {$dispositivo} reporta estado: {$estado}");
        return response()->json([
            'success' => true,
            'message' => 'Estado recibido exitosamente.',
            'device' => $dispositivo,
            'status' => $estado
        ], 200);
    }
}