<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'

defineProps({
    hymns: Object,
})

// Function to truncate the title
const truncateTitle = (title) => {
    return title.length > 40 ? title.substring(0, 40) + '...' : title
}
</script>

<script>
import UserLayout from '@/Layouts/Hymn/UserLayout.vue';
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Hymns" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">መዝሙራት</h4>
            </div>
            <div class="col-6 text-right">
                <Link class="btn btn-primary" :href="route('hymn.user.hymns.create')">Add hymn</Link>
            </div>
        </template>
        <template v-slot:pages-top>
            <div class="pagination justify-content-center table-responsive">
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
                <th>Languages</th>
                <th>Categories</th>
                <th>Subcategories</th>
                <th>Title</th>
                <th>Singer</th>
                <th>Status</th>
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
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    ገና ምንም መዝሙር አልጫኑም
                </td>
            </tr>
        </template>
        <template v-slot:pages-bottom>
            <div class="pagination justify-content-center table-responsive">
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
</template>
