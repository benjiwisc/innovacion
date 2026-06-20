<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\PastilleroEstado;

class PastilleroController extends Controller
{
    public function index()
    {
        $estados = PastilleroEstado::latest()->take(20)->get();
        return view('dashboard', compact('estados'));
    }
    
    public function actualizarEstado(Request $request)
    {
        $request->validate([
            'dispositivo_id' => 'required|string',
            'estado' => 'required|string|in:TOMADA,OLVIDADA,TOMADA_TARDE',
        ]);
        $dispositivo = $request->input('dispositivo_id');
        $estado = $request->input('estado');

        $registro = PastilleroEstado::create([
            'dispositivo_id' => $request->input('dispositivo_id'),
            'estado' => $request->input('estado'),
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