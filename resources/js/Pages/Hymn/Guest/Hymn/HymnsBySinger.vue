<script setup>
import { useForm } from '@inertiajs/vue3'
import { computed } from '@vue/runtime-core'
import SingerHymnCard from '@/Components/Hymn/Hymn/SingerHymnCard.vue'
const props = defineProps({
    singer: Object,
    hymns: Object,
    languages: Object
})
const filtered_hymns = computed(() => {
    const lang_filtered = form.language_id ? props.hymns.filter((hymn) => hymn.languages.map((language) => language.id).includes(form.language_id)) : props.hymns
    const cat_filtered = form.category_id ? lang_filtered.filter((hymn) => hymn.categories.map((category) => category.id).includes(form.category_id)) : lang_filtered
    const subcat_filtered = form.sub_category_id ? cat_filtered.filter((hymn) => hymn.sub_categories.map((sub_category) => sub_category.id).includes(form.sub_category_id)) : cat_filtered
    return subcat_filtered
})
const form = useForm({
    language_id: '',
    category_id: '',
    sub_category_id: ''
})
const categories = computed(() => {
    const selected_language = props.languages.filter((language) => language.id == form.language_id)
    return selected_language.map((language) => language.categories)[0]
})
const sub_categories = computed(() => {
    if (categories.value) {
        const selected_category = categories.value.filter((category) => category.id == form.category_id)
        return selected_category.map((category) => category.sub_categories)[0]
    }
})
const resetCategory = () => {
    form.reset('category_id')
    form.reset('sub_category_id')
}
const resetSubCategory = () => form.reset('sub_category_id')
</script>

<script>
import UserLayout from '@/Layouts/Hymn/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Hymns by Singer" />

    <div class="card shadow-none my-0">
        <div class="card-body px-0 pb-1">
            <div class="row">
                <div class="col-md-4 my-1">
                    <div class="input-group">
                        <select id="language_id" name="language_id" class="form-control" v-model="form.language_id"
                            @input="resetCategory" required>
                            <option value="">ቋንቋ ይምረጡ</option>
                            <option v-for="language in languages" :value="language.id" :key="language.id">
                                {{ language.name }}</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4 my-1">
                    <div class="input-group">
                        <select id="category_id" name="category_id" class="form-control" v-model="form.category_id"
                            @input="resetSubCategory" required>
                            <option value="">የምድብ አይነት ይምረጡ</option>
                            <template v-if="categories">
                                <option v-for="category in categories" :value="category.id" :key="category.id">
                                    {{ category.name }}</option>
                            </template>
                        </select>
                    </div>
                </div>
                <div class="col-md-4 my-1">
                    <div class="input-group">
                        <select id="sub_category_id" name="sub_category_id" class="form-control"
                            v-model="form.sub_category_id" required>
                            <option value="">ምድብ ይምረጡ</option>
                            <template v-if="sub_categories">
                                <option v-for="sub_category in sub_categories" :value="sub_category.id"
                                    :key="sub_category.id">
                                    {{ sub_category.name }}</option>
                            </template>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="my-3">
        Hymns by {{ singer.name }} ({{ filtered_hymns.length }} {{ filtered_hymns.length <= 1 ? 'መዝሙር' : 'መዝሙራት' }})
            <Link :href="route('hymn.hymns.index', { language: 0, category: 0, sub_category: 0 })">ወደ ዋናው የመዝሙራት ዝርዝር
            </Link>
    </div>
    <div class="row">
        <template v-if="filtered_hymns">
            <div class="col-12 col-md-6 col-lg-4 col-xl-4" v-for="hymn in filtered_hymns" :key="hymn.id">
                <SingerHymnCard :hymn="hymn" />
            </div>
        </template>
    </div>
</template>

<style scoped>
body.sidebar-collapse .hymn-col {
    flex: 0 0 25%;
    /* When sidebar is minimized, show 4 cards per row */
    max-width: 25%;
    /* Ensure 4 cards per row */
}

h4 {
    font-size: 1.3rem;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
}

img {
    height: 100px;
}
</style>