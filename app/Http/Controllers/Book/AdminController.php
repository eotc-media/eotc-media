<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbApprovalStatus;
use App\Models\CbAuthor;
use App\Models\CbBook;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AdminController extends Controller
{
    public function dashboard()
    {
        $total_uploaded_books = CbBook::orderBy('created_at')->get();
        $total_users = User::all();
        return inertia('Book/Admin/Dashboard')->with([
            'total_uploaded_books' => $total_uploaded_books,
            'total_users' => $total_users
        ]);
    }

    public function new_books()
    {
        $books = CbBook::where('approval_status_id', 1)->with(['languages', 'categories', 'sub_categories', 'approval_status'])->get();
        $authors = CbAuthor::orderBy('name')->get();
        return inertia('Book/Admin/Book/New')->with([
            'books' => $books,
            'authors' => $authors,
        ]);
    }

    public function accept_book(Request $request, $id)
    {
        Gate::authorize('manage', CbBook::class);

        $request->validate([
            'author_id.*' => 'integer|required'
        ]);
        $book = CbBook::findOrFail($id);
        $book->approval_status_id = CbApprovalStatus::ACCEPTED;
        $book->update();
        $book->authors()->attach($request->author_id);
        return redirect(route('book.admin.books.new'));
    }

    public function decline_book($id)
    {
        Gate::authorize('manage', CbBook::class);

        $book = CbBook::findOrFail($id);
        $book->approval_status_id = CbApprovalStatus::DECLINED;
        $book->update();

        return redirect(route('book.admin.books.new'));
    }
}
