<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'
import InputError from '@/Components/General/InputError.vue'
defineProps({
    categories: Object,
    languages: Object,
    can: Object
})
const form = useForm({
    language_id: '',
    name: '',
})
const submit = () => {
    form.post(route('hymn.admin.categories.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    form.reset()
}
const editForm = useForm({
    name: '',
})
const editFormFill = (category) => {
    editForm.name = category.name
}
const editCategory = (id) => {
    document.getElementById('close-edit-' + id).click()
    editForm.put(route('hymn.admin.categories.update', id))
}
const deleteForm = useForm({})
const deleteCategory = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('hymn.admin.categories.destroy', id))
}
</script>

<script>
import AdminLayout from '@/Layouts/Hymn/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Categories" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">Categories</h4>
            </div>
            <div v-if="can.add_category" class="col-6 text-right">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add">Add
                    category</button>
            </div>
        </template>
        <template v-slot:thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th></th>
                <th></th>
            </tr>
        </template>
        <template v-if="Object.keys(categories).length" v-slot:tbody>
            <tr v-for="(category, index) in categories" :key="category.id">
                <td>{{ index + 1 }}</td>
                <td>{{ category.name }}</td>
                <td>
                    <a v-if="can.add_category" class="text-primary" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-edit-' + category.id" @click="editFormFill(category)">edit</a>
                </td>
                <td>
                    <a v-if="can.add_category" class="text-danger" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-delete-' + category.id">delete</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    No categories yet
                </td>
            </tr>
        </template>
    </List>

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
                                    <option v-for="language in languages" :value="language.id" :key="language.id">
                                        {{ language.name }}</option>
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

    <!-- Edit category modals -->
    <div v-for="category in categories" :key="'edit-' + category.id" class="modal fade"
        :id="'modal-edit-' + category.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="editCategory(category.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Edit category</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Category name</label>
                                <div class="input-group mb-3">
                                    <input id="name" type="text" class="form-control" v-model="editForm.name"
                                        name="name" placeholder="Name" required autocomplete="name">
                                </div>
                                <InputError :message="editForm.errors.name"></InputError>
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-edit-' + category.id">Close</button>
                                <button type="submit" class="btn btn-danger m-1">Update</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete category modals -->
    <div v-for="category in categories" :key="'delete-' + category.id" class="modal fade modal-danger"
        :id="'modal-delete-' + category.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="deleteCategory(category.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Delete category</h4>
                        </div>
                        <div class="card-body">
                            <div class="my-4">Are you sure you want to delete this category?</div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-delete-' + category.id">Close</button>
                                <button type="submit" class="btn btn-danger m-1">Delete</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
