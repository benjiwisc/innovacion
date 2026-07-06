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

    public function verificarAlarma(Request $request)
    {
        $request->validate([
            'codigo_adulto' => 'required|string'
        ]);

        $user = \App\Models\User::where('codigo_vinculacion', $request->input('codigo_adulto'))
            ->where('rol', 'adulto_mayor')
            ->first();

        if (!$user) {
            return response()->json([
                'alerta' => false,
                'message' => 'Código de vinculación inválido o no corresponde a un adulto mayor.'
            ], 404);
        }

        $now = \Carbon\Carbon::now('America/Santiago');
        $diaSemana = $now->locale('es')->dayName; // lunes, martes, etc.
        $diaSemana = \Illuminate\Support\Str::ucfirst($diaSemana); // Lunes, Martes, etc.

        // Obtener todos los horarios para hoy
        $horarios = \App\Models\MedicamentoHorario::where('adulto_mayor_id', $user->id)
            ->where('dia_semana', $diaSemana)
            ->get();

        foreach ($horarios as $horario) {
            // El horario es "08:00". Creamos un objeto Carbon para hoy a esa hora
            $horaAlarma = \Carbon\Carbon::parse($horario->hora, 'America/Santiago');
            
            // Si la hora de la alarma ya pasó (o es ahora), pero está dentro de un rango de 60 minutos
            if ($now->greaterThanOrEqualTo($horaAlarma) && $now->diffInMinutes($horaAlarma) <= 60) {
                // Verificar si ya se registró un estado hoy después de la hora de esta alarma (margen de 2 minutos)
                $yaRegistrado = \App\Models\PastilleroEstado::where('codigo_adulto', $user->codigo_vinculacion)
                    ->where('created_at', '>=', $horaAlarma->copy()->subMinutes(2))
                    ->exists();

                if (!$yaRegistrado) {
                    return response()->json([
                        'alerta' => true,
                        'medicamento' => $horario->nombre_medicamento,
                        'dosis' => $horario->dosis,
                        'hora_programada' => $horario->hora
                    ]);
                }
            }
        }

        return response()->json([
            'alerta' => false,
            'diagnostico' => [
                'hora_servidor' => $now->toDateTimeString(),
                'dia_semana' => $diaSemana,
                'codigo' => $user->codigo_vinculacion,
                'horarios_hoy' => $horarios->map(function($h) use ($now) {
                    $horaAlarma = \Carbon\Carbon::parse($h->hora, 'America/Santiago');
                    return [
                        'medicamento' => $h->nombre_medicamento,
                        'hora' => $h->hora,
                        'ya_paso' => $now->greaterThanOrEqualTo($horaAlarma),
                        'diff_minutos' => $now->diffInMinutes($horaAlarma),
                    ];
                })
            ]
        ]);
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
            $horaProgramada = Carbon::parse($horario->hora)
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