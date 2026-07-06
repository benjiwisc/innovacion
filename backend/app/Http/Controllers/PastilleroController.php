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
use Illuminate\Support\Str;

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

        // Retornamos los estados incluyendo la relación del medicamento para el HomeScreen
        $estados = PastilleroEstado::where('codigo_adulto', $codigo)
            ->with('medicamento')
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
        $codigoAdulto = $request->input('codigo_adulto');

        // Intentar obtener el ID del medicamento en este rango horario para asociarlo en la BD
        $medicamentoId = $this->obtenerMedicamentoIdActual($codigoAdulto);

        $registro = PastilleroEstado::create([
            'dispositivo_id' => $dispositivo,
            'estado' => $estado,
            'codigo_adulto' => $codigoAdulto,
            'confirmar_presencial' => false,
            'medicamento_id' => $medicamentoId // Asociado dinámicamente si calza el horario
        ]);

        if ($estado === 'TOMADA') {
            $this->crearNotificacionDeMedicamento($codigoAdulto, $dispositivo);
        }
        
        Log::info("Pastillero {$dispositivo} reporta estado: {$estado} para el medicamento ID: " . ($medicamentoId ?? 'Ninguno'));
        
        return response()->json([
            'success' => true,
            'message' => 'Estado recibido exitosamente.',
            'device' => $dispositivo,
            'status' => $estado
        ], 200);
    }

    /**
     * 🤝 Procesa la confirmación presencial enviada por el Cuidador/Familiar desde React Native
     */
    public function confirmarPresencial(Request $request)
    {
        $request->validate([
            'medicamento_id' => 'required|integer|exists:medicamento_horarios,id',
        ]);

        $user = $request->user();
        $medicamentoId = $request->input('medicamento_id');

        $codigo = null;
        if ($user->rol === 'adulto_mayor') {
            $codigo = $user->codigo_vinculacion;
        } else {
            $vinculo = Vinculo::with('adultoMayor')->where('vinculado_id', $user->id)->first();
            $codigo = $vinculo?->adultoMayor?->codigo_vinculacion;
        }

        if (!$codigo) {
            return response()->json(['message' => 'No asociado a ningún adulto mayor.'], 403);
        }

        // Buscar si ya hay un registro de este medicamento generado hoy por el Arduino
        $registroHoy = PastilleroEstado::where('codigo_adulto', $codigo)
            ->where('medicamento_id', $medicamentoId)
            ->whereDate('created_at', Carbon::today())
            ->latest()
            ->first();

        if ($registroHoy) {
            // Si el Arduino lo marcó como OLVIDADA o PENDIENTE, lo corregimos a exitoso y presencial
            $registroHoy->update([
                'estado' => 'TOMADA',
                'confirmar_presencial' => true
            ]);
        } else {
            // Si el Arduino no reportó nada aún, generamos la fila de respaldo presencial
            PastilleroEstado::create([
                'dispositivo_id' => 'APP-MANUAL',
                'estado' => 'TOMADA',
                'codigo_adulto' => $codigo,
                'confirmar_presencial' => true,
                'medicamento_id' => $medicamentoId
            ]);
        }

        // Forzar la creación de la notificación en el foro indicando el éxito
        $this->crearNotificacionDeMedicamento($codigo, 'APP-MANUAL');

        return response()->json([
            'success' => true,
            'message' => 'Toma presencial sincronizada correctamente.'
        ], 200);
    }

    /**
     * 🔔 MANTENIDO INTACTO: El Arduino lee este método exactamente igual para sonar o callarse.
     */
    public function verificarAlarma(Request $request)
    {
        $request->validate([
            'codigo_adulto' => 'required|string'
        ]);

        $user = User::where('codigo_vinculacion', $request->input('codigo_adulto'))
            ->where('rol', 'adulto_mayor')
            ->first();

        if (!$user) {
            return response()->json([
                'alerta' => false,
                'message' => 'Código de vinculación inválido o no corresponde a un adulto mayor.'
            ], 404);
        }

        $now = Carbon::now('America/Santiago');
        $diaSemana = Str::ucfirst($now->locale('es')->dayName);

        $horarios = MedicamentoHorario::where('adulto_mayor_id', $user->id)
            ->where('dia_semana', $diaSemana)
            ->get();

        foreach ($horarios as $horario) {
            $horaAlarma = Carbon::parse($horario->hora, 'America/Santiago');
            
            $diffSeconds = $now->timestamp - $horaAlarma->timestamp;
            if ($diffSeconds >= 0 && $diffSeconds <= 3600) {
                // Sigue buscando por rangos de tiempo creados tal como lo programaste
                $yaRegistrado = PastilleroEstado::where('codigo_adulto', $user->codigo_vinculacion)
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

        return response()->json(['alerta' => false]);
    }

    /**
     * Busca qué medicamento está en el bloque horario actual (Margen 15 minutos)
     */
    private function obtenerMedicamentoIdActual(string $codigoAdulto): ?int
    {
        $adultoMayor = User::where('codigo_vinculacion', $codigoAdulto)->first();
        if (!$adultoMayor) return null;

        $ahora = now();
        $diaSemana = $this->diaSemanaEnEspanol($ahora);

        $horarios = MedicamentoHorario::where('adulto_mayor_id', $adultoMayor->id)
            ->where('dia_semana', $diaSemana)
            ->get();

        foreach ($horarios as $horario) {
            $horaProgramada = Carbon::parse($horario->hora)
                ->setDate($ahora->year, $ahora->month, $ahora->day);

            if (abs($ahora->diffInMinutes($horaProgramada, false)) <= 15) {
                return $horario->id;
            }
        }
        return null;
    }

    private function crearNotificacionDeMedicamento(string $codigoAdulto, string $dispositivo): void
    {
        $adultoMayor = User::where('codigo_vinculacion', $codigoAdulto)->first();
        if (!$adultoMayor) return;

        $ahora = now();
        $diaSemana = $this->diaSemanaEnEspanol($ahora);

        $horarios = MedicamentoHorario::where('adulto_mayor_id', $adultoMayor->id)
            ->where('dia_semana', $diaSemana)
            ->get();

        foreach ($horarios as $horario) {
            $horaProgramada = Carbon::parse($horario->hora)
                ->setDate($ahora->year, $ahora->month, $ahora->day);

            // Ajustado para permitir que notifique tanto en su margen natural de 15m como si fue forzado manualmente
            if ($dispositivo !== 'APP-MANUAL' && abs($ahora->diffInMinutes($horaProgramada, false)) > 15) {
                continue;
            }

            $contenido = $dispositivo === 'APP-MANUAL'
                ? sprintf('Confirmación manual: El medicamento %s (%s) fue verificado presencialmente por su cuidador.', $horario->nombre_medicamento, $horario->dosis)
                : sprintf('Notificacion del pastillero: %s (%s) fue tomada dentro del horario programado de las %s.', $horario->nombre_medicamento, $horario->dosis, $horaProgramada->format('H:i'));

            $yaExiste = Publicacion::where('user_id', $adultoMayor->id)
                ->where('adulto_mayor_id', $adultoMayor->id)
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