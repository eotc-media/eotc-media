<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import upArrow from '@/../../public/image/up-arrow.png'
import useScroller from '@/Composables/useScroller'
import ChannelHymnCard from '@/Components/Hymn/Hymn/ChannelHymnCard.vue'
import Loader from '@/Components/Hymn/Loader.vue'
import { router } from '@inertiajs/vue3'
const props = defineProps({
    channel: Object,
    hymns: Object
})
const allHymns = ref([]);
let isLoading = ref(false)
let isAllPagesLoaded = ref(false)
const activeTab = ref('pills-hymns-tab');
const loadHymns = (url = route('hymn.channels.show', props.channel.slug)) => {
    if (isAllPagesLoaded.value) {
        return
    }
    isLoading.value = true;
    router.visit(url, {
        method: 'get',
        preserveState: true,
        preserveScroll: true,
        only: ['hymns'],
        onSuccess: page => {
            allHymns.value = [...allHymns.value, ...page.props.hymns.data]
            window.history.replaceState({}, page.props.url, `/channels/${props.channel.slug}`)
            if (!page.props.hymns.next_page_url) {
                isAllPagesLoaded.value = true
            }
            isLoading.value = false
        },
    })
}
const handleScroll = () => {
    if (activeTab.value === 'pills-hymns-tab') {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollHeight - scrollTop - clientHeight < 100 && !isLoading.value) {
            loadHymns(props.hymns.next_page_url)
        }
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
import UserLayout from '@/Layouts/Hymn/UserLayout.vue';
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Channel Details" />

    <div class="container">
        <div class="row bg-white">
            <div class="col-12 p-0">
                <img v-if="channel.cover_image"
                    :src="`${channel.cover_image}=w1707-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj`" alt=""
                    class="w-100 channel-banner">
            </div>
            <div class="container">
                <div class="row align-items-center py-4">
                    <div class="col-md-2 text-center position-relative">
                        <img class="channel-thumbnail rounded-circle" :src="channel.thumbnail_high" alt="">
                    </div>
                    <div class="col-md-10 mt-5 pt-2 mt-md-0">
                        <h2 class="channel-title">{{ channel.title }}</h2>
                        <div class="statistics mb-2">
                            <small class="my-0">{{ channel.handle }}</small>
                            <small class="mx-1">•</small>
                            <small>{{ channel.accepted_hymns_count }} hymn{{ channel.accepted_hymns_count === 1 ? '' :
                    's' }} from this channel</small>
                        </div>
                        <div class="channel-description mt-2">
                            {{ channel.description.length > 250 ? channel.description.slice(0, 250) + '...' :
                    channel.description }}
                        </div>
                        <div class="channel-links mt-2">
                            <a :href="`https://www.youtube.com/${channel.handle}`" target="_blank"
                                class="text-primary me-3">youtube.com/{{
                    channel.handle }}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="text-end">
            <Link class="text-right" :href="route('hymn.channels.index')">Back to channels list</Link>
        </div>
    </div>
    <hr class="my-1">
    <div class="container">

        <div class="tab-pane fade show active" id="pills-hymns" role="tabpanel" aria-labelledby="pills-hymns-tab">
            <div class="py-3">
                <div class="row">
                    <template v-if="allHymns">
                        <div class="col-lg-4 col-xl-3" v-for="hymn in allHymns" :key="hymn.id">
                            <ChannelHymnCard :hymn="hymn" />
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <Loader v-if="isLoading" />
    <button id="myBtn">
        <img :src="upArrow" alt="alternative" />
    </button>
</template>

<style scoped>
h2 {
    font-family: 'Roboto Condensed', sans-serif;
    font-size: 3rem;
}

h3 {
    font-family: 'Roboto Condensed', sans-serif;
    font-size: 2rem;
}

h4 {
    font-family: 'Roboto Condensed', sans-serif;
    font-weight: 600;
    font-size: 1.3rem;
}

p {
    font-family: 'Roboto Condensed', sans-serif;
    font-size: 1.2rem;
    font-weight: 300;
}

.statistics small {
    font-size: 0.9rem;
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

.bg-light-gray {
    background-color: #f0f0f0;
}

img {
    width: 60%;
}

hr {
    border: none;
    height: 1px;
    background-color: rgba(0, 0, 0, 1);
}

.channel-banner {
    height: 200px;
    /* Adjust height as needed */
    object-fit: cover;
    border-radius: 15px;
    /* This will create the rounded corners */
}

.channel-thumbnail {
    width: 120px;
    height: 120px;
    border: 4px solid white;
    position: absolute;
    top: -60px;
    left: 20px;
}

.channel-title {
    font-size: 2rem;
    font-weight: 700;
}

.statistics small {
    color: #606060;
    font-size: 0.9rem;
}

.channel-description {
    font-size: 1rem;
    color: #333333;
}

.channel-links a {
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .channel-thumbnail {
        width: 100px;
        height: 100px;
        top: -50px;
        left: 15px;
    }

    .channel-title {
        font-size: 1.5rem;
    }
}
</style>
