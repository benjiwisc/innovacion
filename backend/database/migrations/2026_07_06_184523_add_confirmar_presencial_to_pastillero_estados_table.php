<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pastillero_estados', function (Blueprint $table) {
            // Agrega la columna booleana (puedes usar after('estado') para ordenarla)
            $table->boolean('confirmar_presencial')->default(false)->after('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pastillero_estados', function (Blueprint $table) {
            // Elimina la columna si se hace un rollback
            $table->dropColumn('confirmar_presencial');
        });
    }
};