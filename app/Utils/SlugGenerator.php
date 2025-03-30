<?php

namespace App\Utils;

class SlugGenerator
{
    public static function generateUniqueSlug($title, $model)
    {
        $slug = preg_replace('/[^\p{L}\p{N}]+/u', '-', $title);
        $slug = trim($slug, '-');
        $originalSlug = $slug;
        $counter = 1;

        while ($model::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-" . $counter++;
        }

        return $slug;
    }
}
