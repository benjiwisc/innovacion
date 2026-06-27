<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     * Devuelve un token Bearer para apps móviles (Expo/React Native).
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user  = $request->user();
        $token = $user->createToken('expo-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'                 => $user->id,
                'name'               => $user->name,
                'email'              => $user->email,
                'rol'                => $user->rol,
                'codigo_vinculacion' => $user->codigo_vinculacion,
            ],
        ]);
    }

    /**
     * Destroy an authenticated session (revoca el token actual).
     */
    public function destroy(Request $request): JsonResponse
    {
        // Revoca solo el token con el que se autenticó esta petición
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }
}