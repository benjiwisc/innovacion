<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
