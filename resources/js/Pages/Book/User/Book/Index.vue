<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'
defineProps({
    books: Object,
})
const deleteForm = useForm({})
const deleteBook = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('admin.sub_categories.destroy', id), {
        onFinish: () => {
            deleteForm.reset()
        },
    })
}
</script>

<script>
import UserLayout from '@/Layouts/Book/UserLayout.vue';
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Books" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">መጻህፍት</h4>
            </div>
            <div class="col-6 text-right">
                <Link class="btn btn-primary" :href="route('book.user.books.create')">Add book</Link>
            </div>
        </template>
        <template v-slot:pages-top>
            <div class="pagination justify-content-center">
                <ul class="pagination">
                    <li v-for="link in books.links" :key="link.label"
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
                <th>Name</th>
                <th>Author</th>
                <th>Status</th>
                <th></th>
            </tr>
        </template>
        <template v-if="books.data.length" v-slot:tbody>
            <tr v-for="book, index in books.data" :key="book.id">
                <td>{{ index + 1 }}</td>
                <td>{{ book.languages.map((language) => language.name).join(', ') }}</td>
                <td>{{ book.categories.map((category) => category.name).join(', ') }}</td>
                <td>{{ book.sub_categories.map((sub_category) => sub_category.name).join(', ') }}</td>
                <td>{{ book.name }}</td>
                <td>{{ book.author }}</td>
                <td>{{ book.approval_status.name }}</td>
                <td>
                    <a target="_blank" :href="'/storage/book/file/' + book.file">view</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    ገና ምንም መጽሃፍ አልጫኑም
                </td>
            </tr>
        </template>
        <template v-slot:pages-bottom>
            <div class="pagination justify-content-center">
                <ul class="pagination">
                    <li v-for="link in books.links" :key="link.label"
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