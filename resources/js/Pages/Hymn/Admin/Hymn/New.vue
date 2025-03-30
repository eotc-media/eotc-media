<script setup>
import { useForm } from '@inertiajs/vue3'
import Req from '@/Components/General/RequiredIndicator.vue'
import InputError from '@/Components/General/InputError.vue'
import List from '@/Components/General/List.vue'

defineProps({
    hymns: Object,
    singers: Object,
    can: Object
})

const acceptForm = useForm({
    singer_id: []
})

const acceptHymn = (id) => {
    document.getElementById('close-accept-' + id).click()
    acceptForm.post(route('hymn.admin.hymns.accept', id))
}

const declineForm = useForm({})

const declineHymn = (id) => {
    document.getElementById('close-decline-' + id).click()
    declineForm.post(route('hymn.admin.hymns.decline', id))
}

const newSingerForm = useForm({
    name: ''
})

const submitNewSinger = () => {
    newSingerForm.post(route('hymn.admin.singers.store'), {
        onFinish: () => {
            document.getElementById('close').click()
        },
    })
    newSingerForm.reset()
}

// Function to truncate the title
const truncateTitle = (title) => {
    return title.length > 30 ? title.substring(0, 30) + '...' : title
}
</script>

<script>
import AdminLayout from '@/Layouts/Hymn/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="New Hymns" />

    <List>
        <template v-slot:title>
            <div class="col-6">
                <h4 class="font-weight-normal">New hymns</h4>
            </div>
        </template>
        <template v-slot:thead>
            <tr>
                <th>#</th>
                <th>Language</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Title</th>
                <th>Singer</th>
                <th>Status</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
            </tr>
        </template>

        <template v-if="Object.keys(hymns).length" v-slot:tbody>
            <template v-for="hymn, index in hymns" :key="hymn.id">
                <tr>
                    <td>{{ index + 1 }}</td>
                    <td>{{ hymn.languages.map((language) => language.name).join(', ') }}</td>
                    <td>{{ hymn.categories.map((category) => category.name).join(', ') }}</td>
                    <td>{{ hymn.sub_categories.map((sub_category) => sub_category.name).join(', ') }}</td>
                    <td>{{ truncateTitle(hymn.title) }}</td>
                    <td>{{ hymn.singer }}</td>
                    <td>{{ hymn.approval_status.name }}</td>
                    <td>
                        <a target="_blank" :href="'https://www.youtube.com/watch?v=' + hymn.video_id">view</a>
                    </td>
                    <td>
                        <a v-if="can.manage_hymn" data-bs-toggle="modal" href="#" data-bs-target="#modal-new-singer">new
                            singer</a>
                    </td>
                    <td>
                        <a v-if="can.manage_hymn" class="text-danger" data-bs-toggle="modal" href="#"
                            :data-bs-target="'#modal-approve-' + hymn.id">accept</a>
                    </td>
                    <td>
                        <a v-if="can.manage_hymn" class="text-danger" data-bs-toggle="modal" href="#"
                            :data-bs-target="'#modal-decline-' + hymn.id">decline</a>
                    </td>
                </tr>
            </template>
        </template>

        <template v-else v-slot:tbody>
            <tr>
                <td colspan="11" class="text-center">
                    No new hymns
                </td>
            </tr>
        </template>
    </List>

    <div v-for="hymn in hymns" :key="'modals-' + hymn.id">
        <!-- Accept hymn modal -->
        <div class="modal fade modal-primary" :id="'modal-approve-' + hymn.id">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form @submit.prevent="acceptHymn(hymn.id)">
                        <div class="card mb-0">
                            <div class="card-header">
                                <h4 class="font-weight-normal">Accept hymn</h4>
                            </div>
                            <div class="card-body">
                                <div class="mb-4">
                                    Make sure you want to accept the hymn. Also please
                                    select the correct singer/singers of the hymn below. This will
                                    greatly help in searching hymns. You can add the
                                    singer by clicking the new singer link if he/she is not in the list.
                                </div>
                                <label for="singer_id">Singer/s
                                    <Req />
                                </label>
                                <div class="container-fluid form-group mb-3">
                                    <v-select multiple :options="singers" label="name" :reduce="singer => singer.id"
                                        v-model="acceptForm.singer_id">
                                    </v-select>
                                </div>
                                <InputError :message="acceptForm.errors.singer_id"></InputError>
                                <div class="text-right">
                                    <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                        :id="'close-accept-' + hymn.id">Close</button>
                                    <button type="submit" class="btn btn-primary m-1">Accept</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Decline hymn modal -->
        <div class="modal fade modal-primary" :id="'modal-decline-' + hymn.id">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form @submit.prevent="declineHymn(hymn.id)">
                        <div class="card mb-0">
                            <div class="card-header">
                                <h4 class="font-weight-normal">Decline acceptance</h4>
                            </div>
                            <div class="card-body">
                                <div class="my-4">
                                    Are you sure you want
                                    to decline accepting this hymn?
                                </div>
                                <div class="text-right">
                                    <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                        :id="'close-decline-' + hymn.id">Close</button>
                                    <button type="submit" class="btn btn-danger m-1">Decline</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Add new singer -->
    <div class="modal fade" id="modal-new-singer">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submitNewSinger">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Add New Singer</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Singer name</label>
                                <div class="input-group mb-3">
                                    <input id="name" type="text" class="form-control" v-model="newSingerForm.name"
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
