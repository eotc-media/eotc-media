<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'
defineProps({
    languages: Object,
    can: Object
})
const form = useForm({
    name: '',
})
const submit = () => {
    form.post(route('hymn.admin.languages.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    form.reset()
}
const editForm = useForm({
    name: '',
})
const editFormFill = (language) => {
    editForm.name = language.name
}
const editLanguage = (id) => {
    document.getElementById('close-edit-' + id).click()
    editForm.put(route('hymn.admin.languages.update', id))
}
const deleteForm = useForm({})
const deleteLanguage = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('hymn.admin.languages.destroy', id), {
        onFinish: () => {
            deleteForm.reset()
        },
    })
}
</script>

<script>
import AdminLayout from '@/Layouts/Hymn/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Languages" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">Languages</h4>
            </div>
            <div v-if="can.add_language" class="col-6 text-right">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add">Add
                    language</button>
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
        <template v-if="Object.keys(languages).length" v-slot:tbody>
            <tr v-for="(language, index) in languages" :key="language.id">
                <td>{{ index + 1 }}</td>
                <td>{{ language.name }}</td>
                <td>
                    <a v-if="can.add_language" class="text-primary" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-edit-' + language.id" @click="editFormFill(language)">edit</a>
                </td>
                <td>
                    <a v-if="can.add_language" class="text-danger" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-delete-' + language.id">delete</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    No languages yet
                </td>
            </tr>
        </template>
    </List>

    <!-- Add language modal -->
    <div class="modal fade" id="modal-add">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submit">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Add Language</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Language name</label>
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

    <!-- Edit language modals -->
    <div v-for="language in languages" :key="'edit-' + language.id" class="modal fade"
        :id="'modal-edit-' + language.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="editLanguage(language.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Edit language</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Language name</label>
                                <div class="input-group mb-3">
                                    <input id="name" type="text" class="form-control" v-model="editForm.name"
                                        name="name" placeholder="Name" required autocomplete="name">
                                </div>
                                <InputError :message="editForm.errors.name"></InputError>
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-edit-' + language.id">Close</button>
                                <button type="submit" class="btn btn-danger m-1">Update</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete language modals -->
    <div v-for="language in languages" :key="'delete-' + language.id" class="modal fade modal-danger"
        :id="'modal-delete-' + language.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="deleteLanguage(language.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Delete language</h4>
                        </div>
                        <div class="card-body">
                            <div class="my-4">Are you sure you want to delete this language?</div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-delete-' + language.id">Close</button>
                                <button type="submit" class="btn btn-danger m-1">Delete</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
