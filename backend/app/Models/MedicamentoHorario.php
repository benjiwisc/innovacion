<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicamentoHorario extends Model
{
    protected $table = 'medicamento_horarios';

    protected $fillable = [
        'adulto_mayor_id',
        'nombre_medicamento',
        'dosis',
        'dia_semana',
        'hora',
    ];

    public function adultoMayor()
    {
        return $this->belongsTo(User::class, 'adulto_mayor_id');
    }

    public function pastilleroEstados(): HasMany
    {
        return $this->hasMany(PastilleroEstado::class, 'medicamento_id');
    }
}
