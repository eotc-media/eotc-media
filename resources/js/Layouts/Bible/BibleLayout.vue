<script>
import $ from 'jquery';
export default {
    mounted() {
        $('[data-widget="treeview"]').Treeview('init');
    }
}
</script>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useForm } from '@inertiajs/vue3'

// Define a reference for the sidebar
const sidebar = ref(null)

// Variable to hold the scroll position key in sessionStorage
const SCROLL_KEY = 'sidebarScrollTop'

// Function to handle scroll events
const handleScroll = (event) => {
    if (sidebar.value) {
        sessionStorage.setItem(SCROLL_KEY, sidebar.value.scrollTop)
    }
}

// Lifecycle hook: When the component is mounted
onMounted(() => {
    if (sidebar.value) {
        // Restore the scroll position if it exists
        const savedScrollTop = sessionStorage.getItem(SCROLL_KEY)
        if (savedScrollTop !== null) {
            sidebar.value.scrollTop = parseInt(savedScrollTop, 10)
        }

        // Add scroll event listener
        sidebar.value.addEventListener('scroll', handleScroll)
    }
})

// Lifecycle hook: Before the component is unmounted
onBeforeUnmount(() => {
    if (sidebar.value) {
        // Remove scroll event listener
        sidebar.value.removeEventListener('scroll', handleScroll)

        // Save the current scroll position
        sessionStorage.setItem(SCROLL_KEY, sidebar.value.scrollTop)
    }
})

// Rest of your existing script
const props = defineProps({
    language: String,
    version: String,
    current_book: Object,
    old_testament_books: Object,
    new_testament_books: Object,
    dir: String,
    search: String,
    search_scope: String,
    current_chapter: String
})

const hideSidebar = () => {
    if (window.innerWidth <= 768) {
        document.body.classList.add('sidebar-closed', 'sidebar-collapse')
        document.body.classList.remove('sidebar-open')
    }
}

const bibleTypeForm = useForm({
    'bible_type': `${props.language}__${props.version}`
})

const changeBookForm = useForm({})
const form = useForm({
    search: props.search,
    search_bible_type: `${props.language}__${props.version}`,
    search_scope: props.search_scope ? props.search_scope : 'current_book'
})

const submit = () => {
    const [language, version] = bibleTypeForm.bible_type.split("__")

    bibleTypeForm.get(route('bible.show_chapter', {
        'language': language,
        'version': version,
        'book': props.current_book.id,
        'chapter': props.current_chapter
    }), {
        onFinish: () => {
            form.reset()
        },
    })
}

const submitSelect = () => {
    const [language, version] = bibleTypeForm.bible_type.split("__")

    bibleTypeForm.get(route('bible.selected_verses.show', {
        'language': language,
        'version': version,
    }), {
        onFinish: () => {
            form.reset()
        },
    })
}

const change_book = (id) => {
    changeBookForm.get(route('bible.show_chapter', {
        'language': props.language,
        'version': 'kjv',
        'book': id,
        'chapter': 1
    }))
}

const search = () => {
    form.get(route('bible.search', {
        'search': form.search,
        'search_bible_type': form.search_bible_type,
        'search_scope': form.search_scope,
        'current_book_id': props.current_book.id
    }))
}
</script>

