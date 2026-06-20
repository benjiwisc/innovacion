<?php
use App\Http\Controllers\PastilleroController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', [PastilleroController::class, 'index']);
Route::get('/', function () {
    return view('welcome');
});
