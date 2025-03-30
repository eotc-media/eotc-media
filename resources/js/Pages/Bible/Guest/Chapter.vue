<script setup>
import { router } from '@inertiajs/vue3'
import BibleLayout from '@/Layouts/Bible/BibleLayout.vue'
import { ref, toRefs, computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
const page = usePage()
const user = computed(() => page.props.auth.user)
const props = defineProps({
    current_book: Object,
    current_chapter: String,
    current_book_name: String,
    old_testament_books: Object,
    new_testament_books: Object,
    language: String,
    version: String,
    verses: Object,
    chapter_numbers: Array,
    dir: String,
    selected_verse: String
})
const { verses, selected_verse } = toRefs(props);
props.verses.forEach((verse) => {
    if (verse.verse == props.selected_verse) {
        verse.selected = true;
    } else {
        verse.selected = false;
    }
});
const toggleVerseSelection = (verse) => {
    verse.selected = !verse.selected
}
const changeChapter = (chapter) => {
    router.visit(route('bible.show_chapter', {
        'language': props.language,
        'version': props.version,
        'book': props.current_book.id,
        'chapter': chapter
    }), {
        method: 'get',
    });
}

const show = ref(false);
const optionsComponent = {
    zIndex: 3,
    minWidth: 150,
    x: 500,
    y: 200,
};

const onButtonClick = (e) => {
    // Show component mode menu
    show.value = true;
    optionsComponent.x = e.x;
    optionsComponent.y = e.y;
}

const highlightVerse = (color) => {

    // Filter the selected verses
    const selectedVerses = props.verses.filter((verse) => verse.selected);

    // Apply the highlight color to selected verses
    selectedVerses.forEach((verse) => {
        verse.highlight = color
    })

    // Prepare data for saving to the database
    const verseData = selectedVerses.map((verse) => {
        return {
            user_id: 1, // Replace this with actual user ID
            book_id: props.current_book.id,
            chapter: props.current_chapter,
            verse: verse.verse,
            color: color
        }
    })

    // Make the API call to save to database
    saveVersesToDatabase(verseData)
}

const saveVersesToDatabase = (data) => {
    router.post(route('bible.highlight.store'), data, {
        preserveScroll: true,
    })
}

const copySelectedVerses = () => {
    let selectedVerses = props.verses.filter((verse) => verse.selected);

    let selectedText = '';

    if (selectedVerses.length === 1) {
        // Format for a single verse
        let verse = selectedVerses[0];
        selectedText += `"${verse.text}"\n${props.current_book_name} ${props.current_chapter}:${verse.verse}`;
    } else {
        // Format for multiple verses
        selectedText = `${props.current_book_name} ${props.current_chapter}\n-------------\n`;
        selectedVerses.forEach((verse) => {
            selectedText += `${verse.verse} ${verse.text}\n`;
        });
    }

    // Copy to clipboard
    navigator.clipboard.writeText(selectedText)
        .then(() => {
            // Show notification
            const notification = document.getElementById("notification");
            notification.style.display = "block";

            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.style.display = "none";
            }, 3000);
        })
        .catch(err => {
            console.log('Could not copy text: ', err);
        });
};

const onMenuClick = (id, color = null) => {
    if (id == 0) {
        copySelectedVerses()
    } else if (id == 1 || id == 2 || id == 3 || id == 4 || id == 5 || id == 6) {
        highlightVerse(color)
    }
}
</script>

