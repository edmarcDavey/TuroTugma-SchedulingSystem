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
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('name');
            $table->string('grade_level');
            $table->string('theme')->nullable();
            $table->enum('classification', ['regular', 'special'])->nullable(); // For JHS
            $table->string('track')->nullable(); // For SHS
            $table->enum('semester', ['first', 'last'])->nullable();
            $table->boolean('is_editable')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
