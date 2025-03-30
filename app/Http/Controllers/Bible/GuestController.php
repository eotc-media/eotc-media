<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Models\BlAmharic1954Bible;
use App\Models\BlBook;
use App\Models\BlEnglishKjvBible;
use App\Models\BlGreekSeptuagintBible;
use App\Models\BlGreekTextusReceptusBible;
use App\Models\BlHebrewMasoreticBible;
use App\Models\BlHighlight;
use App\Models\BlOromifaBible;
use App\Models\BlSeptuagintBook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class GuestController extends Controller
{
    public function index()
    {
        return redirect(route('bible.show_chapter', ['amharic', '1954', 1, 1]));
    }

    public function show_chapter($language, $version, $book_id, $chapter)
    {
        $old_testament_books = BlBook::where('category_id', 1)->get();
        $new_testament_books = BlBook::where('category_id', 2)->get();

        // Fetch the book by slug and language
        $current_book = BlBook::findOrFail($book_id);

        // Determine the current book name based on the language
        $current_book_name = $current_book->getAttribute(str_replace('-', '_', $language) . '_name');
        $highlights = BlHighlight::where([
            'user_id' => Auth::id(),
            'book_id' => $current_book->id,
            'chapter' => $chapter
        ])->get();

        $dir = 'ltr';
        $selected_verse = request('verse') ?? '';
        $verses = [];
        $chapter_numbers = [];

        if ($language == 'english') {
            if ($version == 'kjv') {
                $verses = BlEnglishKjvBible::where(['book_id' => $current_book->id, 'chapter' => $chapter])->get();
                $chapter_numbers = BlEnglishKjvBible::where('book_id', $current_book->id)->select('chapter')->distinct()
                    ->orderBy('chapter', 'asc')->pluck('chapter');
            }
        } elseif ($language == 'amharic') {
            if ($version == '1954') {
                $verses = BlAmharic1954Bible::where(['book_id' => $current_book->id, 'chapter' => $chapter])->get();
                $chapter_numbers = BlAmharic1954Bible::where('book_id', $current_book->id)->select('chapter')->distinct()
                    ->orderBy('chapter', 'asc')->pluck('chapter');
            }
        } elseif ($language == 'oromifa') {
            if ($version == 'v1') {
                $verses = BlOromifaBible::where(['book_id' => $current_book->id, 'chapter' => $chapter])->get();
                $chapter_numbers = BlOromifaBible::where('book_id', $current_book->id)->select('chapter')->distinct()
                    ->orderBy('chapter', 'asc')->pluck('chapter');
            }
        } elseif ($language == 'hebrew-greek') {
            if ($version == 'masoretic-textus-receptus') {
                if ($current_book->id < 40) {
                    $verses = BlHebrewMasoreticBible::where(['book_id' => $current_book->id, 'chapter' => $chapter])->get();
                    $chapter_numbers = BlHebrewMasoreticBible::where('book_id', $current_book->id)->select('chapter')->distinct()
                        ->orderBy('chapter', 'asc')->pluck('chapter');
                    $dir = 'rtl';
                } else {
                    $verses = BlGreekTextusReceptusBible::where(['book_id' => $current_book->id, 'chapter' => $chapter])->get();
                    $chapter_numbers = BlGreekTextusReceptusBible::where('book_id', $current_book->id)->select('chapter')->distinct()
                        ->orderBy('chapter', 'asc')->pluck('chapter');
                }
            }
        } elseif ($language == 'greek') {
            if ($version == 'septuagint') {
                $old_testament_books = BlSeptuagintBook::where('category_id', 1)->get();
                $new_testament_books = BlSeptuagintBook::where('category_id', 2)->get();
                $current_book = BlSeptuagintBook::findOrFail($book_id);
                $current_book_name = $current_book->greek_name;
                $verses = BlGreekSeptuagintBible::where(['book_id' => $current_book->id, 'chapter' => $chapter])->get();
                $chapter_numbers = BlGreekSeptuagintBible::where('book_id', $current_book->id)->select('chapter')->distinct()
                    ->orderBy('chapter', 'asc')->pluck('chapter');
            }
        }

        foreach ($verses as $verse) {
            $highlight = $highlights->firstWhere('verse', $verse->verse);
            $verse->highlight = $highlight ? $highlight->color : null;
        }

        return inertia('Bible/Guest/Chapter')->with([
            'current_book' => $current_book,
            'current_chapter' => $chapter,
            'current_book_name' => $current_book_name,
            'old_testament_books' => $old_testament_books,
            'new_testament_books' => $new_testament_books,
            'language' => $language,
            'version' => $version,
            'verses' => $verses,
            'chapter_numbers' => $chapter_numbers,
            'dir' => $dir,
            'selected_verse' => $selected_verse
        ]);
    }

    public function search_bible()
    {
        $search = request('search');
        $search_bible_type = request('search_bible_type');
        $search_scope = request('search_scope');
        $current_book_id = request('current_book_id');
        $old_testament_books = BlBook::where('category_id', 1)->get();
        $new_testament_books = BlBook::where('category_id', 2)->get();
        $current_book = BlBook::find($current_book_id);
        $dir = 'ltr';

        if (empty($search)) {
            $verses = [];
        } else {
            $book_ids = null; // Default to no filtering for "whole_bible"
            if ($search_scope === 'old_testament') {
                $book_ids = $old_testament_books->pluck('id')->toArray();
            } elseif ($search_scope === 'new_testament') {
                $book_ids = $new_testament_books->pluck('id')->toArray();
            } elseif ($search_scope === 'current_book') {
                $book_ids = [$current_book_id];
            }

            // Handle search for each Bible type
            if ($search_bible_type == 'english__kjv') {
                $verses = BlEnglishKjvBible::when($book_ids, function ($query, $ids) {
                    return $query->whereIn('book_id', $ids);
                })
                    ->where('text', 'like', '%' . $search . '%')
                    ->with('book')
                    ->get();
            } elseif ($search_bible_type == 'amharic__1954') {
                $verses = BlAmharic1954Bible::when($book_ids, function ($query, $ids) {
                    return $query->whereIn('book_id', $ids);
                })
                    ->where('text', 'like', '%' . $search . '%')
                    ->with('book')
                    ->get();
            } elseif ($search_bible_type == 'oromifa__v1') {
                $verses = BlOromifaBible::when($book_ids, function ($query, $ids) {
                    return $query->whereIn('book_id', $ids);
                })
                    ->where('text', 'like', '%' . $search . '%')
                    ->with('book')
                    ->get();
            } elseif ($search_bible_type == 'hebrew-greek__masoretic-textus-receptus') {
                if ($current_book_id < 40) {
                    $verses = BlHebrewMasoreticBible::when($book_ids, function ($query, $ids) {
                        return $query->whereIn('book_id', $ids);
                    })
                        ->where('text', 'like', '%' . $search . '%')
                        ->with('book')
                        ->get();
                } else {
                    $verses = BlGreekTextusReceptusBible::when($book_ids, function ($query, $ids) {
                        return $query->whereIn('book_id', $ids);
                    })
                        ->where('text', 'like', '%' . $search . '%')
                        ->with('book')
                        ->get();
                }
            } elseif ($search_bible_type == 'greek__septuagint') {
                $old_testament_books = BlSeptuagintBook::where('category_id', 1)->get();
                $new_testament_books = BlSeptuagintBook::where('category_id', 2)->get();
                $verses = BlGreekSeptuagintBible::when($book_ids, function ($query, $ids) {
                    return $query->whereIn('book_id', $ids);
                })
                    ->where('text', 'like', '%' . $search . '%')
                    ->with('book')
                    ->get();
            } else {
                $verses = [];
            }
        }

        return inertia('Bible/Guest/Search')->with([
            'current_book' => $current_book,
            'old_testament_books' => $old_testament_books,
            'new_testament_books' => $new_testament_books,
            'search_bible_type' => $search_bible_type,
            'language' => explode('__', $search_bible_type)[0],
            'version' => explode('__', $search_bible_type)[1],
            'verses' => $verses,
            'dir' => $dir,
            'search' => $search,
            'search_scope' => $search_scope
        ]);
    }

    public function show_selected_verses($language, $version)
    {
        $old_testament_books = BlBook::where('category_id', 1)->get();
        $new_testament_books = BlBook::where('category_id', 2)->get();

        // Fetch highlighted verses for the authenticated user
        $highlights = BlHighlight::where('user_id', Auth::id())->get();

        $verses = match ($language) {
            'english' => $version === 'kjv' ? BlEnglishKjvBible::whereIn(DB::raw('CONCAT(book_id, ":", chapter, ":", verse)'), $highlights->map(fn($highlight) => "$highlight->book_id:$highlight->chapter:$highlight->verse"))->get()->map(function ($verse) use ($highlights) {
                $highlight = $highlights->firstWhere(fn($h) => $h->book_id == $verse->book_id && $h->chapter == $verse->chapter && $h->verse == $verse->verse);
                $verse->highlight_color = $highlight->color ?? null;
                $verse->book_name = BlBook::find($verse->book_id)?->english_name;
                return $verse;
            })->groupBy('book_name') : null,
            'amharic' => $version === '1954' ? BlAmharic1954Bible::whereIn(DB::raw('CONCAT(book_id, ":", chapter, ":", verse)'), $highlights->map(fn($highlight) => "$highlight->book_id:$highlight->chapter:$highlight->verse"))->get()->map(function ($verse) use ($highlights) {
                $highlight = $highlights->firstWhere(fn($h) => $h->book_id == $verse->book_id && $h->chapter == $verse->chapter && $h->verse == $verse->verse);
                $verse->highlight_color = $highlight->color ?? null;
                $verse->book_name = BlBook::find($verse->book_id)?->amharic_name;
                return $verse;
            })->groupBy('book_name') : null,
            'oromifa' => $version === 'v1' ? BlOromifaBible::whereIn(DB::raw('CONCAT(book_id, ":", chapter, ":", verse)'), $highlights->map(fn($highlight) => "$highlight->book_id:$highlight->chapter:$highlight->verse"))->get()->map(function ($verse) use ($highlights) {
                $highlight = $highlights->firstWhere(fn($h) => $h->book_id == $verse->book_id && $h->chapter == $verse->chapter && $h->verse == $verse->verse);
                $verse->highlight_color = $highlight->color ?? null;
                $verse->book_name = BlBook::find($verse->book_id)?->oromifa_name;
                return $verse;
            })->groupBy('book_name') : null,
            'hebrew-greek' => $version === 'masoretic-textus-receptus'
                ? BlHebrewMasoreticBible::whereIn(DB::raw('CONCAT(book_id, ":", chapter, ":", verse)'), $highlights->map(fn($highlight) => "$highlight->book_id:$highlight->chapter:$highlight->verse"))->get()->merge(
                    BlGreekTextusReceptusBible::whereIn(DB::raw('CONCAT(book_id, ":", chapter, ":", verse)'), $highlights->map(fn($highlight) => "$highlight->book_id:$highlight->chapter:$highlight->verse"))->get()
                )->map(function ($verse) use ($highlights) {
                    $highlight = $highlights->firstWhere(fn($h) => $h->book_id == $verse->book_id && $h->chapter == $verse->chapter && $h->verse == $verse->verse);
                    $verse->highlight_color = $highlight->color ?? null;
                    $verse->book_name = BlBook::find($verse->book_id)?->english_name;
                    return $verse;
                })->groupBy('book_name')
                : null,
            'greek' => $version === 'septuagint' ? BlGreekSeptuagintBible::whereIn(DB::raw('CONCAT(book_id, ":", chapter, ":", verse)'), $highlights->map(fn($highlight) => "$highlight->book_id:$highlight->chapter:$highlight->verse"))->get()->map(function ($verse) use ($highlights) {
                $highlight = $highlights->firstWhere(fn($h) => $h->book_id == $verse->book_id && $h->chapter == $verse->chapter && $h->verse == $verse->verse);
                $verse->highlight_color = $highlight->color ?? null;
                $verse->book_name = BlBook::find($verse->book_id)?->english_name;
                return $verse;
            })->groupBy('book_name') : null,
            default => null
        };

        return inertia('Bible/User/SelectedVerses')->with([
            'old_testament_books' => $old_testament_books,
            'new_testament_books' => $new_testament_books,
            'language' => $language,
            'version' => $version,
            'verses' => $verses
        ]);
    }
}
