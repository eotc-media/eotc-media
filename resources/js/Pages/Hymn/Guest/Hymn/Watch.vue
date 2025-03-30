<script setup>
import { ref } from 'vue'
import { useForm } from '@inertiajs/vue3'
import InputError from '@/Components/General/InputError.vue'
import SuccessMessage from '@/Components/General/SuccessMessage.vue'
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
    hymn: Object,
});

const isEditing = ref(false);

const toggleEdit = () => {
    isEditing.value = !isEditing.value;
};

const lyricsForm = useForm({
    lyrics_suggestion: props.hymn.lyrics || '',
})

const submitLyrics = () => {
    lyricsForm.put(route('hymn.hymns.lyrics.update', props.hymn.id))
    isEditing.value = false;
}
</script>

<script>
import UserLayout from '@/Layouts/Hymn/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Watch" />

    <div class="container-fluid py-3">
        <div class="row">
            <div class="col-lg-8">
                <div class="ratio ratio-16x9 mb-2">
                    <iframe loading="lazy" :src="`https://www.youtube.com/embed/${hymn.video_id}`" title="Video player"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="row">
                    <div class="col-lg-9">
                        <h3>{{ hymn.title.length > 75 ? hymn.title.slice(0, 75) + '...' : hymn.title }}</h3>
                        <div class="d-flex my-2">
                            <a :href="route('hymn.channels.show', hymn.channel.slug)" class="thumbnail-link">
                                <div class="channel-thumbnail">
                                    <img class="rounded-circle" :src="hymn.channel.thumbnail_high" alt="">
                                </div>
                            </a>
                            <div class="video-info ms-2 flex-grow-1">
                                <div class="d-inline d-flex">
                                    <a :href="route('hymn.channels.show', hymn.channel.slug)" class="thumbnail-link">
                                        <h4 class="my-0 mb-1">{{ hymn.channel.title.length > 40 ?
                        hymn.channel.title.slice(0, 40) + '...' :
                        hymn.channel.title }}</h4>
                                    </a>
                                </div>
                                <div class="d-flex">
                                    <h5 class="my-0">{{ hymn.channel.accepted_hymns.length }} hymn{{
                        hymn.channel.accepted_hymns.length === 1 ? '' : 's' }}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 text-end">
                        <Link :href="route('hymn.user.favorites.toggle', props.hymn.id)" class="btn" preserve-state
                            preserve-scroll>
                        {{ hymn.isFavorite ? '- Unfavorite' : '+ Favorite' }}
                        </Link>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <h3 class="mb-3">ግጥም / Lyrics</h3>
                <SuccessMessage />
                <div class="d-flex align-items-start mb-3 overflow-auto" style="max-height: 30rem;">
                    <div v-show="isEditing">
                        <ckeditor :editor="ClassicEditor" v-model="lyricsForm.lyrics_suggestion"
                            :config="editorConfig" />
                        <InputError :message="lyricsForm.errors.lyrics_suggestion"></InputError>
                    </div>
                    <div v-show="!isEditing">
                        <p v-html="hymn.lyrics"></p>
                    </div>
                </div>
                <div class="mx-3 text-end">
                    <button v-if="!isEditing && hymn.lyrics" @click="toggleEdit" class="btn btn-secondary">Edit</button>
                    <button v-else-if="!isEditing && !hymn.lyrics" @click="toggleEdit"
                        class="btn btn-secondary">Add</button>
                    <div v-else>
                        <button @click="submitLyrics" class="btn btn-success me-2">Submit</button>
                        <button @click="toggleEdit" class="btn btn-danger">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.channel-thumbnail {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
}

.channel-thumbnail img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
}

h3 {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #000;
    line-height: 1.3;
}

.video-info h4 {
    font-weight: 400;
    font-size: 1.1rem;
    color: #202020;
}

.video-info h5 {
    font-weight: 400;
    font-size: 0.8rem;
    color: #202020;
}

.btn {
    background-color: #f8f9fa;
    color: #000;
    border-color: black
}
</style>
