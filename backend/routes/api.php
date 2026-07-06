<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\PastilleroController;
use App\Http\Controllers\ForoController;
use App\Http\Controllers\MedicamentoHorarioController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register');
    Route::post('/login',    [AuthenticatedSessionController::class, 'store'])->name('login');

    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::post('/reset-password',  [NewPasswordController::class, 'store'])->name('password.store');

    Route::post('/pastillero-status', [PastilleroController::class, 'actualizarEstado']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(Request $request) => $request->user());

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::post('/email/verification-notification',
        [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::get('/pastillero', [PastilleroController::class, 'index']);

    Route::get('/foro',                         [ForoController::class, 'index']);
    Route::post('/foro',                        [ForoController::class, 'store']);
    Route::post('/foro/{publicacion}/like',     [ForoController::class, 'toggleLike']);
    Route::post('/foro/{publicacion}/comentar', [ForoController::class, 'comentar']);
    Route::delete('/foro/{publicacion}',        [ForoController::class, 'destroy']);

    Route::get('/medicamentos',                 [MedicamentoHorarioController::class, 'index']);
    Route::post('/medicamentos',                [MedicamentoHorarioController::class, 'store']);
    Route::delete('/medicamentos/{horario}',    [MedicamentoHorarioController::class, 'destroy']);
});
