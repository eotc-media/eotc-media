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
    singers: Object,
    hymns_count: Number,
})

const form = useForm({
    language_slug: props.language_slug === '0' || props.language_slug === 0 ? '' : props.language_slug || '',
    category_slug: props.category_slug === '0' || props.category_slug === 0 ? '' : props.category_slug || '',
    sub_category_slug: props.sub_category_slug === '0' || props.sub_category_slug === 0 ? '' : props.sub_category_slug || '',
})
const singers = ref(props.singers)
const hymnsCount = ref(props.hymns_count)
const allHymns = ref([])
const isLoading = ref(false)
const isAllPagesLoaded = ref(false)

const categories = computed(() => {
    const selected_language = props.languages.find((language) => language.slug == form.language_slug)
    let categoriesList = selected_language ? selected_language.categories || [] : []

    const bySingerTranslations = {
        'አማርኛ': 'በዘማሪው',
        'English': 'By the singer',
        'ግዕዝ': 'በዘማሪው',
        'ትግርኛ': 'ብዘማሪ',
        'Afaan-Oromoo': 'Faarfataa',
    }
    const bySingerName = bySingerTranslations[form.language_slug] || 'በዘማሪው'

    if (!categoriesList.some(category => category.slug === 'by-singer')) {
        categoriesList.unshift({ id: 'by-singer', name: bySingerName, slug: 'by-singer' })
    }

    return categoriesList
})

const sub_categories = computed(() => {
    if (form.category_slug === 'by-singer') {
        return singers.value;
    } else if (categories.value) {
        const selected_category = categories.value.find((category) => category.slug == form.category_slug)
        return selected_category ? selected_category.sub_categories : [];
    }
    return []
})

const loadHymns = (url) => {
    if (isAllPagesLoaded.value) return

    isLoading.value = true
    if (!url) {
        url = route('hymn.hymns.index', { language: form.language_slug || 0, category: form.category_slug || 0, sub_category: form.sub_category_slug || 0 })
    }

    Inertia.visit(url, {
        method: 'get',
        preserveState: true,
        preserveScroll: true,
        only: ['hymns', 'singers', 'hymns_count'],
        onSuccess: page => {
            allHymns.value = [...allHymns.value, ...page.props.hymns.data]
            hymnsCount.value = page.props.hymns_count
            if (page.props.singers) {
                singers.value = page.props.singers
            }
            window.history.replaceState({}, page.props.url, `/hymn/hymns/lan/${form.language_slug || 0}/cat/${form.category_slug || 0}/subcat/${form.sub_category_slug || 0}`)
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
        form.category_slug = ''
        form.sub_category_slug = ''
        loadHymns()
    }
})

watch(() => form.category_slug, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        isAllPagesLoaded.value = false
        allHymns.value = []
        form.sub_category_slug = ''
        loadHymns()
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
    singers.value = props.singers
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

    <div class="card shadow-none mb-0">
        <div class="card-body px-0 pb-1">
            <div class="row">
                <!-- Language Select -->
                <div class="col-md-4 my-1">
                    <v-select :options="languages" label="name" :reduce="language => language.slug"
                        v-model="form.language_slug" placeholder="ቋንቋ ይምረጡ" :searchable="true"
                        :clearable="false"></v-select>
                </div>

                <!-- Category Select -->
                <div class="col-md-4 my-1">
                    <v-select :options="categories" label="name" :reduce="category => category.slug"
                        v-model="form.category_slug" placeholder="የምድብ አይነት ይምረጡ" :searchable="true"
                        :clearable="false"></v-select>
                </div>

                <!-- Sub-Category Select (or singers if 'by-singer') -->
                <div class="col-md-4 my-1">
                    <v-select :options="sub_categories" label="name" :reduce="sub => sub.slug"
                        v-model="form.sub_category_slug" placeholder="ምድብ ይምረጡ" :searchable="true"
                        :clearable="false"></v-select>
                </div>
            </div>
            <small class="p-0 m-0">{{ hymnsCount }} {{ hymnsCount <= 1 ? 'መዝሙር' : 'መዝሙራት' }}</small>
            <template v-if="hymnsCount < 21 && hymnsCount > 1" class="my-3 text-center">
                (<Link :href="route('hymn.hymns.playall', { language: form.language_slug || 0, category: form.category_slug || 0, sub_category: form.sub_category_slug || 0 })">
                    ሁሉንም ይክፈቱ
                </Link>)
            </template>
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