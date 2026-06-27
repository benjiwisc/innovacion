<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publicaciones', function (Blueprint $table) {
            $table->foreignId('adulto_mayor_id')
                ->after('user_id')
                ->constrained('users')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('publicaciones', function (Blueprint $table) {
            $table->dropForeign(['adulto_mayor_id']);
            $table->dropColumn('adulto_mayor_id');
        });
    }
};
