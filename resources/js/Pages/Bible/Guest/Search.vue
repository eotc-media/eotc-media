<script setup>
import BibleLayout from '@/Layouts/Bible/BibleLayout.vue';
const props = defineProps({
    current_book: Object,
    old_testament_books: Object,
    new_testament_books: Object,
    search_bible_type: String,
    verses: Object,
    dir: String,
    search: String,
    search_scope: String,
    language: String,
    version: String
})
</script>

<template>

    <Head title="Search" />

    <BibleLayout :old_testament_books="old_testament_books" :new_testament_books="new_testament_books"
        :language="language" :version="version" :current_book="current_book" :bible_type="`${language}__${version}`"
        :dir="dir" :search="search" :search_scope="search_scope">
        <div class="row mx-1">
            <div class="container" :class="dir == 'rtl' ? 'text-right' : ''">
                <div class="col-md-10 offset-md-1 mb-4">
                    <div class="mb-4">{{ verses.length }} verses found.</div>
                    <template v-for="(verse, index) in verses" :key="verse.id">
                        <div class="verse-text mb-2">
                            <Link class="unstyled-link" :href="route('bible.show_chapter', {
        'language': language,
        'version': version,
        'book': verse.book.id,
        'chapter': verse.chapter,
        'verse': verse.verse
    }) + '#' + (parseInt(verse.verse) - 4).toString()">
                            <div class="text-blue">
                                <template v-if="language == 'english'" class="my-2">{{ verse.book.english_name
                                    }}</template>
                                <template v-if="language == 'geez'" class="my-2">{{ verse.book.geez_name }}</template>
                                <template v-if="language == 'amharic'" class="my-2">{{ verse.book.amharic_name
                                    }}</template>
                                <template v-if="language == 'oromifa'" class="my-2">{{ verse.book.oromifa_name
                                    }}</template>
                                <template v-if="language == 'tigrigna'" class="my-2">{{ verse.book.tigrigna_name
                                    }}</template>
                                <template v-if="language == 'hebrew-greek'" dir="rtl" class="my-2">{{
        verse.book.hebrew_greek_name }}</template>
                                <template v-if="language == 'greek'" dir="rtl" class="my-2">{{ verse.book.greek_name
                                    }}</template>
                                {{ verse.chapter }}
                            </div>
                            <span :dir="dir"
                                v-if="verse.text.replace(/\s+/g, '') == '' || verse.text.replace(/\s+/g, '') == '-'">
                                {{ verse.verse }} ፣
                            </span>
                            <span :dir="dir" v-else>
                                <span class="me-1">{{ verse.verse }}</span> {{ verse.text }}
                                <br>
                            </span>
                            </Link>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </BibleLayout>
</template>

<style scoped>
.verse-text {
    line-height: 2;
}

.verse-text:hover {
    cursor: pointer;
}

.selected-verse {
    background-color: #30C5FF;
    font-weight: bold;
}

.unstyled-link {
    text-decoration: none;
    color: #222222;
}

hr {
    border-color: black;
}
</style>