<template>

    <Head title="Chapter" />

    <BibleLayout :old_testament_books="old_testament_books" :new_testament_books="new_testament_books"
        :language="language" :version="version" :current_book="current_book" :bible_type="`${language}__${version}`"
        :dir="dir" :current_chapter="current_chapter">
        <div id="notification" class="rounded"
            style="display: none; position: fixed; top: 60px; right: 10px; background: #c7e3f5; padding: 5px 10px;">
            Verses copied!
        </div>
        <div class="row">
            <div class="container" :class="dir == 'rtl' ? 'text-right' : ''">
                <div class="col-md-10 offset-md-1">
                    <h3 class="my-2">{{ current_book_name }}</h3>
                    <button class="btn-outline-primary chapter-link" :class="{ active: current_chapter == chapter }"
                        v-for="chapter in chapter_numbers" @click="changeChapter(chapter)">
                        {{ chapter }}
                    </button>
                    <hr>
                </div>
                <svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg" hidden>
                    <!-- Your icon -->
                    <symbol id="icon-copy" viewBox="0 0 600 600">
                        <path
                            d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H96V128H64z" />
                    </symbol>
                    <symbol id="icon-highlight" viewBox="0 0 600 600">
                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                    </symbol>
                    <symbol id="icon-highlight-2" viewBox="0 0 600 600">
                        <circle cx="300" cy="300" r="250" fill="none" stroke="black" stroke-width="40" />
                        <line x1="100" y1="100" x2="500" y2="500" stroke="black" stroke-width="40" />
                    </symbol>
                </svg>
                <context-menu v-model:show="show" :options="optionsComponent">
                    <context-menu-item label="Copy" svgIcon="#icon-copy" @click="onMenuClick(0)" />
                    <context-menu-sperator />
                    <context-menu-group label="Highlight">
                        <context-menu-item label="None" svgIcon="#icon-highlight-2"
                            @click="onMenuClick(1, '#ffffff')" />
                        <context-menu-item label="Yellow (light)" svgIcon="#icon-highlight"
                            :svgProps="{ fill: '#FFF7A7' }" @click="onMenuClick(2, '#FFF7A7')" />
                        <context-menu-item label="Yellow (bright)" svgIcon="#icon-highlight"
                            :svgProps="{ fill: '#F7D42F' }" @click="onMenuClick(2, '#F7D42F')" />
                        <context-menu-item label="Green" svgIcon="#icon-highlight" :svgProps="{ fill: '#2FF78D' }"
                            @click="onMenuClick(3, '#2FF78D')" />
                        <context-menu-item label="Light blue" svgIcon="#icon-highlight" :svgProps="{ fill: '#2F99F7' }"
                            @click="onMenuClick(4, '#2F99F7')" />
                        <context-menu-item label="Pink" svgIcon="#icon-highlight" :svgProps="{ fill: '#2FF7F1' }"
                            @click="onMenuClick(5, '#2FF7F1')" />
                        <context-menu-item label="Red" svgIcon="#icon-highlight" :svgProps="{ fill: '#F72F35' }"
                            @click="onMenuClick(6, '#F72F35')" />
                    </context-menu-group>
                </context-menu>
                <div class="col-md-10 offset-md-1 my-4">
                    <h4 class="mb-4">
                        <template v-if="language == 'english'">Chapter</template>
                        <template v-if="language == 'geez'">ምዕራፍ</template>
                        <template v-if="language == 'amharic'">ምዕራፍ</template>
                        <template v-if="language == 'oromifa'">Boqonnaa</template>
                        <template v-if="language == 'tigrigna'">ምዕራፍ</template>
                        <template v-if="language == 'hebrew-greek' && current_book.id < 40" :dir="dir">פרק</template>
                        <template v-if="language == 'hebrew-greek' && current_book.id >= 40">Κεφάλαιο</template>
                        <template v-if="language == 'greek'">Κεφάλαιο</template>
                        {{ current_chapter }}
                    </h4>
                    <template v-if="language == 'amharic'">
                        <template v-for="( verse, index ) in  verses " :key="verse.id">
                            <span
                                :style="{ 'background-color': verse.highlight ? verse.highlight : '', 'border-radius': '10px', 'padding': '0 5px' }">
                                <span :class="{ 'selected-verse': verse.selected }" @click="toggleVerseSelection(verse)"
                                    class="verse-text" :id="verse.verse"
                                    v-if="verse.text.includes('see') || verse.text.replace(/\s+/g, '') == '' || verse.text.replace(/\s+/g, '') == '፤' || verse.text.replace(/\s+/g, '') == '-'">
                                    {{ verse.verse }} ፣
                                </span>
                                <span oncontextmenu="return false;"
                                    @contextmenu="verse.selected ? onButtonClick($event) : ''"
                                    :class="{ 'selected-verse': verse.selected }" @click="toggleVerseSelection(verse)"
                                    class="verse-text" :id="verse.verse" v-else>
                                    <span class="me-1">{{ verse.verse }}</span> {{ verse.text }}
                                    <br>
                                </span>
                            </span>
                        </template>
                    </template>
                    <template v-else>
                        <template v-for="( verse, index ) in  verses " :key="verse.id">
                            <div
                                :style="{ 'background-color': verse.highlight ? verse.highlight : '', 'border-radius': '10px', 'padding': '0 5px' }">
                                <span :class="{ 'selected-verse': verse.selected }" @click="toggleVerseSelection(verse)"
                                    :dir="dir" class="verse-text" :id="verse.verse"
                                    v-if="verse.text.replace(/\s+/g, '') == '' || verse.text.replace(/\s+/g, '') == '-'">
                                    {{ verse.verse }} ፣
                                </span>
                                <span oncontextmenu="return false;"
                                    @contextmenu="verse.selected ? onButtonClick($event) : ''"
                                    :class="{ 'selected-verse': verse.selected }" @click="toggleVerseSelection(verse)"
                                    :dir="dir" class="verse-text" :id="verse.verse" v-else>
                                    <span class="me-1">{{ verse.verse }}</span> {{ verse.text }}
                                    <br>
                                </span>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
            <div class="container col-md-10 offset-md-1 my-4">
                <button class="btn-floating" :disabled="current_chapter == 1"
                    @click="changeChapter(parseInt(current_chapter) - 1)"><i
                        class="fa-solid fa-chevron-left"></i></button>
                <button :disabled="current_chapter == chapter_numbers.length" class="btn-floating btn-next"
                    @click="changeChapter(parseInt(current_chapter) + 1)"><i
                        class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>
    </BibleLayout>
</template>

<style scoped>
.chapter-link {
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 0.2rem;
}

.verse-text {
    line-height: 2;
}

.verse-text:hover {
    cursor: pointer;
}

.selected-verse {
    background-color: #c7e3f5;
}

hr {
    border-color: black;
}

button.chapter-link {
    border: 0.01rem solid lightblue;
    margin: 0.1rem;
    padding: 0.1rem;
}

.btn-floating {
    position: fixed;
    width: 45px;
    height: 45px;
    bottom: 7px;
    background-color: #ffffff;
    color: #0d6efd;
    border-radius: 50px;
    border-color: lightblue;
    text-align: center;
    box-shadow: 2px 2px 3px #999;
}

.btn-floating:hover {
    background-color: #0d6efd;
    color: #ffffff;
}

.btn-floating:disabled {
    background-color: lightgray;
    color: black;
}

@media (min-width: 900px) {
    .btn-next {
        right: 10rem;
    }
}

@media (min-width: 768px),
(max-width: 899.98px) {
    .btn-next {
        right: 10rem;
    }
}

@media (max-width: 767.98px) {
    .btn-next {
        right: 1rem;
    }
}
</style>
