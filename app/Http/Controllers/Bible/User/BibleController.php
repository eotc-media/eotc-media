<?php

namespace App\Http\Controllers\Bible\User;

use App\Http\Controllers\Controller;
use App\Models\BlHighlight;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BibleController extends Controller
{
    public function store_highlight(Request $request)
    {
        foreach ($request->all() as $key => $value) {
            $old_highlight = BlHighlight::where(['user_id' => Auth::id(), 'book_id' => $value['book_id'], 'chapter' => $value['chapter'], 'verse' => $value['verse']])->first();
            if ($old_highlight) {
                $old_highlight->delete();
            }
            if ($value['color'] != '#ffffff') {
                $highlight = new BlHighlight();
                $highlight->user_id = Auth::id();
                $highlight->book_id = $value['book_id'];
                $highlight->chapter = $value['chapter'];
                $highlight->verse = $value['verse'];
                $highlight->color = $value['color'];
                $highlight->save();
            }
        }
    }
}
