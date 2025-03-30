<script setup>
import { onMounted } from 'vue'
import ChannelCard from '@/Components/Hymn/Channel/ChannelCard.vue'
import useScroller from '@/Composables/useScroller'

defineProps({
    channels: Object,
})

onMounted(() => {
    useScroller()
})
</script>
<script>
import UserLayout from '@/Layouts/Hymn/UserLayout.vue';
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Channels" />

    <div class="py-5 mt-5">
        <div class="container">
            <div class="row">
                <template v-if="Object.keys(channels).length">
                    <div class="col-md-4 col-lg-3" v-for="channel in channels" :key="channel.id">
                        <ChannelCard :channel="channel" />
                    </div>
                </template>
            </div>
        </div>
    </div>
    <button id="myBtn">
        <img :src="'/image/up-arrow.png'" alt="alternative" />
    </button>
</template>

<style scoped>
/******************************/
/*     Back To Top Button     */
/******************************/
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
