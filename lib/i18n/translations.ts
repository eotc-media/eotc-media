export type Locale = "en" | "am"

export const translations = {
  en: {
    // ── Navigation ──────────────────────────────
    nav_home:           "Home",
    nav_bible:          "Bible",
    nav_liturgy:        "Liturgy",
    nav_hymns:          "Hymns",
    nav_more:           "More",
    nav_quiz:           "Quiz",
    nav_books:          "Books",
    nav_sermons:        "Sermons",

    // ── User menu ───────────────────────────────
    nav_signin:         "Sign in",
    nav_signout:        "Log out",
    nav_profile:        "Profile",
    nav_main_admin:     "Main admin",
    nav_liturgy_admin:  "Liturgy admin",
    nav_hymn_admin:     "Hymn admin",
    nav_sermon_admin:   "Sermon admin",
    nav_book_admin:     "Book admin",
    nav_quiz_admin:     "Quiz admin",

    // ── Hymns sidebar ───────────────────────────
    hymn_all:           "All hymns",
    hymn_channels:      "Channels",
    hymn_favorites:     "Favorites",
    hymn_my_lists:      "My lists",
    hymn_my_uploads:    "My uploads",

    // ── Hymns page ──────────────────────────────
    hymn_featured:      "Featured",
    hymn_submit:        "Submit a hymn",
    hymn_all_channels:  "All channels",

    // ── Hymns search filters ─────────────────────
    hymn_search_placeholder: "Search hymns…",
    hymn_select_language:    "Select language",
    hymn_select_category:    "Select category",
    hymn_select_singer:      "Select singer",
    hymn_select_subcategory: "Select sub-category",
    hymn_by_singer:          "By the singer",

    // ── Sermons sidebar ─────────────────────────
    sermon_select_language:    "Select language",
    sermon_select_category:    "Select category",
    sermon_select_subcategory: "Select sub-category",
    sermon_search_placeholder: "Search sermons…",
    sermon_all:         "All sermons",
    sermon_channels:    "Channels",
    sermon_favorites:   "Favorites",
    sermon_my_uploads:  "My uploads",

    // ── Search & filters (generic) ───────────────
    search_placeholder: "Search…",
    filters_btn:        "Filters",
    sort_random:        "Random",
    filter_all:         "All",
    filter_language:    "Language",
    filter_category:    "Category",
    filter_sort:        "Sort",

    // ── Books sidebar + filters ──────────────────
    book_all:                "All books",
    book_my:                 "My books",
    book_search_placeholder: "Search books…",
    book_select_language:    "Select language",
    book_select_category:    "Select category",
    book_select_subcategory: "Select sub-category",

    // ── Quiz sidebar ─────────────────────────────
    quiz_search_placeholder: "Search questions…",
    quiz_select_language:    "Select language",
    quiz_select_category:    "Select category",
    quiz_select_subcategory: "Select sub-category",
    quiz_select_difficulty:  "Select difficulty",

    quiz_all:   "All questions",
    quiz_rooms: "Group rooms",
    quiz_my:    "My questions",

    // ── Common actions ──────────────────────────
    action_save:        "Save changes",
    action_cancel:      "Cancel",
    action_accept:      "Accept",
    action_decline:     "Decline",
    action_edit:        "Edit",
    action_delete:      "Delete",
    action_submit:      "Submit",
    action_confirm:     "Confirm",
    action_loading:     "Loading…",
    action_no_results:  "No results",

    // ── Auth pages ──────────────────────────────
    auth_login_title:    "Sign in to your account",
    auth_login_btn:      "Sign in",
    auth_register_title: "Create an account",
    auth_register_btn:   "Register",
    auth_email:          "Email",
    auth_password:       "Password",
    auth_name:           "Full name",

    // ── Feedback widget ─────────────────────────
    feedback_btn:              "Feedback",
    feedback_title:            "Send feedback",
    feedback_placeholder:      "Your message…",
    feedback_send:             "Send",
    feedback_thanks:           "Thank you!",
    feedback_header:           "Share your feedback",
    feedback_description:      "If there's something you want fixed or added, please share your feedback…",
    feedback_contact:          "Write your info if you want us to reach you",
    feedback_name_placeholder: "Name",
    feedback_phone_placeholder: "Phone",
    feedback_sending:          "Sending…",
    feedback_submit_btn:       "Send your feedback",
    feedback_success_msg:      "Thank you for your feedback!",

    // ── Bible ────────────────────────────────────
    bible_find_book:        "Find a book…",
    bible_no_books:         "No books found",
    bible_tab_verse:        "Verse",
    bible_tab_highlights:   "Highlights",
    bible_tab_reading:      "Reading",
    bible_copy_verse:       "Copy verse",
    bible_copy_ref:         "Copy ref",
    bible_no_verse:         "No verse selected",
    bible_click_to_select:  "Click a verse number to select it",
    bible_signin_highlights:"Sign in to save highlights",
    bible_highlights_saved: "Your highlights are saved to your account",
    bible_no_highlights:    "No highlights yet",
    bible_click_to_highlight: "Click a verse number to highlight it",
    bible_font_size:        "Font size",
    bible_tip:              "Tip: Click any verse number to highlight it.",
    bible_signin_save:      " Sign in to save highlights.",
    bible_search:           "Search",
    bible_voice_search:     "Voice search",
    bible_search_placeholder: "Search verses…",
    bible_scope_whole:      "Whole Bible",
    bible_scope_ot:         "Old Testament",
    bible_scope_nt:         "New Testament",
    bible_scope_book:       "This book",
    bible_no_text:          "No text available",
    bible_highlighted:      "highlighted",

    // ── Bible right panel ────────────────────────
    bible_my_collections:       "My collections",
    bible_view_collections:     "View my collections",
    bible_signin_collections:   "to save verses to collections.",
    bible_selected_verse:       "Selected verse",
    bible_tap_to_select:        "Tap a verse number to select it. Tap more to build a multi-verse selection.",
    bible_reading_label:        "Reading",
    bible_text_size:            "Text size",
    bible_view_mode:            "View",
    bible_by_verse:             "By verse",
    bible_paragraph_mode:       "Paragraph",
    bible_commentary_label:     "Commentary",
    bible_commentary_soon:      "Verse commentary coming soon.",
    bible_highlight_label:      "Highlight",
    bible_save_label:           "Save",
    bible_clear_selection:      "Clear selection",
    bible_of:                   " of ",
    bible_verses:               "verses",
    bible_type_to_search:       "Type to search",
    bible_search_desc:          "Search for words or phrases across the Bible",

    // ── Sort options (shared) ────────────────────
    sort_trending:      "Trending",
    sort_newest_first:  "Newest first",
    sort_oldest_first:  "Oldest first",
    sort_most_clicked:  "Most clicked",
    sort_least_clicked: "Least clicked",
    sort_name_az:       "Name (A–Z)",
    sort_name_za:       "Name (Z–A)",
    sort_most_liked:    "Most popular",
    sort_most_hymns:    "Most hymns",
    sort_fewest_hymns:  "Fewest hymns",


    // ── Hymns count / actions ────────────────────
    hymn_singular:   "hymn",
    hymn_plural:     "hymns",
    hymn_play_all:   "Play all",
    hymn_all_loaded: "All hymns loaded",
    hymn_none_found: "No hymns found",

    // ── Sermons count / actions ──────────────────
    sermon_singular:   "sermon",
    sermon_plural:     "sermons",
    sermon_play_all:   "Play all",
    sermon_all_loaded: "All sermons loaded",
    sermon_none_found: "No sermons found",

    // ── Channels ─────────────────────────────────
    channel_title:        "Channels",
    channel_singular:     "channel",
    channel_plural:       "channels",
    channel_none_found:   "No channels found",
    channel_all_loaded:   "All channels loaded",

    // ── Liturgy ──────────────────────────────────
    liturgy_title:          "Liturgy",
    liturgy_language_btn:   "Language",
    liturgy_select_langs:   "Select languages",
    liturgy_no_content:     "No liturgy content yet",
    liturgy_no_content_msg: "Liturgical texts will appear here once they are added by an administrator.",
    liturgy_note:           "Note:",
    liturgy_no_section:     "No texts in this section yet",
    liturgy_find_section:   "Find a section",
    liturgy_no_sections:    "No sections found",
    liturgy_directions:     "Service directions",
    liturgy_no_audio:       "No recording yet",
    liturgy_text_size:      "Text size",
    liturgy_reading_label:  "Reading",

    // ── Collections ──────────────────────────────
    col_save_title:       "Save to collection",
    col_new_placeholder:  "New collection name…",
    col_create_btn:       "Create",
    col_empty_state:      "No collections yet.",
    col_empty_hint:       "Create a new collection below to get started.",
    col_collection_sg:    "collection",
    col_collection_pl:    "collections",
    col_verse_sg:         "verse",
    col_verse_pl:         "verses",
    col_new_label:        "New collection",
    col_subtitle:         "Your saved verse collections",
    col_empty_page_hint:  "Open the Bible reader, select verses, and save them to a collection.",
    col_go_bible:         "Go to Bible",
    col_open:             "Open",
    col_no_verses_yet:    "No verses in this collection yet.",

    // ── Misc ────────────────────────────────────
    media_resources:    "Media resources",
  },

  am: {
    // ── Navigation ──────────────────────────────
    nav_home:           "መነሻ",
    nav_bible:          "መጽሐፍ ቅዱስ",
    nav_liturgy:        "ቅዳሴ",
    nav_hymns:          "መዝሙራት",
    nav_more:           "ተጨማሪ",
    nav_quiz:           "ጥያቄዎች",
    nav_books:          "መጻሕፍት",
    nav_sermons:        "ስብከቶች",

    // ── User menu ───────────────────────────────
    nav_signin:         "ይግቡ",
    nav_signout:        "ይውጡ",
    nav_profile:        "የግል ማኅደር",
    nav_main_admin:     "ዋና አስተዳዳሪ",
    nav_liturgy_admin:  "የቅዳሴ አስተዳዳሪ",
    nav_hymn_admin:     "የመዝሙራት አስተዳዳሪ",
    nav_sermon_admin:   "የስብከቶች አስተዳዳሪ",
    nav_book_admin:     "የመጻሕፍት አስተዳዳሪ",
    nav_quiz_admin:     "የጥያቄዎች አስተዳዳሪ",

    // ── Hymns sidebar ───────────────────────────
    hymn_all:           "ሁሉም መዝሙራት",
    hymn_channels:      "ቻናሎች",
    hymn_favorites:     "የተመረጡ መዝሙራት",
    hymn_my_lists:      "የእኔ ስብስቦች",
    hymn_my_uploads:    "እርስዎ ያስገቧቸው መዝሙራት",

    // ── Hymns page ──────────────────────────────
    hymn_featured:      "ተለይተው የቀረቡ",
    hymn_submit:        "መዝሙር ያስገቡ",
    hymn_all_channels:  "ሁሉም ቻናሎች",

    // ── Hymns search filters ─────────────────────
    hymn_search_placeholder: "መዝሙር ይፈልጉ…",
    hymn_select_language:    "ቋንቋ ይምረጡ",
    hymn_select_category:    "ምድብ ይምረጡ",
    hymn_select_singer:      "ዘማሪ ይምረጡ",
    hymn_select_subcategory: "ንዑስ ምድብ ይምረጡ",
    hymn_by_singer:          "የዘማሪው ሌሎች መዝሙራት",

    // ── Sermons sidebar ─────────────────────────
    sermon_select_language:    "ቋንቋ ይምረጡ",
    sermon_select_category:    "ምድብ ይምረጡ",
    sermon_select_subcategory: "ንዑስ ምድብ ይምረጡ",
    sermon_search_placeholder: "ስብከት ይፈልጉ…",
    sermon_all:         "ሁሉም ስብከቶች",
    sermon_channels:    "ቻናሎች",
    sermon_favorites:   "የተመረጡ ስብከቶች",
    sermon_my_uploads:  "እርስዎ ያስገቧቸው ስብከቶች",

    // ── Search & filters (generic) ───────────────
    search_placeholder: "ይፈልጉ…",
    filters_btn:        "ማጣሪያ",
    sort_random:        "በዘፈቀደ",
    filter_all:         "ሁሉም",
    filter_language:    "ቋንቋ",
    filter_category:    "ምድብ",
    filter_sort:        "ቅደም ተከተል",

    // ── Books sidebar + filters ──────────────────
    book_all:                "ሁሉም መጻሕፍት",
    book_my:                 "የእኔ መጻሕፍት",
    book_search_placeholder: "መጽሐፍ ይፈልጉ…",
    book_select_language:    "ቋንቋ ይምረጡ",
    book_select_category:    "ምድብ ይምረጡ",
    book_select_subcategory: "ንዑስ ምድብ ይምረጡ",

    // ── Quiz sidebar ─────────────────────────────
    quiz_search_placeholder: "ጥያቄዎችን ይፈልጉ…",
    quiz_select_language:    "ቋንቋ ይምረጡ",
    quiz_select_category:    "ምድብ ይምረጡ",
    quiz_select_subcategory: "ንዑስ ምድብ ይምረጡ",
    quiz_select_difficulty:  "የክብደት ደረጃ ይምረጡ",

    quiz_all:   "ሁሉም ጥያቄዎች",
    quiz_rooms: "የቡድን ውድድር ክፍሎች",
    quiz_my:    "የእኔ ጥያቄዎች",

    // ── Common actions ──────────────────────────
    action_save:        "ለውጦችን ያስቀምጡ",
    action_cancel:      "ይቅር",
    action_accept:      "ይቀበሉ",
    action_decline:     "አይቀበሉ",
    action_edit:        "ያስተካክሉ",
    action_delete:      "ያጥፉ",
    action_submit:      "ያስገቡ",
    action_confirm:     "ያረጋግጡ",
    action_loading:     "በመጫን ላይ…",
    action_no_results:  "ምንም ውጤት አልተገኘም",

    // ── Auth pages ──────────────────────────────
    auth_login_title:    "ወደ መለያዎ ይግቡ",
    auth_login_btn:      "ይግቡ",
    auth_register_title: "አዲስ መለያ ይክፈቱ",
    auth_register_btn:   "ይመዝገቡ",
    auth_email:          "ኢሜይል",
    auth_password:       "የይለፍ ቃል",
    auth_name:           "ሙሉ ስም",

    // ── Feedback widget ─────────────────────────
    feedback_btn:              "አስተያየት",
    feedback_title:            "አስተያየት ይስጡ",
    feedback_placeholder:      "መልእክትዎን እዚህ ይጻፉ…",
    feedback_send:             "ይላኩ",
    feedback_thanks:           "እናመሰግናለን!",
    feedback_header:           "ሐሳብዎን ያካፍሉን",
    feedback_description:      "እንዲስተካከል ወይም እንዲካተት የሚፈልጉት ነገር ካለ ሐሳብዎን ያካፍሉን…",
    feedback_contact:          "እንድናገኝዎት ከፈለጉ አድራሻዎን ያስቀምጡልን",
    feedback_name_placeholder: "ስም",
    feedback_phone_placeholder: "ስልክ ቁጥር",
    feedback_sending:          "በመላክ ላይ…",
    feedback_submit_btn:       "አስተያየትዎን ይላኩ",
    feedback_success_msg:      "ስለ አስተያየትዎ እናመሰግናለን!",

    // ── Bible ────────────────────────────────────
    bible_find_book:        "መጽሐፍ ይፈልጉ…",
    bible_no_books:         "ምንም መጽሐፍ አልተገኘም",
    bible_tab_verse:        "ጥቅስ",
    bible_tab_highlights:   "ምልክት የተደረገባቸው",
    bible_tab_reading:      "ንባብ",
    bible_copy_verse:       "ጥቅሱን ቅዳ",
    bible_copy_ref:         "ምዕራፍና ቁጥሩን ቅዳ",
    bible_no_verse:         "ምንም ጥቅስ አልተመረጠም",
    bible_click_to_select:  "ጥቅስ ለመምረጥ ቁጥሩን ይጫኑ",
    bible_signin_highlights:"ምልክት ያደረጉባቸውን ጥቅሶች ለማስቀመጥ ይግቡ",
    bible_highlights_saved: "ምልክት ያደረጉባቸው ጥቅሶች በመለያዎ ተቀምጠዋል",
    bible_no_highlights:    "ምልክት የተደረገበት ጥቅስ የለም",
    bible_click_to_highlight: "ምልክት ለማድረግ የጥቅሱን ቁጥር ይጫኑ",
    bible_font_size:        "የፊደል መጠን",
    bible_tip:              "ጠቃሚ ምክር፦ በማንኛውም ጥቅስ ላይ ምልክት ለማድረግ ቁጥሩን ይጫኑ።",
    bible_signin_save:      " ምልክት ያደረጉባቸውን ለማስቀመጥ ይግቡ።",
    bible_search:           "ፍለጋ",
    bible_voice_search:     "በድምፅ ይፈልጉ",
    bible_search_placeholder: "ጥቅሶችን ይፈልጉ…",
    bible_scope_whole:      "ሙሉ መጽሐፍ ቅዱስ",
    bible_scope_ot:         "ብሉይ ኪዳን",
    bible_scope_nt:         "ሐዲስ ኪዳን",
    bible_scope_book:       "በዚህ መጽሐፍ ውስጥ",
    bible_no_text:          "ምንም ጽሑፍ የለም",
    bible_highlighted:      "ምልክት የተደረገበት",

    // ── Bible right panel ────────────────────────
    bible_my_collections:       "የእኔ ስብስቦች",
    bible_view_collections:     "ስብስቦቼን አሳይ",
    bible_signin_collections:   "ጥቅሶችን በስብስብ ለማስቀመጥ ይግቡ።",
    bible_selected_verse:       "የተመረጠ ጥቅስ",
    bible_tap_to_select:        "ጥቅስ ለመምረጥ ቁጥሩን ይጫኑ። ተጨማሪ ጥቅሶችን ለመምረጥ ሌሎች ቁጥሮችን ይጫኑ።",
    bible_reading_label:        "የንባብ ገጽታ",
    bible_text_size:            "የፊደል መጠን",
    bible_view_mode:            "አቀራረብ",
    bible_by_verse:             "በጥቅስ",
    bible_paragraph_mode:       "በአንቀጽ",
    bible_commentary_label:     "ትርጓሜ",
    bible_commentary_soon:      "የጥቅሱ ትርጓሜ በቅርቡ ይካተታል።",
    bible_highlight_label:      "ምልክት ያድርጉ",
    bible_save_label:           "ያስቀምጡ",
    bible_clear_selection:      "ምርጫውን ያጽዱ",
    bible_of:                   " ከ ",
    bible_verses:               "ጥቅሶች",
    bible_type_to_search:       "ለመፈለግ ይጻፉ",
    bible_search_desc:          "በመጽሐፍ ቅዱስ ውስጥ ቃላትን ወይም ሐረጎችን ይፈልጉ",

    // ── Sort options (shared) ────────────────────
    sort_trending:      "በብዛት እየተደመጡ ያሉ",
    sort_newest_first:  "አዳዲስ መጀመሪያ",
    sort_oldest_first:  "የቆዩ መጀመሪያ",
    sort_most_clicked:  "በብዛት የተከፈቱ",
    sort_least_clicked: "በትንሹ የተከፈቱ",
    sort_name_az:       "በስም (ሀ–ፐ)",
    sort_name_za:       "በስም (ፐ–ሀ)",
    sort_most_liked:    "ተወዳጅ ቀዳሚ",
    sort_most_hymns:    "ብዙ መዝሙራት ያላቸው",
    sort_fewest_hymns:  "ጥቂት መዝሙራት ያላቸው",

    // ── Hymns count / actions ────────────────────
    hymn_singular:   "መዝሙር",
    hymn_plural:     "መዝሙራት",
    hymn_play_all:   "ሁሉንም አጫውት",
    hymn_all_loaded: "ሁሉም መዝሙራት ተጭነዋል",
    hymn_none_found: "ምንም መዝሙር አልተገኘም",

    // ── Sermons count / actions ──────────────────
    sermon_singular:   "ስብከት",
    sermon_plural:     "ስብከቶች",
    sermon_play_all:   "ሁሉንም አጫውት",
    sermon_all_loaded: "ሁሉም ስብከቶች ተጭነዋል",
    sermon_none_found: "ምንም ስብከት አልተገኘም",

    // ── Channels ─────────────────────────────────
    channel_title:        "ቻናሎች",
    channel_singular:     "ቻናል",
    channel_plural:       "ቻናሎች",
    channel_none_found:   "ምንም ቻናል አልተገኘም",
    channel_all_loaded:   "ሁሉም ቻናሎች ተጭነዋል",

    // ── Liturgy ──────────────────────────────────
    liturgy_title:          "ሥርዓተ ቅዳሴ",
    liturgy_language_btn:   "ቋንቋ",
    liturgy_select_langs:   "ቋንቋዎችን ይምረጡ",
    liturgy_no_content:     "ለጊዜው የቅዳሴ ይዘት አልተካተተም",
    liturgy_no_content_msg: "የቅዳሴ ጽሑፎች በአስተዳዳሪ ሲገቡ እዚህ ይታያሉ።",
    liturgy_note:           "ማስታወሻ፦",
    liturgy_no_section:     "በዚህ ክፍል ለጊዜው ጽሑፍ የለም",
    liturgy_find_section:   "ክፍል ይፈልጉ",
    liturgy_no_sections:    "ምንም ክፍል አልተገኘም",
    liturgy_directions:     "የሥርዓተ ቅዳሴ መመሪያ",
    liturgy_no_audio:       "የድምፅ ቅጂ ገና አልተካተተም",
    liturgy_text_size:      "የፊደል መጠን",
    liturgy_reading_label:  "የንባብ ገጽታ",

    // ── Collections ──────────────────────────────
    col_save_title:       "ወደ ስብስብ ያስቀምጡ",
    col_new_placeholder:  "የአዲሱ ስብስብ ስም…",
    col_create_btn:       "ይፍጠሩ",
    col_empty_state:      "እስካሁን ምንም ስብስብ የለም።",
    col_empty_hint:       "ለመጀመር ከታች አዲስ ስብስብ ይፍጠሩ።",
    col_collection_sg:    "ስብስብ",
    col_collection_pl:    "ስብስቦች",
    col_verse_sg:         "ጥቅስ",
    col_verse_pl:         "ጥቅሶች",
    col_new_label:        "አዲስ ስብስብ",
    col_subtitle:         "ያስቀመጧቸው የጥቅስ ስብስቦች",
    col_empty_page_hint:  "መጽሐፍ ቅዱስን ይክፈቱ፣ ጥቅሶችን ይምረጡና በስብስብ ያስቀምጧቸው።",
    col_go_bible:         "ወደ መጽሐፍ ቅዱስ ይሂዱ",
    col_open:             "ክፈት",
    col_no_verses_yet:    "በዚህ ስብስብ ውስጥ እስካሁን ምንም ጥቅስ የለም።",

    // ── Misc ────────────────────────────────────
    media_resources:    "መንፈሳዊ የሚዲያ ውጤቶች",
  },
} satisfies Record<Locale, Record<string, string>>

export type TranslationKey = keyof typeof translations.en
