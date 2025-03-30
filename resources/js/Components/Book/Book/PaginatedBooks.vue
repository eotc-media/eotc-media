<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
    books: Array,
    perPage: Number,
    maxDisplayedPages: Number
})

const currentPage = ref(1);

watch(() => props.books, () => {
    currentPage.value = 1;
});

const totalPages = computed(() => {
    return Math.ceil(props.books.length / props.perPage);
});

const paginatedBooks = computed(() => {
    const start = (currentPage.value - 1) * props.perPage;
    const end = start + props.perPage;
    return props.books.slice(start, end);
});

const pageChunks = computed(() => {
    const chunks = [];
    const maxDisplayedPages = props.maxDisplayedPages || 5;

    if (totalPages.value <= maxDisplayedPages) {
        chunks.push([...Array(totalPages.value).keys()].map(x => x + 1));
    } else {
        let chunk = [];
        let i = 1;
        let j = 0;
        while (i <= totalPages.value) {
            chunk.push(i);
            j++;
            if (j >= maxDisplayedPages) {
                chunks.push(chunk);
                chunk = [];
                j = 0;
                i++;
            } else {
                i++;
            }
        }
        if (chunk.length > 0) {
            chunks.push(chunk);
        }
    }

    return chunks;
});

const displayedPages = computed(() => {
    if (totalPages.value <= 1) {
        return [];
    } else if (totalPages.value <= props.maxDisplayedPages) {
        return [...Array(totalPages.value).keys()].map(x => x + 1);
    } else {
        const chunkIndex = Math.floor((currentPage.value - 1) / props.maxDisplayedPages);
        const chunk = pageChunks.value[chunkIndex];
        const firstPage = chunk[0];
        const lastPage = chunk[chunk.length - 1];
        const pages = [];
        if (chunkIndex > 0) {
            pages.push('...');
        }
        pages.push(...chunk);
        if (lastPage < totalPages.value) {
            pages.push('...');
        }
        return pages;
    }
});

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

onMounted(() => {
    currentPage.value = 1;
});
</script>

<template>
    <div class="row">
        <div class="col-3">
            <div class="mx-2">
                {{ books.length }} books
            </div>
        </div>
        <div class="col-9">
            <ul class="pagination justify-content-end">
                <li class="page-item"><button class="page-link" :disabled="currentPage === 1"
                        @click="prevPage">Prev</button></li>
                <template v-for="page in displayedPages">
                    <template v-if="page === '...'">
                        <li class="page-item"><button class="page-link" :key="page">{{ page }}</button>
                        </li>
                    </template>
                    <template v-else>
                        <li class="page-item"><button class="page-link" :key="page"
                                :class="{ active: page === currentPage }" @click="currentPage = page">{{ page
                                }}</button>
                        </li>
                    </template>
                </template>
                <li class="page-item"><button class="page-link" :disabled="currentPage === totalPages"
                        @click="nextPage">Next</button>
                </li>
            </ul>
        </div>
    </div>
    <div class="mb-4 mt-1">
        <div v-for="book in paginatedBooks" :key="book.id">
            <div class="card table-responsive">
                <div class="card-body">
                    <div class="row">
                        <div class="col-9">
                            <Link :href="route('book.books.view', book.id)">
                            <h4>{{ book.name }}</h4>
                            </Link>
                            <p class="font-italic mb-0">By:
                                <template v-for="author in book.authors" :key="author.id">
                                    <Link class="me-2" :href="route('books.author_books', author.id)">{{
                    author.name
                }}</Link>
                                </template>
                            </p>
                            <p class="font-italic mb-0">Category:
                                {{ book.categories.map((category) => category.name).join(', ') }}
                            </p>
                            <p class="font-italic mb-0">Sub-category:
                                {{ book.sub_categories.map((sub_category) => sub_category.name).join(', ') }}
                            </p>
                        </div>
                        <div class="col-3 d-flex justify-content-end">
                            <img :src="'/storage/book/image/' + book.image" alt="">
                        </div>
                    </div>
                </div>
                <div class="card-footer pb-0">
                    <div class="row">
                        <div class="col-6 text-start">
                            <p>{{ book.likes_count }} likes | {{ book.comments_count }} comments</p>
                        </div>
                        <div class="col-6 text-end">
                            <a target="_blank" :href="'/storage/book/file/' + book.file">Download</a>
                            <Link class="ml-4 d-md-none" :href="route('book.books.view', book.id)">Details</Link>
                            <Link class="ml-4 d-none d-md-inline" :href="route('book.books.view', book.id)">View details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-9 offset-3">
            <ul class="pagination justify-content-end">
                <li class="page-item"><button class="page-link" :disabled="currentPage === 1"
                        @click="prevPage">Prev</button></li>
                <template v-for="page in displayedPages">
                    <template v-if="page === '...'">
                        <li class="page-item"><button class="page-link" :key="page">{{ page }}</button>
                        </li>
                    </template>
                    <template v-else>
                        <li class="page-item"><button class="page-link" :key="page"
                                :class="{ active: page === currentPage }" @click="currentPage = page">{{ page
                                }}</button>
                        </li>
                    </template>
                </template>
                <li class="page-item"><button class="page-link" :disabled="currentPage === totalPages"
                        @click="nextPage">Next</button></li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
h4 {
    font-size: 1.3rem;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
}

img {
    height: 100px;
}

a h4 {
    color: black;
}
</style>