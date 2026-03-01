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
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('employee_id')->unique();
            $table->string('name');
            $table->enum('sex', ['Male', 'Female', 'Other']);
            $table->string('designation')->nullable();
            $table->string('employment_status');
            $table->string('email')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('degree')->nullable();
            $table->string('course_major')->nullable();
            $table->string('course_minor')->nullable();
            $table->string('ancillary_assignments')->nullable();
            $table->json('unavailable_periods')->nullable();
            $table->json('subject_expertise')->nullable();
            $table->json('grade_level_assignments')->nullable();
            $table->enum('status', ['active', 'retired'])->default('active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
