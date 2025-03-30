<?php

namespace App\Http\Controllers\Book;

use App\Http\Controllers\Controller;
use App\Models\CbApprovalStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ApprovalStatusController extends Controller
{
    public function index()
    {
        $approval_statuses = CbApprovalStatus::all();
        return inertia('Book/Admin/ApprovalStatus/Index')->with([
            'approval_statuses' => $approval_statuses
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', CbApprovalStatus::class);

        $validated = $request->validate([
            'name' => 'string|required'
        ]);

        $approval_status = new CbApprovalStatus($validated);
        $approval_status->user_id = Auth::id();
        $approval_status->save();

        return redirect(route('book.admin.approval_statuses.index'));
    }

    public function destroy($id)
    {
        Gate::authorize('manage', CbApprovalStatus::class);

        $approval_status = CbApprovalStatus::findOrFail($id);
        try {
            $approval_status->delete();
        } catch (\Throwable $th) {
            return back()->with('error', 'Error occured during delete operation. Make sure there is no category within this status.');
        }
        return back();
    }
}
