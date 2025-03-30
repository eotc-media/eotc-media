<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('channels:update')->weekly();
