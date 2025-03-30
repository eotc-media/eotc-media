<script setup>
import { useForm } from '@inertiajs/vue3'
import { computed } from '@vue/runtime-core'
import BookCard from '@/Components/Book/Book/BookCard.vue'
const props = defineProps({
    author: Object,
    books: Object,
    languages: Object
})
const filtered_books = computed(() => {
    const lang_filtered = form.language_slug ? props.books.filter((book) => book.languages.map((language) => language.slug).includes(form.language_slug)) : props.books
    const cat_filtered = form.category_slug ? lang_filtered.filter((book) => book.categories.map((category) => category.slug).includes(form.category_slug)) : lang_filtered
    const subcat_filtered = form.sub_category_slug ? cat_filtered.filter((book) => book.sub_categories.map((sub_category) => sub_category.slug).includes(form.sub_category_slug)) : cat_filtered
    return subcat_filtered
})
const form = useForm({
    language_slug: '',
    category_slug: '',
    sub_category_slug: ''
})
const categories = computed(() => {
    const selected_language = props.languages.filter((language) => language.slug == form.language_slug)
    return selected_language.map((language) => language.categories)[0]
})
const sub_categories = computed(() => {
    if (categories.value) {
        const selected_category = categories.value.filter((category) => category.slug == form.category_slug)
        return selected_category.map((category) => category.sub_categories)[0]
    }
})
const resetCategory = () => {
    form.reset('category_slug')
    form.reset('sub_category_slug')
}
const resetSubCategory = () => form.reset('sub_category_slug')
const submit = () => {
    form.post(route('guest.books.filter'), {
        onFinish: () => {
            form.reset()
        },
    })
}
</script>

<script>
import UserLayout from '@/Layouts/Book/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>
    <div class="py-3">
        <div class="card">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-1">
                        <div class="input-group mb-3">
                            <select id="language_slug" name="language_slug" class="form-control"
                                v-model="form.language_slug" @input="resetCategory" required>
                                <option value="">Select language</option>
                                <option v-for="language in languages" :value="language.slug" :key="language.id">
                                    {{ language.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 my-1">
                        <div class="input-group mb-3">
                            <select id="category_slug" name="category_slug" class="form-control"
                                v-model="form.category_slug" @input="resetSubCategory" required>
                                <option value="">Select category</option>
                                <template v-if="categories">
                                    <option v-for="category in categories" :value="category.slug" :key="category.id">
                                        {{ category.name }}</option>
                                </template>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 my-1">
                        <div class="input-group mb-3">
                            <select id="sub_category_slug" name="sub_category_slug" class="form-control"
                                v-model="form.sub_category_slug" required>
                                <option value="">Select sub category</option>
                                <template v-if="sub_categories">
                                    <option v-for="sub_category in sub_categories" :value="sub_category.slug"
                                        :key="sub_category.id">
                                        {{ sub_category.name }}</option>
                                </template>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mx-2 my-4">
            Books by {{ author.name }} ({{ filtered_books.length }} books found)
            <Link :href="route('book.books.index', { language: 0, category: 0, sub_category: 0 })">Back to main list
            </Link>
        </div>
        <div class="mb-4 mt-1">
            <div v-for="book in filtered_books" :key="book.id">
                <book-card :book="book" />
            </div>
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
</style>