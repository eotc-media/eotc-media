<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'
defineProps({
    hymns: Object,
    can: Object
})

const truncateTitle = (title) => {
    return title.length > 30 ? title.substring(0, 30) + '...' : title
}

const deleteForm = useForm({})

const deleteHymn = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('hymn.admin.hymns.delete', id))
}
</script>
<script>
import AdminLayout from '@/Layouts/Hymn/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Hymns" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">Hymns</h4>
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
                <th>Language</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Title</th>
                <th>Singer</th>
                <th>Status</th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </template>
        <template v-if="hymns.data.length" v-slot:tbody>
            <tr v-for="hymn, index in hymns.data" :key="hymn.id">
                <td>{{ (hymns.current_page - 1) * hymns.per_page + index + 1 }}</td>
                <td>{{ hymn.languages.map((language) => language.name).join(', ') }}</td>
                <td>{{ hymn.categories.map((category) => category.name).join(', ') }}</td>
                <td>{{ hymn.sub_categories.map((sub_category) => sub_category.name).join(', ') }}</td>
                <td>{{ truncateTitle(hymn.title) }}</td>
                <td>{{ hymn.singer }}</td>
                <td>{{ hymn.approval_status.name }}</td>
                <td>
                    <a target="_blank" :href="'https://www.youtube.com/watch?v=' + hymn.video_id">view</a>
                </td>
                <td>
                    <Link v-if="can.manage_hymn" class="text-danger" :href="route('hymn.admin.hymns.edit', hymn.id)">
                    edit</Link>
                </td>
                <td>
                    <a v-if="can.manage_hymn" class="text-danger" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-delete-' + hymn.id">delete</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="11" class="text-center">
                    No hymns yet
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

    <!-- Delete hymn modal -->
    <div v-for="hymn in hymns.data" :key="'modals-' + hymn.id">
        <div class="modal fade modal-primary" :id="'modal-delete-' + hymn.id">
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
    </div>
</template>