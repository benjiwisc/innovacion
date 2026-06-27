<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vinculo extends Model
{
    protected $fillable = [
        'adulto_mayor_id',
        'vinculado_id',
        'tipo',
    ];

    public function adultoMayor()
    {
        return $this->belongsTo(User::class, 'adulto_mayor_id');
    }

    public function vinculado()
    {
        return $this->belongsTo(User::class, 'vinculado_id');
    }
}