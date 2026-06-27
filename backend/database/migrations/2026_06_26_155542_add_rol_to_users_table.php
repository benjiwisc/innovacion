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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('rol', ['adulto_mayor', 'familiar', 'cuidador'])
                ->default('adulto_mayor')
                ->after('email');
            $table->string('codigo_vinculacion', 8)
                ->nullable()
                ->unique()
                ->after('rol');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['rol', 'codigo_vinculacion']);
        });
    }
};
