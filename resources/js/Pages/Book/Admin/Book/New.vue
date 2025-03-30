<script setup>
import { useForm } from '@inertiajs/vue3'
import Req from '@/Components/General/RequiredIndicator.vue'
import InputError from '@/Components/General/InputError.vue'
defineProps({
    books: Object,
    authors: Object
})
const acceptForm = useForm({
    author_id: []
})
const acceptBook = (id) => {
    document.getElementById('close-accept-' + id).click()
    acceptForm.post(route('admin.books.accept', id), {
        onFinish: () => {
            form.reset()
        },
    })
}
const declineForm = useForm({})
const declineBook = (id) => {
    document.getElementById('close-decline-' + id).click()
    declineForm.post(route('admin.books.decline', id), {
        onFinish: () => {
            form.reset()
        },
    })
}
const newAuthorForm = useForm({
    name: ''
})
const submitNewAuthor = () => {
    newAuthorForm.post(route('admin.authors.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    newAuthorForm.reset()
}
</script>
<script>
import AdminLayout from '@/Layouts/Book/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Books" />

    <div class="py-3">
        <div class="row">
            <div class="col-6">
                <h4 class="font-weight-normal">New books</h4>
            </div>
        </div>
        <div class="table-responsive my-4">
            <table class="table">
                <thead class="thead-light">
                    <tr>
                        <th>#</th>
                        <th>Language</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Name</th>
                        <th>Author</th>
                        <th>Status</th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="book, index in books" :key="book.id">
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
                        <td>
                            <a data-bs-toggle="modal" href="#" data-bs-target="#modal-new-author">new
                                author</a>
                        </td>
                        <td>
                            <a class="text-danger" data-bs-toggle="modal" href="#"
                                :data-bs-target="'#modal-approve-' + book.id">accept</a>
                        </td>
                        <td>
                            <a class="text-danger" data-bs-toggle="modal" href="#"
                                :data-bs-target="'#modal-decline-' + book.id">decline</a>
                        </td>

                        <!-- Accept book modal -->
                        <div class="modal fade modal-primary" :id="'modal-approve-' + book.id">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <form @submit.prevent="acceptBook(book.id)">
                                        <div class="card mb-0">
                                            <div class="card-header">
                                                <h4 class="font-weight-normal">Accept book</h4>
                                            </div>
                                            <div class="card-body">
                                                <div class="mb-4">Make sure you want to accept the book. Also please
                                                    select the correct author/authors of the book below. This will
                                                    greatly help in searching books. You can add the
                                                    author by clicking the new author link if he/she is not in the list.
                                                </div>
                                                <label for="language_id">Author/s
                                                    <Req />
                                                </label>
                                                <div class="container-fluid form-group mb-3">
                                                    <v-select multiple :options="authors" label="name"
                                                        :reduce="author => author.id" v-model="acceptForm.author_id">
                                                    </v-select>
                                                </div>
                                                <InputError :message="acceptForm.errors.author_id"></InputError>
                                                <div class="text-right">
                                                    <button type="button" class="btn btn-outline-primary m-1"
                                                        data-bs-dismiss="modal"
                                                        :id="'close-accept-' + book.id">Close</button>
                                                    <button type="submit" class="btn btn-primary m-1">Accept</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Decline book modal -->
                        <div class="modal fade modal-primary" :id="'modal-decline-' + book.id">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <form @submit.prevent="declineBook(book.id)">
                                        <div class="card mb-0">
                                            <div class="card-header">
                                                <h4 class="font-weight-normal">Decline acceptance</h4>
                                            </div>
                                            <div class="card-body">
                                                <div class="my-4">Are you sure you want
                                                    to decline accepting this book?
                                                </div>
                                                <div class="text-right">
                                                    <button type="button" class="btn btn-outline-primary m-1"
                                                        data-bs-dismiss="modal"
                                                        :id="'close-decline-' + book.id">Close</button>
                                                    <button type="submit" class="btn btn-danger m-1">Decline</button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Add new author -->
    <div class="modal fade" id="modal-new-author">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submitNewAuthor">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Add New Author</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Author name</label>
                                <div class="input-group mb-3">
                                    <input id="name" type="text" class="form-control" v-model="newAuthorForm.name"
                                        name="name" placeholder="Name" required autocomplete="name">
                                </div>
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    id="close">Close</button>
                                <button type="submit" class="btn btn-primary m-1" style="min-width:120px">Add</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>