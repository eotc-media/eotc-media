<script setup>
import { useForm } from '@inertiajs/vue3'
import InputError from '@/Components/General/InputError.vue';
import Req from '@/Components/General/RequiredIndicator.vue';
const props = defineProps({
    user: Object,
    roles: Object,
    user_role_names: Object,
    user_role_ids: Object
})
const form = useForm({
    role_id: props.user_role_ids
})
const submit = (id) => {
    form.put(route('admin.users.change_role', id), {
        onFinish: () => {
            form.reset()
            document.getElementById('close').click()
        },
    })
}
</script>

<script>
import AdminLayout from '@/Layouts/Main/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>
    <div class="py-3">
        <div class="card mt-5 p-md-5">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <div class="bg-image">
                            <img v-if="user.image" class="w-100" :src="'/storage/user/image/' + user.image" alt="">
                            <img v-else class="w-100" src="/storage/user/image/default.jpg" alt="">
                            <div class="mask" style="background-color: rgba(194, 194, 194, 0.275)"></div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="my-2">
                            <div>Name: {{ user.name }}</div>
                            <div>Email: {{ user.email }}</div>
                            <div>Roles: {{ user_role_names.join(', ') }}</div>
                            <button class="btn btn-primary my-3" data-bs-toggle="modal"
                                data-bs-target="#modal-change-role">Change role</button>
                            <Link :href="route('admin.users.index')" class="btn btn-outline-primary ml-2 my-3">Back
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Change user role modal -->
    <div class="modal fade" id="modal-change-role">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submit(props.user.id)">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Change User Role</h4>
                        </div>
                        <div class="card-body">
                            <label for="role_id">Role/s
                                <Req />
                            </label>
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <i class="fa-solid fa-list-check"></i></span>
                                <select id="role_id" multiple name="role_id[]" class="selectpicker form-control"
                                    v-model="form.role_id" required>
                                    <option v-for="role in roles" :value="role.id" :key="role.id">{{ role.name }}
                                    </option>
                                </select>
                            </div>
                            <InputError :message="form.errors.role_id"></InputError>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    id="close">Close</button>
                                <button type="submit" class="btn btn-primary m-1"
                                    style="min-width:120px">Confirm</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
h4,
h6,
h1 {
    font-size: 1.3rem;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

hr {
    background-color: #000000;
}
</style>