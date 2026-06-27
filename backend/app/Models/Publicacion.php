<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Publicacion extends Model
{
    protected $table = 'publicaciones';
    
    protected $fillable = [
        'user_id',
        'adulto_mayor_id',
        'contenido',
        'foto',
        'tipo',
        'cita_fecha',
        'cita_lugar',
    ];

    protected $casts = [
        'cita_fecha' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function comentarios()
    {
        return $this->hasMany(Comentario::class);
    }

    public function tieneLikeDe($userId)
    {
        return $this->likes()->where('user_id', $userId)->exists();
    }
}
