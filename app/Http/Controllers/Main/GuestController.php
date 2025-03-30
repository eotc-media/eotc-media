<?php

namespace App\Http\Controllers\Main;

use App\Http\Controllers\Controller;
use App\Models\ContactUs;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuestController extends Controller
{
    public function index()
    {
        return inertia('Main/Guest/Welcome');
    }

    public function feedback()
    {
        return inertia('Main/Guest/Feedback');
    }

    public function store_feedback(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'body' => 'required|string',
        ]);

        ContactUs::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'body' => $request->body,
        ]);

        return redirect()->route('welcome')->with('success', 'አስተያየትዎ በተሳካ ሁኔታ ተመዝግቧል፤ እናመሰግናለን። / Feedback sent successfully, thank you!');
    }
}
