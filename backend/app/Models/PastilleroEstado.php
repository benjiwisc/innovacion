<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PastilleroEstado extends Model
{
    protected $fillable = [
        'dispositivo_id',
        'estado',
        'codigo_adulto',
        'confirmar_presencial',
        'medicamento_id'
    ];

     public function medicamento(): BelongsTo
    {
        // Enlazamos con el modelo MedicamentoHorario usando la llave 'medicamento_id'
        return $this->belongsTo(MedicamentoHorario::class, 'medicamento_id');
    }
}
