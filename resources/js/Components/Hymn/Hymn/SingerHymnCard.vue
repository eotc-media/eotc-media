<script setup>
import { router as Inertia, useForm } from '@inertiajs/vue3'
import moment from 'moment'
import InputError from '@/Components/General/InputError.vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { component as ckeditor } from '@ckeditor/ckeditor5-vue'
const editorConfig = {
    toolbar: [
        'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
        'blockQuote', 'undo', 'redo'
    ],
    removePlugins: ['Table', 'MediaEmbed'] // Remove specific plugins like Table and MediaEmbed
}
const props = defineProps({
    hymn: Object,
})

const lyricsForm = useForm({
    lyrics_suggestion: props.hymn.lyrics || '',
})

const submitLyrics = () => {
    document.getElementById('close-edit-lyrics-' + props.hymn.id).click()
    lyricsForm.put(route('hymn.hymns.lyrics.update', props.hymn.id))
}

const deleteForm = useForm({})

const deleteHymn = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('hymn.admin.hymns.delete', id))
}
</script>

<template>
    <div class="hymn-card d-flex flex-column">
        <Link :href="route('hymn.hymns.watch', hymn.slug)" class="thumbnail-link">
        <div class="thumbnail">
            <img class="w-100" :src="hymn.thumbnail_maxres ? hymn.thumbnail_maxres : hymn.thumbnail_medium" alt="">
        </div>
        </Link>
        <div class="d-flex mt-2">
            <a :href="route('hymn.channels.show', hymn.channel.slug)" class="thumbnail-link">
                <div class="channel-thumbnail">
                    <img class="rounded-circle" :src="hymn.channel.thumbnail_high" alt="">
                </div>
            </a>
            <div class="video-info ms-2 flex-grow-1">
                <div class="d-flex justify-content-between align-items-center">
                    <Link :href="route('hymn.hymns.watch', hymn.slug)" class="thumbnail-link">
                    <h3 class="text-bold mb-0">
                        {{ hymn.title.length > 75 ? hymn.title.slice(0, 75) + '...' : hymn.title }}
                    </h3>
                    </Link>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a :href="route('hymn.user.favorites.toggle', props.hymn.id)" class="dropdown-item">
                                    {{ hymn.isFavorite ? '- Unfavorite' : '+ Favorite' }}
                                </a>
                            <li><a class="dropdown-item" data-bs-toggle="modal"
                                    :data-bs-target="'#modal-show-lyrics-' + hymn.id" href="#">ግጥም/Lyrics</a></li>
                            </li>
                            <li v-if="$page.props.auth.can.manage_hymn">
                                <Link :href="route('hymn.admin.hymns.edit', hymn.id)" class="dropdown-item">Edit</Link>
                            </li>
                            <li v-if="$page.props.auth.can.manage_hymn"><a class="dropdown-item text-danger"
                                    data-bs-toggle="modal" :data-bs-target="'#modal-delete-hymn-' + hymn.id"
                                    href="#">Delete</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="d-inline d-flex mt-2">
                    <a :href="route('hymn.channels.show', hymn.channel.slug)" class="thumbnail-link">
                        <h4 class="my-0">{{ hymn.channel.title.length > 30 ? hymn.channel.title.slice(0, 30) + '...' :
            hymn.channel.title }}</h4>
                    </a>
                    <h4 class="text-bold mx-1 my-0">•</h4>
                    <h4 class="py-0">{{ moment(hymn.published_at).fromNow()
            .replace('a month ago', '1 month ago').replace('a day ago', '1 day ago') }}</h4>
                    <h4 class="text-bold mx-1 my-0">•</h4>
                    <h4 class="my-0">{{ hymn.clicks_count }} clicks</h4>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade modal-primary" :id="'modal-show-lyrics-' + hymn.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="card mb-0">
                    <div class="card-header">
                        <h4 class="font-weight-normal">የመዝሙር ግጥም / Lyrics</h4>
                    </div>
                    <div class="card-body">
                        <div class="mb-4"
                            v-html="hymn.lyrics ? hymn.lyrics : 'የመዝሙሩ ግጥም ገና አልተሰጠም፣ አሁን ይሙሉ። / No lyrics yet, add now.'">
                        </div>
                        <div class="text-right">
                            <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                :id="'close-show-lyrics-' + hymn.id">Close</button>
                            <a class="btn btn-primary m-1" data-bs-toggle="modal"
                                :data-bs-target="'#modal-edit-lyrics-' + hymn.id" href="#">
                                {{ hymn.lyrics ? 'Edit' : 'Add' }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade modal-primary" :id="'modal-edit-lyrics-' + hymn.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit="submitLyrics">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">የመዝሙር ግጥም / Lyrics</h4>
                        </div>
                        <div class="card-body modal-body">
                            <div class="mb-3 ckeditor-wrapper">
                                <ckeditor :editor="ClassicEditor" v-model="lyricsForm.lyrics_suggestion"
                                    :config="editorConfig">
                                </ckeditor>
                            </div>
                            <InputError :message="lyricsForm.errors.lyrics_suggestion"></InputError>
                        </div>
                        <div class="text-right my-4 mx-3">
                            <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                :id="'close-edit-lyrics-' + hymn.id">Close</button>
                            <button type="submit" class="btn btn-primary m-1">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade modal-primary" :id="'modal-delete-hymn-' + hymn.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="deleteHymn(hymn.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Delete hymn</h4>
                        </div>
                        <div class="card-body">
                            <div class="my-4">
                                Are you sure you want
                                to delete this hymn?
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-delete-' + hymn.id">Close</button>
                                <button type="submit" class="btn btn-danger m-1">Delete</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>


<style scoped>
.hymn-card {
    width: 100%;
    padding-bottom: 1rem;
}

.thumbnail img {
    border-radius: 8px;
    width: 100%;
}

.channel-thumbnail {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

.channel-thumbnail img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
}

.video-info {
    flex-grow: 1;
}

.video-info h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #000;
    line-height: 1.3;
}

.video-info h4 {
    font-weight: 400;
    font-size: 0.8rem;
    color: #606060;
}

.thumbnail-link:hover .thumbnail img {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: box-shadow 0.3s ease-in-out;
}

.ckeditor-wrapper {
    width: 100%;
}

.modal-dialog {
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.modal-body {
    overflow-y: auto;
    max-height: 70vh;
}

@media (max-width: 991px) {
    .hymn-card {
        max-width: 100%;
    }
}
</style>
