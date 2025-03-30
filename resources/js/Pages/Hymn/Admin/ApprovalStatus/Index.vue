<script setup>
import { useForm } from '@inertiajs/vue3'
import List from '@/Components/General/List.vue'
defineProps({
    approval_statuses: Object,
    can: Object
})
const form = useForm({
    name: '',
})
const submit = () => {
    form.post(route('hymn.admin.approval_statuses.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    form.reset()
}
const deleteForm = useForm({})
const deleteStatus = (id) => {
    document.getElementById('close-delete-' + id).click()
    deleteForm.delete(route('hymn.admin.approval_statuses.destroy', id), {
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

    <Head title="Approval Statuses" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">Approval Statuses</h4>
            </div>
            <div v-if="can.add_approval_status" class="col-6 text-right">
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal-add">Add
                    status</button>
            </div>
        </template>
        <template v-slot:thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th></th>
            </tr>
        </template>
        <template v-if="Object.keys(approval_statuses).length" v-slot:tbody>
            <tr v-for="(status, index) in approval_statuses" :key="status.id">
                <td>{{ index + 1 }}</td>
                <td>{{ status.name }}</td>
                <td>
                    <a v-if="can.add_approval_status" class="text-danger" data-bs-toggle="modal" href="#"
                        :data-bs-target="'#modal-delete-' + status.id">delete</a>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    No approval statuses yet
                </td>
            </tr>
        </template>
    </List>

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

    <!-- Delete status modals -->
    <div v-for="status in approval_statuses" :key="'delete-' + status.id" class="modal fade modal-danger"
        :id="'modal-delete-' + status.id">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="deleteStatus(status.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Delete Status</h4>
                        </div>
                        <div class="card-body">
                            <div class="my-4">Are you sure you want to delete this status?</div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    :id="'close-delete-' + status.id">Close</button>
                                <button type="submit" class="btn btn-danger m-1">Delete</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
