<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbApprovalStatus;
use App\Models\CbBook;
use App\Models\CbBookComment;
use App\Models\CbCopyrightReport;
use App\Models\CbLanguage;
use App\Models\CbLike;
use App\Utils\FileUploader;
use App\Utils\ImageUploader;
use App\Utils\SlugGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookController extends Controller
{
    public function dashboard()
    {
        $languages = CbLanguage::with('categories.sub_categories')->get();
        $total_books = CbBook::where('user_id', Auth::id())->count();
        $accepted_books = CbBook::where('user_id', Auth::id())->where('approval_status_id', CbApprovalStatus::ACCEPTED)->count();
        $undecided_books = CbBook::where('user_id', Auth::id())->where('approval_status_id', CbApprovalStatus::SUBMITTED)->count();
        $last_upload = CbBook::where('user_id', Auth::id())->orderBy('created_at', 'desc')->first();
        return inertia('Book/User/Dashboard')->with([
            'languages' => $languages,
            'total_books' => $total_books,
            'accepted_books' => $accepted_books,
            'undecided_books' => $undecided_books,
            'last_upload' => $last_upload,
        ]);
    }

    public function index()
    {
        $books = CbBook::where('user_id', Auth::id())->with(['languages', 'categories', 'sub_categories', 'approval_status'])->paginate(20);
        return inertia('Book/User/Book/Index')->with('books', $books);
    }

    public function create()
    {
        $languages = CbLanguage::with('categories.sub_categories')->get();
        return inertia('Book/User/Book/Create')->with([
            'languages' => $languages,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'string|required',
            'author' => 'string|required',
            'description' => 'nullable',
            'image' => 'required|image|max:10240',
            'file' => 'required|mimes:pdf|max:30720',
        ]);
        $request->validate([
            'language_id.*' => 'integer|required',
            'category_id.*' => 'integer|required',
            'sub_category_id.*' => 'integer|required',
        ]);
        $book = new CbBook($validated);
        $book->user_id = Auth::id();
        $book->slug = SlugGenerator::generateUniqueSlug($request->name, CbBook::class);
        $book->approval_status_id = CbApprovalStatus::SUBMITTED;
        if ($request->hasFile('image')) {
            $image_name_to_save = ImageUploader::upload_book_image($request->file('image'));
            $book->image = $image_name_to_save;
        }
        if ($request->hasFile('file')) {
            $file_name_to_save = FileUploader::upload_book($request->file('file'));
            $book->file = $file_name_to_save;
        }
        $book->save();
        $book->languages()->attach($request->language_id);
        $book->categories()->attach($request->category_id);
        $book->sub_categories()->attach($request->sub_category_id);
        return redirect(route('book.user.books.index'));
    }

    public function toggle_like($id)
    {
        $book = CbBook::findOrFail($id);
        $old_like = $book->likes()->where('user_id', Auth::id())->first();
        if (!$old_like) {
            $like = new CbLike();
            $like->user_id = Auth::id();
            $like->like_status = 1;
            $book->likes()->save($like);
        } else {
            if ($old_like->like_status == 1) {
                $old_like->delete();
            } else {
                $old_like->like_status = 1;
                $old_like->save();
            }
        }
    }

    public function toggle_dislike($id)
    {
        $book = CbBook::findOrFail($id);
        $old_like = $book->likes()->where('user_id', Auth::id())->first();

        if (!$old_like) {
            $like = new CbLike();
            $like->user_id = Auth::id();
            $like->like_status = 0;
            $book->likes()->save($like);
        } else {
            if ($old_like->like_status === 0) {
                $old_like->delete();
            } else {
                $old_like->like_status = 0;
                $old_like->save();
            }
        }
    }

    public function report_copyright(Request $request, $id)
    {
        $old_copyright = CbBook::findOrFail($id)->copyright_reports()->where('user_id', Auth::id())->first();
        if (empty($old_copyright)) {
            $copyright = new CbCopyrightReport();
            $copyright->user_id = Auth::id();
            $copyright->book_id = $id;
            $copyright->description = $request->input('description');
            $copyright->save();
        } else {
            $old_copyright->description = $request->input('description');
            $old_copyright->update();
        }
    }

    public function remove_copyright($id)
    {
        CbBook::findOrFail($id)->copyright_reports()->where('user_id', Auth::id())->delete();
    }

    public function store_comment(Request $request, $id)
    {
        $validated = $request->validate([
            'body' => 'string|required'
        ]);

        $comment = new CbBookComment($validated);
        $comment->user_id = Auth::id();
        $comment->book_id = $id;
        $comment->save();
    }

    public function reply_comment(Request $request, $book_id, $comment_id)
    {
        $validated = $request->validate([
            'body' => 'string|required'
        ]);

        $comment = new CbBookComment($validated);
        $comment->user_id = Auth::id();
        $comment->book_id = $book_id;
        $comment->parent_id = $comment_id;
        $comment->save();
    }
}
