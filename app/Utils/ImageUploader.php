<?php

namespace App\Utils;

use Intervention\Image\ImageManagerStatic as Image;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class ImageUploader
{
    public static function upload_user_image($image)
    {
        $extension = $image->getClientOriginalExtension();
        $image_name_to_save = uniqid('user_') . time() . '.' . $extension;

        $manager = new ImageManager(new Driver());
        $img = $manager->read($image->getPathname())->orient();

        $img->scale(width: 1000);

        $cropSize = min($img->width(), $img->height());
        $img->crop($cropSize, $cropSize);

        $img->save(storage_path('app/public/user/image/' . $image_name_to_save));

        return $image_name_to_save;
    }

    public static function upload_book_image($image)
    {
        $extension = $image->getClientOriginalExtension();
        $image_name_to_save = uniqid('book_') . time() . '.' . $extension;
        $manager = new ImageManager(new Driver());
        $img = $manager->read($image->getPathname())->orient();

        $size = min(1000, $img->width());
        $img->scale(width: $size);

        $aspectRatio = 1.4142; // √2
        if ($img->height() / $img->width() < $aspectRatio) {
            $cropWidth = round($img->height() / $aspectRatio);
            $cropHeight = $img->height();
        } else {
            $cropWidth = $img->width();
            $cropHeight = round($img->width() * $aspectRatio);
        }
        $img->crop($cropWidth, $cropHeight);

        $img->save(storage_path('app/public/book/image/' . $image_name_to_save));

        return $image_name_to_save;
    }
}
