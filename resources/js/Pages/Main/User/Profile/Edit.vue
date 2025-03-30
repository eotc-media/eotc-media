<script setup>
import { useForm } from '@inertiajs/vue3'
import InputError from '@/Components/General/InputError.vue'
const props = defineProps({
    user: Object
})
const form = useForm({
    name: props.user.name,
    image: '',
})
const acceptImage = (event) => {
    form.image = event.target.files[0]
    document.getElementById('imageview').src = window.URL.createObjectURL(event.target.files[0])
}
const submit = () => {
    form.post(route('user.profile.update'), {
        onFinish: () => {
            form.reset()
        },
    })
}
</script>
<script>
import GuestLayout from '@/Layouts/Main/GuestLayout.vue'
export default {
    layout: GuestLayout
}
</script>

<template>

    <Head title="Edit Profile" />

    <form @submit.prevent="submit">
        <div class="row my-5">
            <div class="col-md-6 offset-md-3">
                <div class="text-center my-5">
                    <img id="imageview" v-if="$page.props.auth.user.image"
                        :src="'/storage/user/image/' + $page.props.auth.user.image" class="rounded img-fluid"
                        style="width: 25%" alt="User Image">
                    <img id="imageview" v-else :src="'/storage/user/image/default.jpg'" class="rounded img-fluid"
                        style="width: 25%" alt="Default Image">
                    <div class="text-center m-3">
                        <input type="file" style="width: 100px" accept="image/*" @input="acceptImage" />
                        <progress v-if="form.progress" :value="form.progress.percentage" max="100">
                            {{ form.progress.percentage }}%
                        </progress>
                    </div>
                </div>
                <ul class="list-group">
                    <li class="list-group-item">
                        <div class="input-group py-2">
                            Name
                            <input id="name" type="text" class="ms-4 form-control text-end" v-model="form.name"
                                name="name" placeholder="Name" required autocomplete="name">
                        </div>
                        <InputError :message="form.errors.name"></InputError>
                    </li>
                    <li class="list-group-item py-3">
                        Email <a class="float-end text-decoration-none">{{ $page.props.auth.user.email }}</a>
                    </li>
                </ul>
                <div class="text-end my-5">
                    <Link :href="route('user.profile.show')" class="btn btn-outline-primary">Back</Link>
                    <button type="submit" class="btn btn-danger ms-2">Update</button>
                </div>
            </div>
        </div>
    </form>
</template>
