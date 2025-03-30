<script setup>
import { useForm } from '@inertiajs/vue3'
defineProps({
    approval_statuses: Object
})
const form = useForm({
    name: '',
})
const submit = () => {
    form.post(route('admin.approval_statuses.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    form.reset()
}
const deleteForm = useForm({})
const deleteStatus = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('admin.approval_statuses.destroy', id), {
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

    <Head title="Aproval Statuses" />

    <div class="container-fluid py-3">
        <div class="card px-3 pt-4">
            <div class="row">
                <div class="col-6">
                    <h4 class="font-weight-normal">Approval Statuses</h4>
                </div>
                <div class="col-6 text-right">
                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add">Add
                        Status</button>
                </div>
            </div>
            <div class="table-responsive my-4">
                <table class="table table-bordered">
                    <thead class="thead-light">
                        <tr>
                            <th>No.</th>
                            <th>Name</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="status, index in approval_statuses" :key="status.id">
                            <td>{{ index + 1 }}</td>
                            <td>{{ status.name }}</td>
                            <td><a class="text-danger" data-bs-toggle="modal" href="#"
                                    :data-bs-target="'#modal-delete-' + status.id">delete</a></td>

                            <!-- Delete status modal -->
                            <div class="modal fade modal-danger" :id="'modal-delete-' + status.id">
                                <div class="modal-dialog">
                                    <div class="modal-content">
                                        <form @submit.prevent="deleteStatus(status.id)">
                                            <div class="card mb-0">
                                                <div class="card-header">
                                                    <h4 class="font-weight-normal">Delete Status</h4>
                                                </div>
                                                <div class="card-body">
                                                    <div class="my-4">Are you sure you want to delete this status?
                                                    </div>
                                                    <div class="text-right">
                                                        <button type="button" class="btn btn-outline-primary m-1"
                                                            data-bs-dismiss="modal"
                                                            :id="'close-delete-' + status.id">Close</button>
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
    </div>

    <!-- Add status modal -->
    <div class="modal fade" id="modal-add">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submit">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Add Status</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Status name</label>
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