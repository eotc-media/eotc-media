<script setup>
import BibleLayout from '@/Layouts/Bible/BibleLayout.vue';
import { defineProps } from 'vue';

const props = defineProps({
    old_testament_books: Object,
    new_testament_books: Object,
    language: String,
    version: String,
    verses: Array
})
</script>

<template>

    <Head title="Selected Verses" />
    <BibleLayout :old_testament_books="old_testament_books" :new_testament_books="new_testament_books"
        :language="language" :version="version" :bible_type="`${language}__${version}`">
        <div class="container">
            <div v-for="(versesByBook, bookName) in verses" :key="bookName" class="book-section">
                <h5>{{ bookName }}</h5>
                <div v-for="verse in versesByBook" :key="verse.id" class="my-2"
                    :style="{ 'background-color': verse.highlight_color, 'border-radius': '10px', 'padding': '0 5px' }">
                    <span>{{ verse.chapter }}:{{ verse.verse }} - {{ verse.text
                        }}</span>
                </div>
            </div>
        </div>
    </BibleLayout>
</template>

<style scoped>
.container {
    padding: 20px;
}

.book-section {
    margin-bottom: 20px;
}
</style>
