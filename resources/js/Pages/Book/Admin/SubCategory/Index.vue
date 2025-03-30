<script setup>
import { useForm } from '@inertiajs/vue3'
defineProps({
    subCategories: Object,
    categories: Object
})
const form = useForm({
    category_id: '',
    name: '',
})
const submit = () => {
    form.post(route('book.admin.sub_categories.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    form.reset()
}
const deleteForm = useForm({})
const deleteSubCategory = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('book.admin.sub_categories.destroy', id), {
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

    <Head title="Subcategories" />

    <div class="py-3">
        <div class="row">
            <div class="col-6">
                <h4 class="font-weight-normal">Sub categories</h4>
            </div>
            <div class="col-6 text-right">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add">Add
                    subcategory</button>
            </div>
        </div>
        <div class="table-responsive mt-4">
            <table class="table table-bordered">
                <thead class="thead-light">
                    <tr>
                        <th>No.</th>
                        <th>Category</th>
                        <th>Name</th>
                        <th>Delete</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="subCategory, index in subCategories" :key="subCategory.id">
                        <td>{{ index + 1 }}</td>
                        <td>{{ subCategory.category.name }}</td>
                        <td>{{ subCategory.name }}</td>
                        <td><a class="text-danger" data-bs-toggle="modal" href="#"
                                :data-bs-target="'#modal-delete-' + subCategory.id">delete</a></td>

                        <!-- Delete sub category modal -->
                        <div class="modal fade modal-danger" :id="'modal-delete-' + subCategory.id">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <form @submit.prevent="deleteSubCategory(subCategory.id)">
                                        <div class="card mb-0">
                                            <div class="card-header">
                                                <h4 class="font-weight-normal">Delete subcategory</h4>
                                            </div>
                                            <div class="card-body">
                                                <div class="my-4">Are you sure you want to delete this sub category?
                                                </div>
                                                <div class="text-right">
                                                    <button type="button" class="btn btn-outline-primary m-1"
                                                        data-bs-dismiss="modal"
                                                        :id="'close-delete-' + subCategory.id">Close</button>
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

    <!-- Add sub category modal -->
    <div class="modal fade" id="modal-add">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submit">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Add Subcategory</h4>
                        </div>
                        <div class="card-body">
                            <div class="input-group mb-3">
                                <select id="category_id" name="category_id" class="form-control"
                                    v-model="form.category_id" required>
                                    <option value="">Select category</option>
                                    <option v-for="category in categories" :value="category.id" :key="category.id">
                                        {{ category.name }} ({{ category.language.name }})</option>
                                </select>
                            </div>
                            <div class="container-fluid form-group">
                                <label for="name">Subcategory name</label>
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