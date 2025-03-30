<script setup>
import { useForm } from '@inertiajs/vue3'
defineProps({
    categories: Object,
    languages: Object
})
const form = useForm({
    language_id: '',
    name: '',
})
const submit = () => {
    form.post(route('book.admin.categories.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    form.reset()
}
const deleteForm = useForm({})
const deleteCategory = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('book.admin.categories.destroy', id), {
        onFinish: () => {
            deleteForm.reset()
        },
    })
}
</script>

<script>
import AdminLayout from '@/Layouts/Book/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Categories" />

    <div class="py-3">
        <div class="row">
            <div class="col-6">
                <h4 class="font-weight-normal">Categories</h4>
            </div>
            <div class="col-6 text-right">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add">Add
                    Category</button>
            </div>
        </div>
        <div class="table-responsive my-4">
            <table class="table table-bordered">
                <thead class="thead-light">
                    <tr>
                        <th>No.</th>
                        <th>Language</th>
                        <th>Name</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="category, index in categories" :key="category.id">
                        <td>{{ index + 1 }}</td>
                        <td>{{ category.language.name }}</td>
                        <td>{{ category.name }}</td>
                        <td><a class="text-danger" data-bs-toggle="modal" href="#"
                                :data-bs-target="'#modal-delete-' + category.id">delete</a></td>

                        <!-- Delete category modal -->
                        <div class="modal fade modal-danger" :id="'modal-delete-' + category.id">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <form @submit.prevent="deleteCategory(category.id)">
                                        <div class="card mb-0">
                                            <div class="card-header">
                                                <h4 class="font-weight-normal">Delete category</h4>
                                            </div>
                                            <div class="card-body">
                                                <div class="my-4">Are you sure you want to delete this category?
                                                </div>
                                                <div class="text-right">
                                                    <button type="button" class="btn btn-outline-primary m-1"
                                                        data-bs-dismiss="modal"
                                                        :id="'close-delete-' + category.id">Close</button>
                                                    <button type="submit" class="btn btn-danger m-1">Delete</button>
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

    <!-- Add category modal -->
    <div class="modal fade" id="modal-add">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submit">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Add category</h4>
                        </div>
                        <div class="card-body">
                            <div class="input-group mb-3">
                                <select id="language_id" name="language_id" class="form-control"
                                    v-model="form.language_id" required>
                                    <option value="">Select language</option>
                                    <option v-for="language in languages" :value="language.id" :key="language.id">{{
                        language.name
                    }}</option>
                                </select>
                            </div>
                            <div class="container-fluid form-group">
                                <label for="name">Category name</label>
                                <div class="input-group mb-3">
                                    <input id="name" type="text" class="form-control" v-model="form.name" name="name"
                                        placeholder="Name" required autocomplete="name">
                                </div>
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    id="close">Close</button>
                                <button type="submit" class="btn btn-primary m-1"
                                    style="min-width:120px">Create</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>