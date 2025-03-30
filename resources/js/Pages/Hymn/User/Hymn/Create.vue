<script setup>
import { useForm } from '@inertiajs/vue3'
import Req from '@/Components/General/RequiredIndicator.vue'
import InputError from '@/Components/General/InputError.vue'
import { computed } from '@vue/runtime-core'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { component as ckeditor } from '@ckeditor/ckeditor5-vue'
const editorConfig = {
    toolbar: [
        'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
        'blockQuote', 'undo', 'redo'
    ],
    removePlugins: ['Table', 'MediaEmbed']
}
const props = defineProps({
    languages: Object
})
const form = useForm({
    language_id: [],
    category_id: [],
    sub_category_id: [],
    video_id: '',
    singer: '',
    lyrics: '',
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
const submit = () => {
    form.post(route('hymn.user.hymns.store'), {
        onFinish: () => {
            form.reset()
        },
    })
}
</script>
<script>
import UserLayout from '@/Layouts/Hymn/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Add Hymn" />

    <div class="container-fluid py-3">
        <form @submit.prevent="submit">
            <div class="card">
                <div class="card-header">
                    <h4 class="font-weight-normal">Add New Hymn</h4>
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
                        </div>
                        <div class="col-lg-6">
                            <div class="container-fluid form-group">
                                <label for="video_id">Video ID
                                    <Req />
                                </label>
                                <div class="input-group mb-3">
                                    <span class="input-group-text">
                                        <i class="fa-solid fa-user"></i></span>
                                    <input id="video_id" type="text" class="form-control" v-model="form.video_id"
                                        name="video_id" placeholder="Video ID" required autocomplete="video_id">
                                </div>
                                <InputError :message="form.errors.video_id"></InputError>
                            </div>
                            <div class="container-fluid form-group">
                                <label for="singer">Hymn singer/s</label>
                                <div class="input-group mb-3">
                                    <span class="input-group-text">
                                        <i class="fa-solid fa-microphone"></i></span>
                                    <input id="singer" type="text" class="form-control" v-model="form.singer"
                                        name="singer" placeholder="Hymn singer/s" autocomplete="singer">
                                </div>
                                <InputError :message="form.errors.singer"></InputError>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="container-fluid form-group">
                                <label for="lyrics">Lyrics</label>
                                <div class="ckeditor-wrapper">
                                    <ckeditor :editor="ClassicEditor" v-model="form.lyrics" :config="editorConfig">
                                    </ckeditor>
                                </div>
                                <InputError :message="form.errors.lyrics"></InputError>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="container-fluid form-group">
                                <label for="description">Description</label>
                                <div class="input-group mb-3">
                                    <textarea id="description" class="form-control" v-model="form.description"
                                        name="description" placeholder="Description (optional)"
                                        autocomplete="description" style="min-height: 100px"></textarea>
                                </div>
                                <InputError :message="form.errors.description"></InputError>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-right pt-3 mb-3">
                <Link :href="route('hymn.user.hymns.index')" class="btn btn-outline-primary mr-2">Back</Link>
                <button type="submit" class="btn btn-primary mr-2">Add
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.ckeditor-wrapper {
    width: 100%;
}
</style>
