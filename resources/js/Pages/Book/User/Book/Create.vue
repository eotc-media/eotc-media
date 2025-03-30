<script setup>
import { useForm } from '@inertiajs/vue3'
import Req from '@/Components/General/RequiredIndicator.vue'
import InputError from '@/Components/General/InputError.vue'
import { computed } from '@vue/runtime-core'
const props = defineProps({
    languages: Object
})
const form = useForm({
    language_id: [],
    category_id: [],
    sub_category_id: [],
    name: '',
    author: '',
    file: '',
    image: '',
    description: '',
})
const categories = computed(() => {
    let selected_languages = []
    form.language_id.forEach((lan_id) => {
        selected_languages.push(props.languages.filter((language) => language.id == lan_id))
    })
    let all_categories = []
    selected_languages.forEach((selected_language) => {
        all_categories.push(...selected_language.map((language) => {
            let modified_categories = language.categories
            modified_categories = modified_categories.map(modified_category => {
                if (selected_languages.length > 1) {
                    modified_category.label_name = `${modified_category.name} (${language.name})`
                } else {
                    modified_category.label_name = modified_category.name
                }
                return modified_category
            })
            return modified_categories
        })[0])
    })
    return all_categories
})
const sub_categories = computed(() => {
    if (categories.value) {
        let selected_categories = []
        form.category_id.forEach((cat_id) => {
            selected_categories.push(categories.value.filter((category) => category.id == cat_id))
        })
        let all_sub_categories = []
        selected_categories.forEach((selected_category) => {
            all_sub_categories.push(...selected_category.map((category) => {
                let modified_sub_categories = category.sub_categories
                modified_sub_categories = modified_sub_categories.map(modified_sub_category => {
                    if (selected_categories.length > 1) {
                        modified_sub_category.label_name = `${modified_sub_category.name} (${category.name})`
                    } else {
                        modified_sub_category.label_name = modified_sub_category.name
                    }
                    return modified_sub_category
                })
                return modified_sub_categories
            })[0])
        })
        return all_sub_categories
    }
})
const resetCategory = () => form.reset('category_id')
const resetSubCategory = () => form.reset('sub_category_id')
const submit = () => {
    form.post(route('book.user.books.store'), {
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
    <form @submit.prevent="submit">
        <div class="card">
            <div class="card-header">
                <h4 class="font-weight-normal">Upload New Book</h4>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-lg-6">
                        <label for="language_id">Language
                            <Req />
                        </label>
                        <div class="container-fluid form-group mb-3">
                            <v-select multiple :options="languages" label="name" :reduce="language => language.id"
                                v-model="form.language_id">
                            </v-select>
                        </div>
                        <InputError :message="form.errors.language_id"></InputError>
                        <label for="category_id">Category
                            <Req />
                        </label>
                        <div class="container-fluid form-group mb-3">
                            <v-select multiple :options="categories" :reduce="category => category.id"
                                label="label_name" v-model="form.category_id" required>
                            </v-select>
                        </div>
                        <InputError :message="form.errors.category_id"></InputError>
                        <label for="sub_category_id">Sub category
                            <Req />
                        </label>
                        <div class="container-fluid form-group mb-3">
                            <v-select multiple :options="sub_categories" label="label_name"
                                :reduce="sub_category => sub_category.id" v-model="form.sub_category_id">
                            </v-select>
                        </div>
                        <InputError :message="form.errors.sub_category_id"></InputError>
                        <div class="container-fluid form-group">
                            <label for="name">Book name
                                <Req />
                            </label>
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <i class="fa-solid fa-book"></i></span>
                                <input id="name" type="text" class="form-control" v-model="form.name" name="name"
                                    placeholder="Book name" required autocomplete="name">
                            </div>
                            <InputError :message="form.errors.name"></InputError>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="container-fluid form-group">
                            <label for="author">Author full name
                                <Req />
                            </label>
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <i class="fa-solid fa-user"></i></span>
                                <input id="author" type="text" class="form-control" v-model="form.author" name="author"
                                    placeholder="Author full name" required autocomplete="author">
                            </div>
                            <InputError :message="form.errors.author"></InputError>
                        </div>
                        <div class="container-fluid form-group">
                            <label for="file" class="mb-0">Book file in pdf
                                <Req />
                            </label>
                            <div><small>Max size 30MB. Please compress your file for better
                                    serving.</small></div>
                            <div><small><a href="https://www.ilovepdf.com/compress_pdf" target="_blank">You can use this
                                        link to
                                        compress your pdf file</a></small></div>
                            <div class="input-group mb-3"><span class="input-group-text d-none d-md-flex">
                                    <i class="fa-solid fa-file"></i></span>
                                <input type="file" accept="file/*" @input="form.file = $event.target.files[0]"
                                    required />
                                <progress v-if="form.progress" :value="form.progress.percentage" max="100">
                                    {{ form.progress.percentage }}%
                                </progress>
                            </div>
                            <InputError :message="form.errors.file"></InputError>
                        </div>
                        <div class="container-fluid form-group">
                            <label for="image" class="mb-0">Book cover image
                                <Req />
                            </label>
                            <div><small>Max size 10MB. Please compress your image for better
                                    serving.</small></div>
                            <div><small><a href="https://www.iloveimg.com/compress-image" target="_blank">You can use
                                        this link to
                                        compress your image</a></small></div>
                            <div class="input-group mb-3"><span class="input-group-text d-none d-md-flex">
                                    <i class="fa-solid fa-image"></i></span>
                                <input type="file" accept="image/*" @input="form.image = $event.target.files[0]"
                                    required />
                                <progress v-if="form.progress" :value="form.progress.percentage" max="100">
                                    {{ form.progress.percentage }}%
                                </progress>
                            </div>
                            <InputError :message="form.errors.image"></InputError>
                        </div>
                    </div>
                </div>
                <div class="container-fluid form-group">
                    <label for="description">Description</label>
                    <div class="input-group mb-3">
                        <textarea id="description" class="form-control" v-model="form.description" name="description"
                            placeholder="Book description (optional)" autocomplete="description"
                            style="min-height: 100px"></textarea>
                    </div>
                    <InputError :message="form.errors.description"></InputError>
                </div>
            </div>
        </div>
        <div class="text-right pt-3 mb-3">
            <Link :href="route('book.user.books.index')" class="btn btn-outline-primary mr-2">Back</Link>
            <button type="submit" class="btn btn-primary mr-2">Upload
            </button>
        </div>
    </form>
</template>