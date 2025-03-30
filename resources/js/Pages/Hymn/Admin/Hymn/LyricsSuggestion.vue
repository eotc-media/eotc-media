<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'
defineProps({
    hymns: Object,
    can: Object
})

const lyricsForm = useForm({})

const truncateTitle = (title) => {
    return title.length > 100 ? title.substring(0, 100) + '...' : title
}

const approveLyrics = (id) => {
    document.getElementById('close-approve-lyrics-' + id).click()
    lyricsForm.put(route('hymn.admin.hymns.approve_lyrics', id))
}

const declineLyrics = (id) => {
    document.getElementById('close-approve-lyrics-' + id).click()
    lyricsForm.put(route('hymn.admin.hymns.decline_lyrics', id))
}
</script>
<script>
import AdminLayout from '@/Layouts/Hymn/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Lyrics Suggestions" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">Lyrics Suggestions</h4>
            </div>
        </template>
        <template v-slot:pages-top>
            <div class="pagination justify-content-center">
                <ul class="pagination">
                    <li v-for="link in hymns.links" :key="link.label"
                        :class="['page-item', { 'active': link.active, 'disabled': !link.url }]">
                        <Link v-if="link.url" class="page-link" :href="link.url">
                        <span v-if="link.label.includes('Previous')">&laquo;</span>
                        <span v-else-if="link.label.includes('Next')">&raquo;</span>
                        <span v-else v-html="link.label"></span>
                        </Link>
                        <span v-else class="page-link">
                            <span v-if="link.label.includes('Previous')">&laquo;</span>
                            <span v-else-if="link.label.includes('Next')">&raquo;</span>
                            <span v-else v-html="link.label"></span>
                        </span>
                    </li>
                </ul>
            </div>
        </template>
        <template v-slot:thead>
            <tr>
                <th>#</th>
                <th>Title</th>
                <th>Singer</th>
                <th>Status</th>
                <th></th>
            </tr>
        </template>
        <template v-if="hymns.data.length" v-slot:tbody>
            <tr v-for="hymn, index in hymns.data" :key="hymn.id">
                <td>{{ (hymns.current_page - 1) * hymns.per_page + index + 1 }}</td>
                <td>{{ truncateTitle(hymn.title) }}</td>
                <td>{{ hymn.singer }}</td>
                <td>
                    <a v-if="can.manage_hymn" class="text-primary" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-lyrics-suggestion-' + hymn.id">lyrics</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="11" class="text-center">
                    No new lyrics suggestions
                </td>
            </tr>
        </template>
        <template v-slot:pages-bottom>
            <div class="pagination justify-content-center">
                <ul class="pagination">
                    <li v-for="link in hymns.links" :key="link.label"
                        :class="['page-item', { 'active': link.active, 'disabled': !link.url }]">
                        <Link v-if="link.url" class="page-link" :href="link.url" :preserve-scroll="true">
                        <span v-if="link.label.includes('Previous')">&laquo;</span>
                        <span v-else-if="link.label.includes('Next')">&raquo;</span>
                        <span v-else v-html="link.label"></span>
                        </Link>
                        <span v-else class="page-link">
                            <span v-if="link.label.includes('Previous')">&laquo;</span>
                            <span v-else-if="link.label.includes('Next')">&raquo;</span>
                            <span v-else v-html="link.label"></span>
                        </span>
                    </li>
                </ul>
            </div>
        </template>
    </List>

    <!-- Approve lyrics modal -->
    <div v-for="hymn in hymns.data" :key="'modals-' + hymn.id">
        <div class="modal fade modal-primary" :id="'modal-lyrics-suggestion-' + hymn.id">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Approve lyrics</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-4" v-html="hymn.lyrics_suggestion"></div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-approve-lyrics-' + hymn.id">Close</button>
                                <button type="button" @click="declineLyrics(hymn.id)"
                                    class="btn btn-danger m-1">Decline</button>
                                <button type="button" @click="approveLyrics(hymn.id)"
                                    class="btn btn-success m-1">Approve</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>