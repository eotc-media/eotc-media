<?php

namespace App\Utils;

class FileUploader
{

    public static function upload_book($file)
    {
        $extention = $file->getClientOriginalExtension();
        $file_name = uniqid('book_') . time() . '.' . $extention;
        $file->storeAs('public/book/file', $file_name);
        return $file_name;
    }
}
