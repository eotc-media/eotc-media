<?php

use App\Http\Controllers\Bible\GuestController as BibleGuestController;
use App\Http\Controllers\Bible\User\BibleController;
use App\Http\Controllers\Book\AdminController as BookAdminController;
use App\Http\Controllers\Book\ApprovalStatusController as BookApprovalStatusController;
use App\Http\Controllers\Book\AuthorController;
use App\Http\Controllers\Book\BookController;
use App\Http\Controllers\Book\CategoryController as BookCategoryController;
use App\Http\Controllers\Book\GuestController as BookGuestController;
use App\Http\Controllers\Book\LanguageController as BookLanguageController;
use App\Http\Controllers\Book\SubCategoryController as BookSubCategoryController;
use App\Http\Controllers\Hymn\AdminController as HymnAdminController;
use App\Http\Controllers\Hymn\ApprovalStatusController;
use App\Http\Controllers\Hymn\CategoryController;
use App\Http\Controllers\Hymn\FavoriteController;
use App\Http\Controllers\Hymn\GuestController as HymnGuestController;
use App\Http\Controllers\Hymn\HymnController;
use App\Http\Controllers\Hymn\LanguageController;
use App\Http\Controllers\Hymn\SingerController;
use App\Http\Controllers\Hymn\SubCategoryController;
use App\Http\Controllers\Main\AdminController;
use App\Http\Controllers\Main\GuestController;
use App\Http\Controllers\Main\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', [GuestController::class, 'index'])->name('welcome');
Route::get('/feedback', [GuestController::class, 'feedback'])->name('feedbacks.create');
Route::post('/feedback', [GuestController::class, 'store_feedback'])->name('feedbacks.store');

Route::middleware(['auth', 'verified'])->prefix('user')->name('user.')->group(function () {
    Route::get('/profile/show', [UserController::class, 'show_profile'])->name('profile.show');
    Route::get('/profile/edit', [UserController::class, 'edit_profile'])->name('profile.edit');
    Route::post('/profile/update', [UserController::class, 'update_profile'])->name('profile.update');
});

Route::middleware(['auth', 'verified', 'can:access-main-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [AdminController::class, 'users_index'])->name('users.index');
    Route::get('/users/{user}', [AdminController::class, 'users_show'])->name('users.show');
    Route::put('/users/{user}/change-role', [AdminController::class, 'users_change_role'])->name('users.change_role');
    Route::get('/feedbacks', [AdminController::class, 'feedbacks_index'])->name('feedbacks.index');
});

Route::prefix('hymn')->name('hymn.')->group(function () {
    Route::get('/', [HymnGuestController::class, 'index']);

    Route::prefix('hymns')->name('hymns.')->group(function () {
        Route::get('/lan/{language}/cat/{category}/subcat/{sub_category}', [HymnGuestController::class, 'hymns'])->name('index');
        Route::get('/watch/{hymn}', [HymnGuestController::class, 'watch'])->name('watch');
        Route::get('/play-all/lan/{language}/cat/{category}/subcat/{sub_category}', [HymnGuestController::class, 'play_all'])->name('playall');
        Route::get('/singers/{singer}', [HymnGuestController::class, 'singer_hymns'])->name('singer_hymns');
        Route::post('/{hymn}/increment-clicks', [HymnGuestController::class, 'increment_clicks'])->name('increment_clicks');
        Route::put('/{hymn}/lyrics', [HymnGuestController::class, 'update_lyrics'])->name('lyrics.update');
    });

    Route::prefix('channels')->name('channels.')->group(function () {
        Route::get('/', [HymnGuestController::class, 'channels'])->name('index');
        Route::get('/{channel}', [HymnGuestController::class, 'show_channel'])->name('show');
    });

    Route::middleware(['auth', 'verified'])->prefix('user')->name('user.')->group(function () {
        Route::resource('/hymns', HymnController::class)->except(['update', 'destroy']);
        Route::get('/favorites/lan/{language}/cat/{category}/subcat/{sub_category}', [FavoriteController::class, 'index'])->name('favorites.index');
        Route::get('/favorites/{hymn_id}', [FavoriteController::class, 'toggle'])->name('favorites.toggle');
    });

    Route::middleware(['auth', 'verified', 'can:access-admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [HymnAdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/hymns/new', [HymnAdminController::class, 'new_hymns'])->name('hymns.new');
        Route::get('/hymns/lyrics-suggestion', [HymnAdminController::class, 'lyrics_suggestion'])->name('hymns.lyrics_suggestion');
        Route::put('/hymns/approve-lyrics/{id}', [HymnAdminController::class, 'approve_lyrics'])->name('hymns.approve_lyrics');
        Route::put('/hymns/decline-lyrics/{id}', [HymnAdminController::class, 'decline_lyrics'])->name('hymns.decline_lyrics');
        Route::get('/hymns', [HymnAdminController::class, 'hymns_index'])->name('hymns.index');
        Route::get('/hymns/{id}/edit', [HymnAdminController::class, 'edit_hymn'])->name('hymns.edit');
        Route::put('/hymns/{id}', [HymnAdminController::class, 'update_hymn'])->name('hymns.update');
        Route::delete('/hymns/{id}', [HymnAdminController::class, 'delete_hymn'])->name('hymns.delete');
        Route::post('/hymns/{id}/accept', [HymnAdminController::class, 'accept_hymn'])->name('hymns.accept');
        Route::post('/hymns/{id}/decline', [HymnAdminController::class, 'decline_hymn'])->name('hymns.decline');
        Route::resource('/singers', SingerController::class)->except(['show', 'edit']);
        Route::resource('/languages', LanguageController::class)->except(['show', 'edit']);
        Route::resource('/categories', CategoryController::class)->except(['show', 'edit']);
        Route::resource('/sub-categories', SubCategoryController::class, ['names' => 'sub_categories'])->except(['show', 'edit']);
        Route::resource('/approval-statuses', ApprovalStatusController::class, ['names' => 'approval_statuses'])->except(['show', 'edit']);
    });
});

