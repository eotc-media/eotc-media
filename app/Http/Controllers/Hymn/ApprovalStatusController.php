<?php

namespace App\Http\Controllers\Hymn;

use App\Http\Controllers\Controller;
use App\Models\HmApprovalStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class ApprovalStatusController extends Controller
{
    public function index()
    {
        $approval_statuses = HmApprovalStatus::all();
        return inertia('Hymn/Admin/ApprovalStatus/Index')->with([
            'approval_statuses' => $approval_statuses,
            'can' => [
                'add_approval_status' => Gate::allows('manage', HmApprovalStatus::class)
            ]
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('manage', HmApprovalStatus::class);

        $validated = $request->validate([
            'name' => 'string|required'
        ]);

        $approval_status = new HmApprovalStatus($validated);
        $approval_status->user_id = Auth::id();
        $approval_status->save();

        return redirect(route('hymn.admin.approval_statuses.index'));
    }

    public function destroy($id)
    {
        $approval_status = HmApprovalStatus::findOrFail($id);
        Gate::authorize('manage', HmApprovalStatus::class);

        try {
            $approval_status->delete();
        } catch (\Throwable $th) {
            return back()->with('error', 'Error occured during delete operation. Make sure there is no category within this status.');
        }
        return back();
    }
}
