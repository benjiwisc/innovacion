<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PastilleroEstado extends Model
{
    protected $fillable = [
        'dispositivo_id',
        'estado',
        'codigo_adulto'
    ];
}