<template>
    <div class="wrapper">

        <!-- Navbar -->
        <nav class="main-header navbar navbar-expand bg-white navbar-light border-bottom">
            <template v-if="$page.url.startsWith('/bible/search')">
                <div class="row w-100">
                    <div class="container" :class="dir == 'rtl' ? 'text-right' : ''">
                        <div class="col-md-10 offset-md-1">
                            <div class="search-wrapper ms-md-2">
                                <input type="text" placeholder="Search..." v-model="form.search"
                                    @keydown.enter="search">
                                <Link class="search-button mx-2"
                                    :href="route('bible.search', { 'search': form.search, 'search_bible_type': form.search_bible_type, 'search_scope': form.search_scope, 'current_book_id': current_book.id })">
                                <i class="fa-solid fa-search"></i>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template v-else>
                <!-- Left navbar links -->
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" data-widget="pushmenu" href="#"><i class="fa fa-bars"></i></a>
                    </li>
                    <li class="nav-item">
                        <Link :href="route('welcome')" class="nav-link">ዋና ገጽ</Link>
                    </li>
                </ul>

                <!-- Right navbar links -->
                <ul class="navbar-nav ml-auto">
                    <select v-if="$page.url.startsWith('/bible/seleted-verses')" id="search_bible_type"
                        name="search_bible_type" class="form-control px-2 px-md-5" v-model="bibleTypeForm.bible_type"
                        @change="submitSelect">
                        <option value="">Select Bible</option>
                        <option value="amharic__1954">Amharic (1954)</option>
                        <option value="oromifa__v1">Afaan Oromo</option>
                        <option value="english__kjv">English (KJV)</option>
                        <option value="hebrew-greek__masoretic-textus-receptus">Hebrew - Greek</option>
                        <option value="greek__septuagint">Greek (Septuagint)</option>
                    </select>
                    <select v-else id="search_bible_type" name="search_bible_type" class="form-control px-2 px-md-5"
                        v-model="bibleTypeForm.bible_type" @change="submit">
                        <option value="">Select Bible</option>
                        <option value="amharic__1954">Amharic (1954)</option>
                        <option value="oromifa__v1">Afaan Oromo</option>
                        <option value="english__kjv">English (KJV)</option>
                        <option value="hebrew-greek__masoretic-textus-receptus">Hebrew - Greek</option>
                        <option value="greek__septuagint">Greek (Septuagint)</option>
                    </select>
                    <div class="btn-group dropstart" v-if="$page.props.auth.user">
                        <a class="ms-2 ms-md-4" data-bs-toggle="dropdown" href="#" data-bs-display="static"
                            aria-expanded="false">
                            <img v-if="$page.props.auth.user.image"
                                :src="'/storage/user/image/' + $page.props.auth.user.image" class="rounded-circle"
                                height="30" alt="img" loading="lazy" />
                            <img v-else src="/storage/user/image/default.jpg" class="rounded-circle" height="35"
                                alt="img" loading="lazy" />
                        </a>
                        <ul class="dropdown-menu dropdown-menu-start dropdown-menu-lg-start">
                            <li>
                                <Link class="dropdown-item" :href="route('logout')" method="post">
                                Logout
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <li class="nav-item dropdown">
                        <a class="nav-link" href="#" id="dropdownMenu" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fa fa-ellipsis-v"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenu">
                            <li>
                                <Link class="dropdown-item"
                                    :href="route('bible.selected_verses.show', { 'language': language, 'version': version })">
                                የተመረጡ ጥቅሶች
                                </Link>
                            </li>
                            <li>
                                <Link class="dropdown-item" :href="route('feedbacks.create')">አስተያየት</Link>
                            </li>
                            <li v-if="!$page.url.startsWith('/bible/seleted-verses')">
                                <Link class="dropdown-item"
                                    :href="route('bible.search', { 'search': '', 'search_bible_type': form.search_bible_type, 'search_scope': form.search_scope, 'current_book_id': current_book.id })">
                                <i class="fa-solid fa-magnifying-glass"></i> Search
                                </Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </template>
        </nav>
        <!-- /.navbar -->

        <!-- Main Sidebar Container -->
        <aside class="main-sidebar sidebar-dark-gray elevation-3">
            <a href="#" class="brand-link">
                <span v-if="language == 'english'" class="brand-text font-weight-light mx-4">Holy Bible</span>
                <span v-if="language == 'geez'" class="brand-text font-weight-light mx-4">መፅሃፍ ቅዱስ</span>
                <span v-if="language == 'amharic'" class="brand-text font-weight-light mx-4">መፅሃፍ ቅዱስ</span>
                <span v-if="language == 'oromifa'" class="brand-text font-weight-light mx-4">Macaafa Qulqulluu</span>
                <span v-if="language == 'hebrew-greek'" class="brand-text font-weight-light mx-4">Holy Bible</span>
                <span v-if="language == 'greek'" class="brand-text font-weight-light mx-4">Holy Bible</span>
            </a>

            <!-- Sidebar -->
            <div class="sidebar" ref="sidebar">

                <!-- Sidebar Menu -->
                <nav class="mt-2">
                    <ul v-if="language == 'english'" class="nav nav-pills nav-sidebar flex-column"
                        data-widget="treeview" role="menu" data-accordion="false">
                        <li class="nav-header">OLD TESTAMENT</li>
                        <li v-for="(book, index) in old_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link @click="change_book(book.id)" class="nav-link" href="#"
                                :class="{ 'active': $page.url.includes(`/book/${book.id}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.english_name }}</p>
                            </Link>
                        </li>
                        <hr>
                        <li class="nav-header">NEW TESTAMENT</li>
                        <li v-for="(book, index) in new_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'kjv', 'book': book.id, 'chapter': 1 })"
                                class="nav-link" :class="{ 'active': $page.url.includes(`/book/${book.id}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.english_name }}</p>
                            </Link>
                        </li>
                    </ul>
                    <ul v-if="language == 'geez'" class="nav nav-pills nav-sidebar flex-column" data-widget="treeview"
                        role="menu" data-accordion="false">
                        <li class="nav-header">ብሉይ ኪዳን</li>
                        <li v-for="(book, index) in old_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'v1', 'book': book.id, 'chapter': 1 })"
                                class="nav-link"
                                :class="{ 'active': $page.url.includes(`/book/${encodeURIComponent(book.id)}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.amharic_name }}</p>
                            </Link>
                        </li>
                        <hr>
                        <li class="nav-header">አዲስ ኪዳን</li>
                        <li v-for="(book, index) in new_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'v1', 'book': book.id, 'chapter': 1 })"
                                class="nav-link"
                                :class="{ 'active': $page.url.includes(`/book/${encodeURIComponent(book.id)}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.amharic_name }}</p>
                            </Link>
                        </li>
                    </ul>
                    <ul v-if="language == 'amharic'" class="nav nav-pills nav-sidebar flex-column"
                        data-widget="treeview" role="menu" data-accordion="false">
                        <li class="nav-header">ብሉይ ኪዳን</li>
                        <li v-for="(book, index) in old_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': '1954', 'book': book.id, 'chapter': 1 })"
                                class="nav-link"
                                :class="{ 'active': $page.url.includes(`/book/${encodeURIComponent(book.id)}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.amharic_name }}</p>
                            </Link>
                        </li>
                        <hr>
                        <li class="nav-header">አዲስ ኪዳን</li>
                        <li v-for="(book, index) in new_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': '1954', 'book': book.id, 'chapter': 1 })"
                                class="nav-link"
                                :class="{ 'active': $page.url.includes(`/book/${encodeURIComponent(book.id)}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.amharic_name }}</p>
                            </Link>
                        </li>
                    </ul>
                    <ul v-if="language == 'oromifa'" class="nav nav-pills nav-sidebar flex-column"
                        data-widget="treeview" role="menu" data-accordion="false">
                        <li class="nav-header">Kakuu Duraa</li>
                        <li v-for="(book, index) in old_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'v1', 'book': book.id, 'chapter': 1 })"
                                class="nav-link" :class="{ 'active': $page.url.includes(`/book/${book.id}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.oromifa_name.length > 21 ? book.oromifa_name.substring(0, 18) + '...' :
                book.oromifa_name }}</p>
                            </Link>
                        </li>
                        <hr>
                        <li class="nav-header">Kakuu Haaraa</li>
                        <li v-for="(book, index) in new_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'v1', 'book': book.id, 'chapter': 1 })"
                                class="nav-link" :class="{ 'active': $page.url.includes(`/book/${book.id}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.oromifa_name.length > 21 ? book.oromifa_name.substring(0, 18) + '...' :
                book.oromifa_name }}</p>
                            </Link>
                        </li>
                    </ul>
                    <ul v-if="language == 'hebrew-greek'" class="nav nav-pills nav-sidebar flex-column"
                        data-widget="treeview" role="menu" data-accordion="false">
                        <li class="nav-header">OLD TESTAMENT</li>
                        <li v-for="(book, index) in old_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'masoretic-textus-receptus', 'book': book.id, 'chapter': 1 })"
                                class="nav-link"
                                :class="{ 'active': $page.url.includes(`/book/${encodeURIComponent(book.id)}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.hebrew_greek_name }}</p>
                            </Link>
                        </li>
                        <hr>
                        <li class="nav-header">NEW TESTAMENT</li>
                        <li v-for="(book, index) in new_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'masoretic-textus-receptus', 'book': book.id, 'chapter': 1 })"
                                class="nav-link"
                                :class="{ 'active': $page.url.includes(`/book/${encodeURIComponent(book.id)}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.hebrew_greek_name }}</p>
                            </Link>
                        </li>
                    </ul>
                    <ul v-if="language == 'greek'" class="nav nav-pills nav-sidebar flex-column" data-widget="treeview"
                        role="menu" data-accordion="false">
                        <li class="nav-header">OLD TESTAMENT</li>
                        <li v-for="(book, index) in old_testament_books" :key="book.id" class="nav-item"
                            @click="hideSidebar">
                            <Link
                                :href="route('bible.show_chapter', { 'language': language, 'version': 'septuagint', 'book': book.id, 'chapter': 1 })"
                                class="nav-link" :class="{ 'active': $page.url.includes(`/book/${book.id}/`) }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>{{ book.greek_name }}</p>
                            </Link>
                        </li>
                        <hr>
                    </ul>
                </nav>
                <!-- /.sidebar-menu -->
            </div>
            <!-- /.sidebar -->

        </aside>

        <!-- Content Wrapper. Contains page content -->
        <div class="content-wrapper">
            <div class="container-fluid py-3">
                <template v-if="$page.url.startsWith('/bible/search')">
                    <div class="row mx-1">
                        <div class="container" :class="dir == 'rtl' ? 'text-right' : ''">
                            <div class="col-md-10 offset-md-1">
                                <div class="row">
                                    <div class="col-6">
                                        <ul class="navbar-nav">
                                            <select id="bible_type" name="bible_type" class="form-control px-2"
                                                v-model="form.search_bible_type" @change="search">
                                                <option value="">Select Bible</option>
                                                <option value="english__kjv">English (KJV)</option>
                                                <option value="amharic__1954">Amharic (1954)</option>
                                                <option value="oromifa__v1">Afaan Oromo</option>
                                                <option value="hebrew-greek__masoretic-textus-receptus">Hebrew - Greek
                                                </option>
                                                <option value="greek__septuagint">Greek (Septuagint)</option>
                                            </select>
                                        </ul>
                                    </div>
                                    <div class="col-6">
                                        <ul class="navbar-nav">
                                            <select id="search_scope" name="search_scope" class="form-control px-2"
                                                v-model="form.search_scope" @change="search">
                                                <option value="">Search Scope</option>
                                                <option value="whole_bible">Whole Bible</option>
                                                <option value="old_testament">Old Testament</option>
                                                <option value="new_testament">New Testament</option>
                                                <option value="current_book">{{ current_book.english_name }}
                                                </option>
                                            </select>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="container" :class="dir == 'rtl' ? 'text-right' : ''">
                        <div class="col-md-10 offset-md-1 my-4">
                            <h5>Search in {{ form.search_scope.english_name }}</h5>
                        </div>
                    </div>
                </template>
                <slot />
            </div>
        </div>
        <!-- /.content-wrapper -->

        <!-- Main Footer -->
        <footer class="main-footer">
            <div class="additional-row">
                <!-- Add your content here -->
                <div class="highlighted-verse">
                    <!-- Display the highlighted verse here -->
                </div>
                <div class="verse-actions">

                </div>
            </div>
        </footer>
        <footer class="main-footer">
            <!-- Default to the left -->
            <strong>Copyright &copy; {{ new Date().getFullYear() }} <a href="https://eotcmedia.com" target="_blank">EOTC
                    Media</a>.</strong> All
            rights
            reserved.
        </footer>
    </div>
</template>

<style scoped>
hr {
    border-color: #ccc;
}

.search-wrapper {
    position: relative;
}

input[type="text"] {
    width: 100%;
    padding: 7px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.search-button {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background-color: transparent;
    border: none;
    cursor: pointer;
}
</style>
