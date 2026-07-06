<?php

namespace App\Http\Controllers;

use App\Models\MedicamentoHorario;
use App\Models\PastilleroEstado;
use App\Models\Publicacion;
use App\Models\User;
use App\Models\Vinculo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        if ($estado === 'TOMADA') {
            $this->crearNotificacionDeMedicamento(
                $request->input('codigo_adulto'),
                $dispositivo
            );
        }
        
        Log::info("Pastillero {$dispositivo} reporta estado: {$estado}");
        return response()->json([
            'success' => true,
            'message' => 'Estado recibido exitosamente.',
            'device' => $dispositivo,
            'status' => $estado
        ], 200);
    }

    private function crearNotificacionDeMedicamento(string $codigoAdulto, string $dispositivo): void
    {
        $adultoMayor = User::where('codigo_vinculacion', $codigoAdulto)->first();

        if (!$adultoMayor) {
            Log::warning("Pastillero {$dispositivo} reporto un codigo_adulto sin usuario asociado: {$codigoAdulto}");
            return;
        }

        $ahora = now();
        $diaSemana = $this->diaSemanaEnEspanol($ahora);

        $horarios = MedicamentoHorario::where('adulto_mayor_id', $adultoMayor->id)
            ->where('dia_semana', $diaSemana)
            ->get();

        foreach ($horarios as $horario) {
            $horaProgramada = Carbon::createFromFormat('H:i', $horario->hora)
                ->setDate($ahora->year, $ahora->month, $ahora->day);

            if (abs($ahora->diffInMinutes($horaProgramada, false)) > 15) {
                continue;
            }

            $contenido = sprintf(
                'Notificacion del pastillero: %s (%s) fue tomada dentro del horario programado de las %s.',
                $horario->nombre_medicamento,
                $horario->dosis,
                $horaProgramada->format('H:i')
            );

            $yaExiste = Publicacion::where('user_id', $adultoMayor->id)
                ->where('adulto_mayor_id', $adultoMayor->id)
                ->where('tipo', 'normal')
                ->where('contenido', $contenido)
                ->whereDate('created_at', $ahora->toDateString())
                ->exists();

            if ($yaExiste) {
                continue;
            }

            Publicacion::create([
                'user_id' => $adultoMayor->id,
                'adulto_mayor_id' => $adultoMayor->id,
                'contenido' => $contenido,
                'tipo' => 'normal',
            ]);

            Log::info("Notificacion creada en el foro para {$adultoMayor->id} desde {$dispositivo} por el horario {$horario->id}");
        }
    }

    private function diaSemanaEnEspanol(Carbon $fecha): string
    {
        return match ($fecha->dayOfWeek) {
            Carbon::MONDAY => 'Lunes',
            Carbon::TUESDAY => 'Martes',
            Carbon::WEDNESDAY => 'Miércoles',
            Carbon::THURSDAY => 'Jueves',
            Carbon::FRIDAY => 'Viernes',
            Carbon::SATURDAY => 'Sábado',
            Carbon::SUNDAY => 'Domingo',
        };
    }
}