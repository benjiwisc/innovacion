<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vinculo;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class RegisteredUserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'email'               => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password'            => ['required', 'confirmed', Rules\Password::defaults()],
            'rol'                 => ['required', 'in:adulto_mayor,familiar,cuidador'],
            'codigo_adulto_mayor' => ['required_if:rol,familiar', 'required_if:rol,cuidador', 'nullable', 'string'],
        ]);

        // Si es familiar o cuidador, verificar que el código existe
        $adultoMayor = null;
        if (in_array($request->rol, ['familiar', 'cuidador'])) {
            $adultoMayor = User::where('codigo_vinculacion', strtoupper($request->codigo_adulto_mayor))
                               ->where('rol', 'adulto_mayor')
                               ->first();

            if (!$adultoMayor) {
                throw ValidationException::withMessages([
                    'codigo_adulto_mayor' => ['El código no corresponde a ningún adulto mayor registrado.'],
                ]);
            }
        }

        // Crear usuario
        $userData = [
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->string('password')),
            'rol'      => $request->rol,
        ];

        // Si es adulto mayor, generar código de vinculación
        if ($request->rol === 'adulto_mayor') {
            $userData['codigo_vinculacion'] = User::generarCodigo();
        }

        $user = User::create($userData);

        // Crear vínculo si aplica
        if ($adultoMayor) {
            Vinculo::create([
                'adulto_mayor_id' => $adultoMayor->id,
                'vinculado_id'    => $user->id,
                'tipo'            => $request->rol,
            ]);
        }

        event(new Registered($user));

        $token = $user->createToken('expo-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'                  => $user->id,
                'name'                => $user->name,
                'email'               => $user->email,
                'rol'                 => $user->rol,
                'codigo_vinculacion'  => $user->codigo_vinculacion,
            ],
        ], 201);
    }
}