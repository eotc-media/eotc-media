<script setup>
import { useForm } from '@inertiajs/vue3'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import HymnCard from '@/Components/Hymn/Hymn/HymnCard.vue'
import Loader from '@/Components/Hymn/Loader.vue'
import useScroller from '@/Composables/useScroller'
import { router as Inertia } from '@inertiajs/vue3'
const props = defineProps({
    hymns: Object,
    languages: Object,
    language_slug: String,
    category_slug: String,
    sub_category_slug: String,
})
const form = useForm({
    language_slug: props.language_slug,
    category_slug: props.category_slug,
    sub_category_slug: props.sub_category_slug
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
const allHymns = ref([])
let isLoading = ref(false)
let isAllPagesLoaded = ref(false)
const loadHymns = (url = route('hymn.user.favorites.index', { language: form.language_slug, category: form.category_slug, sub_category: form.sub_category_slug })) => {
    if (isAllPagesLoaded.value) {
        return
    }
    isLoading.value = true
    Inertia.visit(url, {
        method: 'get',
        preserveState: true,
        preserveScroll: true,
        only: ['hymns'],
        onSuccess: page => {
            allHymns.value = [...allHymns.value, ...page.props.hymns.data]
            window.history.replaceState({}, page.props.url, `/hymn/user/favorites/lan/${form.language_slug}/cat/${form.category_slug}/subcat/${form.sub_category_slug}`)
            if (!page.props.hymns.next_page_url) {
                isAllPagesLoaded.value = true
            }
            isLoading.value = false
        },
    })
}
watch(() => form.language_slug, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        isAllPagesLoaded.value = false
        allHymns.value = []
        loadHymns()
        form.category_slug = 0
        form.sub_category_slug = 0
    }
})
watch(() => form.category_slug, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        isAllPagesLoaded.value = false
        allHymns.value = []
        loadHymns()
        form.sub_category_slug = 0
    }
})
watch(() => form.sub_category_slug, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        isAllPagesLoaded.value = false
        allHymns.value = []
        loadHymns()
    }
})
const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoading.value) {
        loadHymns(props.hymns.next_page_url)
    }
}
onMounted(() => {
    loadHymns()
    window.addEventListener('scroll', handleScroll)
    useScroller()
})
onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
})
</script>

<script>
import UserLayout from '@/Layouts/Hymn/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Hymns" />

    <div class="card shadow-none">
        <div class="card-body px-0 pb-1">
            <div class="row">
                <div class="col-md-4 my-1">
                    <div class="input-group">
                        <select id="language_slug" name="language_slug" class="form-control"
                            v-model="form.language_slug" required>
                            <option value="0">ቋንቋ ይምረጡ</option>
                            <option v-for="language in languages" :value="language.slug" :key="language.id">
                                {{ language.name }}</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4 my-1">
                    <div class="input-group">
                        <select id="category_slug" name="category_slug" class="form-control"
                            v-model="form.category_slug" required>
                            <option value="0">የምድብ አይነት ይምረጡ</option>
                            <template v-if="categories">
                                <option v-for="category in categories" :value="category.slug" :key="category.id">
                                    {{ category.name }}</option>
                            </template>
                        </select>
                    </div>
                </div>
                <div class="col-md-4 my-1">
                    <div class="input-group">
                        <select id="sub_category_slug" name="sub_category_slug" class="form-control"
                            v-model="form.sub_category_slug" required>
                            <option value="0">ምድብ ይምረጡ</option>
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
    <div class="row">
        <template v-if="allHymns">
            <div class="col-12 col-md-6 col-lg-4 col-xl-4" v-for="hymn in allHymns" :key="hymn.id">
                <HymnCard :hymn="hymn" />
            </div>
        </template>
    </div>
    <Loader v-if="isLoading" />
    <button id="myBtn">
        <img :src="'/image/up-arrow.png'" alt="alternative" />
    </button>
</template>
<style scoped>
body.sidebar-collapse .hymn-col {
    flex: 0 0 25%;
    /* When sidebar is minimized, show 4 cards per row */
    max-width: 25%;
    /* Ensure 4 cards per row */
}

#myBtn {
    position: fixed;
    z-index: 99;
    bottom: 20px;
    right: 20px;
    display: none;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    outline: none;
    background-color: #777777;
    cursor: pointer;
}

#myBtn:hover {
    background-color: #444444;
}

#myBtn img {
    margin-bottom: 0.25rem;
    width: 15px;
}

hr {
    height: 2.5px;
    border-color: #000;
}
</style>
