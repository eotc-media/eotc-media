<script setup>
import List from '@/Components/General/List.vue'
defineProps({
    feedbacks: Object
})
</script>

<script>
import AdminLayout from '@/Layouts/Main/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Feedbacks" />

    <List>
        <template v-slot:title>
            <h4 class="font-weight-normal">Feedbacks</h4>
        </template>
        <template v-slot:pages-top>
            <div class="pagination justify-content-center table-responsive">
                <ul class="pagination">
                    <li v-for="link in feedbacks.links" :key="link.label"
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
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Body</th>
                <th></th>
            </tr>
        </template>
        <template v-if="feedbacks.data.length" v-slot:tbody>
            <tr v-for="feedback, index in feedbacks.data" :key="feedback.id">
                <td>{{ index + 1 }}</td>
                <td>{{ feedback.name }}</td>
                <td>{{ feedback.email }}</td>
                <td>{{ feedback.phone }}</td>
                <td>{{ feedback.body.length > 50 ? feedback.body.substring(0, 50) + '...' : feedback.body }}</td>
                <td>
                    <a class="text-primary" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-feedback-' + feedback.id">view</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    ገና ምንም አስተያየት አልተሰጠም። / No feedbacks found.
                </td>
            </tr>
        </template>
        <template v-slot:pages-bottom>
            <div class="pagination justify-content-center table-responsive">
                <ul class="pagination">
                    <li v-for="link in feedbacks.links" :key="link.label"
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

    <div v-for="feedback in feedbacks.data" :key="'modals-' + feedback.id">
        <div class="modal fade modal-primary" :id="'modal-feedback-' + feedback.id">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Feedback</h4>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                {{ feedback.body }}
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1"
                                    data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>