Route::prefix('bible')->name('bible.')->group(function () {
    Route::get('/', [BibleGuestController::class, 'index']);
    Route::get('search', [BibleGuestController::class, 'search_bible'])->name('search');
    Route::get('seleted-verses/{language}/{version}', [BibleGuestController::class, 'show_selected_verses'])->name('selected_verses.show');
    Route::get('{language}/{version}/book/{book}/chapter/{chapter}', [BibleGuestController::class, 'show_chapter'])->name('show_chapter');
    Route::middleware('auth')->group(function () {
        Route::post('/highlight/store', [BibleController::class, 'store_highlight'])->name('highlight.store');
    });
});

Route::prefix('book')->name('book.')->group(function () {
    Route::get('/', [BookGuestController::class, 'index']);

    Route::prefix('books')->name('books.')->group(function () {
        Route::get('/lan/{language}/cat/{category}/subcat/{sub_category}', [BookGuestController::class, 'books'])->name('index');
        Route::get('/show/{book}', [BookGuestController::class, 'view_book'])->name('view');
        Route::get('/authors/{author}', [BookGuestController::class, 'author_books'])->name('author_books');
    });

    Route::middleware(['auth', 'verified'])->prefix('user')->name('user.')->group(function () {
        Route::get('/dashboard', [BookController::class, 'dashboard'])->name('dashboard');
        Route::resource('/books', BookController::class);
        // Like, dislike and report
        Route::post('/books/{id}/like', [BookController::class, 'toggle_like'])->name('books.like');
        Route::post('/books/{id}/dislike', [BookController::class, 'toggle_dislike'])->name('books.dislike');
        Route::post('/books/{id}/report-copyright', [BookController::class, 'report_copyright'])->name('books.report_copyright');
        Route::post('/books/{id}/remove-copyright', [BookController::class, 'remove_copyright'])->name('books.remove_copyright');
        // Comment and reply
        Route::post('/books/{id}/comments/store', [BookController::class, 'store_comment'])->name('books.comments.store');
        Route::post('/books/{book}/comments/{comment}/reply', [BookController::class, 'reply_comment'])->name('books.comments.reply');
    });

    Route::middleware(['auth', 'verified', 'can:access-admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [BookAdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/books/new', [BookAdminController::class, 'new_books'])->name('books.new');
        Route::post('/books/{id}/accept', [BookAdminController::class, 'accept_book'])->name('books.accept');
        Route::post('/books/{id}/decline', [BookAdminController::class, 'decline_book'])->name('books.decline');
        Route::resource('/authors', AuthorController::class)->except(['show', 'edit']);
        Route::resource('/languages', BookLanguageController::class)->except(['show', 'edit']);
        Route::resource('/categories', BookCategoryController::class)->except(['show', 'edit']);
        Route::resource('/sub-categories', BookSubCategoryController::class, ['names' => 'sub_categories'])->except(['show', 'edit']);
        Route::resource('/approval-statuses', BookApprovalStatusController::class, ['names' => 'approval_statuses'])->except(['show', 'edit']);
        Route::get('/users', [BookAdminController::class, 'users_index'])->name('users.index');
        Route::get('/users/{user}', [BookAdminController::class, 'users_show'])->name('users.show');
        Route::put('/users/{user}/change-role', [BookAdminController::class, 'users_change_role'])->name('users.change_role');
    });
});

require __DIR__ . '/auth.php';
