<?php

namespace App\Http\Controllers;

use App\Models\Publicacion;
use App\Models\Like;
use App\Models\Comentario;
use App\Models\Vinculo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ForoController extends Controller
{
    // Obtener el ID del adulto mayor según el rol
    private function getAdultoMayorId(Request $request): int|null
    {
        $user = $request->user();

        if ($user->rol === 'adulto_mayor') {
            return $user->id;
        }

        // Familiar o cuidador → buscar su vínculo
        $vinculo = Vinculo::where('vinculado_id', $user->id)->first();
        return $vinculo?->adulto_mayor_id;
    }

    public function index(Request $request): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);

        if (!$adultoMayorId) {
            return response()->json(['message' => 'No estás vinculado a ningún adulto mayor'], 403);
        }

        $publicaciones = Publicacion::with(['user:id,name,rol', 'comentarios.user:id,name'])
            ->withCount('likes')
            ->where('adulto_mayor_id', $adultoMayorId)
            ->latest()
            ->paginate(10);

        $userId = $request->user()->id;
        $publicaciones->getCollection()->transform(function ($p) use ($userId) {
            $p->yo_di_like = $p->tieneLikeDe($userId);
            return $p;
        });

        return response()->json($publicaciones);
    }

    public function store(Request $request): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);

        if (!$adultoMayorId) {
            return response()->json(['message' => 'No estás vinculado a ningún adulto mayor'], 403);
        }

        $request->validate([
            'contenido'  => ['required', 'string', 'max:1000'],
            'tipo'       => ['required', 'in:normal,cita'],
            'cita_fecha' => ['nullable', 'date'],
            'cita_lugar' => ['nullable', 'string', 'max:255'],
            'foto'       => ['nullable', 'file', 'mimes:jpeg,jpg,png,webp', 'max:10240']
        ]);


        if ($request->tipo === 'cita' && !$request->cita_fecha) {
            return response()->json([
                'message' => 'La fecha de la cita es requerida',
                'errors'  => ['cita_fecha' => ['La fecha es requerida para citas']]
            ], 422);
        }

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('publicaciones', 'public');
        }

        $publicacion = Publicacion::create([
            'user_id'        => $request->user()->id,
            'adulto_mayor_id'=> $adultoMayorId,
            'contenido'      => $request->contenido,
            'foto'           => $fotoPath,
            'tipo'           => $request->tipo,
            'cita_fecha'     => $request->cita_fecha,
            'cita_lugar'     => $request->cita_lugar,
        ]);

        $publicacion->load('user:id,name,rol');
        $publicacion->likes_count = 0;
        $publicacion->yo_di_like  = false;

        return response()->json($publicacion, 201);
    }

    public function toggleLike(Request $request, Publicacion $publicacion): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);
        if ($publicacion->adulto_mayor_id !== $adultoMayorId) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $userId = $request->user()->id;
        $like   = Like::where('user_id', $userId)
                      ->where('publicacion_id', $publicacion->id)
                      ->first();

        if ($like) {
            $like->delete();
            $accion = 'quitado';
        } else {
            Like::create(['user_id' => $userId, 'publicacion_id' => $publicacion->id]);
            $accion = 'dado';
        }

        return response()->json([
            'accion'      => $accion,
            'likes_count' => $publicacion->likes()->count(),
        ]);
    }

    public function comentar(Request $request, Publicacion $publicacion): JsonResponse
    {
        $adultoMayorId = $this->getAdultoMayorId($request);
        if ($publicacion->adulto_mayor_id !== $adultoMayorId) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $request->validate([
            'contenido' => ['required', 'string', 'max:500'],
        ]);

        $comentario = Comentario::create([
            'user_id'        => $request->user()->id,
            'publicacion_id' => $publicacion->id,
            'contenido'      => $request->contenido,
        ]);

        $comentario->load('user:id,name');
        return response()->json($comentario, 201);
    }

    public function destroy(Request $request, Publicacion $publicacion): JsonResponse
    {
        if ($request->user()->id !== $publicacion->user_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if ($publicacion->foto) {
            Storage::disk('public')->delete($publicacion->foto);
        }

        $publicacion->delete();
        return response()->json(['message' => 'Publicación eliminada']);
    }
}