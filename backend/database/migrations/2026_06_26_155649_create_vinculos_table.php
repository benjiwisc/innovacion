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
        Schema::create('vinculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adulto_mayor_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->foreignId('vinculado_id') // familiar o cuidador
                ->constrained('users')
                ->onDelete('cascade');
            $table->enum('tipo', ['familiar', 'cuidador']);
            $table->timestamps();

            $table->unique(['adulto_mayor_id', 'vinculado_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vinculos');
    }
};
