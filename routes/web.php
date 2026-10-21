<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::get('/', function () {
    return view('welcome');
});

Route::match(['GET', 'POST', 'OPTIONS'], '/export-download', function (Request $request) {
    if ($request->isMethod('OPTIONS')) {
        return response('', 204, [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers' => '*',
        ]);
    }

    $filename = $request->input('filename', 'DepEd_Teacher_Load_Tracker.xlsx');
    $cleanFilename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $filename);
    $contentType = $request->input('contentType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    $base64 = $request->input('base64');
    $content = $request->input('content');

    if (!empty($base64)) {
        $payload = base64_decode($base64);
    } else {
        $payload = $content ?? '';
    }

    return response($payload, 200, [
        'Content-Type' => $contentType,
        'Content-Disposition' => 'attachment; filename="' . $cleanFilename . '"',
        'Content-Length' => strlen($payload),
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Pragma' => 'no-cache',
        'Expires' => '0',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Expose-Headers' => 'Content-Disposition',
    ]);
});

