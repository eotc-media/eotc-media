<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbAuthor;
use App\Models\CbBook;
use App\Models\CbLanguage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuestController extends Controller
{
    public function index()
    {
        return redirect(route('book.books.index', [0, 0, 0]));
    }

    public function books($language_slug, $category_slug, $sub_category_slug)
    {
        $languages = CbLanguage::with('categories.sub_categories')->get();

        // Start building the query
        $books = CbBook::where('approval_status_id', 2)
            ->with(['languages', 'categories', 'sub_categories', 'authors'])
            ->withCount(['likes', 'comments'])
            ->orderBy('created_at', 'DESC');

        // Apply filters based on the provided slugs
        if ($language_slug != 0) {
            $books->whereHas('languages', function ($query) use ($language_slug) {
                $query->where('slug', $language_slug);
            });
        }

        if ($category_slug != 0) {
            $books->whereHas('categories', function ($query) use ($category_slug) {
                $query->where('slug', $category_slug);
            });
        }

        if ($sub_category_slug != 0) {
            $books->whereHas('sub_categories', function ($query) use ($sub_category_slug) {
                $query->where('slug', $sub_category_slug);
            });
        }

        // Paginate the results
        $books = $books->paginate(24);

        return inertia('Book/Guest/Book/Index')->with([
            'books' => $books,
            'languages' => $languages,
            'language_slug' => $language_slug,
            'category_slug' => $category_slug,
            'sub_category_slug' => $sub_category_slug,
        ]);
    }

    public function view_book($slug)
    {
        // Fetch the book using the slug
        $book = CbBook::with([
            'user',
            'languages',
            'categories',
            'sub_categories',
            'authors',
            'comments' => function ($query) {
                $query->orderBy('created_at', 'desc')
                    ->with([
                        'user',
                        'replies' => function ($query) {
                            $query->orderBy('created_at', 'desc')
                                ->with('user');
                        }
                    ]);
            }
        ])->where('slug', $slug)->firstOrFail();

        // Use the existing $book instance to avoid redundant queries
        $likes_count = $book->likes()->where('like_status', 1)->count();

        // Check if the user is authenticated
        $user_id = Auth::id();

        if ($user_id) {
            $has_liked = $book->likes()->where([
                'user_id' => $user_id,
                'like_status' => 1
            ])->exists();

            $has_disliked = $book->likes()->where([
                'user_id' => $user_id,
                'like_status' => 0
            ])->exists();

            $has_copyright_report = $book->copyright_reports()
                ->where('user_id', $user_id)
                ->exists();
        } else {
            $has_liked = false;
            $has_disliked = false;
            $has_copyright_report = false;
        }

        // Count the total number of copyright reports
        $copyright_reports_count = $book->copyright_reports()->count();

        return inertia('Book/Guest/Book/Show')->with([
            'book' => $book,
            'likes_count' => $likes_count,
            'has_liked' => $has_liked,
            'has_disliked' => $has_disliked,
            'has_copyright_report' => $has_copyright_report,
            'copyright_reports_count' => $copyright_reports_count,
        ]);
    }

    public function author_books($slug)
    {
        // Fetch the author using the slug
        $author = CbAuthor::where('slug', $slug)->firstOrFail();

        // Fetch languages with related categories and sub-categories
        $languages = CbLanguage::with('categories.sub_categories')->get();

        // Fetch all books associated with the author without pagination
        $books = $author->books()
            ->where('approval_status_id', 2)
            ->with(['languages', 'categories', 'sub_categories'])
            ->withCount(['likes', 'comments'])
            ->get();

        return inertia('Book/Guest/Book/BooksByAuthor')->with([
            'author'    => $author,
            'books'     => $books,
            'languages' => $languages,
        ]);
    }
}
