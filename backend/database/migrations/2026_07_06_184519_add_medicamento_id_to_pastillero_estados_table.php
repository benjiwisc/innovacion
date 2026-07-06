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
            $table->foreignId('medicamento_id')
                ->after('dispositivo_id')
                ->constrained('medicamento_horarios')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pastillero_estados', function (Blueprint $table) {
            $table->dropForeign(['medicamento_id']);
            $table->dropColumn('medicamento_id');
        });
    }
};