<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PastilleroController;


Route::post('/pastillero-status', [PastilleroController::class, 'actualizarEstado']);
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
