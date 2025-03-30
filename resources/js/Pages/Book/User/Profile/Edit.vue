<script setup>
import { useForm } from '@inertiajs/vue3'
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
    form.post(route('book.user.profile.update'), {
        onFinish: () => {
            form.reset()
        },
    })
}
</script>
<script>
import UserLayout from '@/Layouts/Book/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>
    <form @submit.prevent="submit">
        <div class="row">
            <div class="col-md-6 offset-md-3">
                <div class="text-center my-5">
                    <img id="imageview" v-if="$page.props.auth.user.image"
                        :src="'/storage/user/image/' + $page.props.auth.user.image" class="rounded" style="width: 25%"
                        alt="">
                    <img id="imageview" v-else src="/storage/user/image/default.jpg" class="rounded" style="width: 25%"
                        alt="image">
                    <div class="text-center m-3">
                        <input type="file" style="width: 100px" accept="image/*" @input="acceptImage" />
                        <progress v-if="form.progress" :value="form.progress.percentage" max="100">
                            {{ form.progress.percentage }}%
                        </progress>
                    </div>
                </div>
                <ul class="list-group list-group-unbordered">
                    <li class="list-group-item">
                        <div class="input-group">
                            Name
                            <input id="name" type="text" class="ml-5 form-control text-right" v-model="form.name"
                                name="name" placeholder="Name" required autocomplete="name">
                        </div>
                        <InputError :message="form.errors.name"></InputError>
                    </li>
                    <li class="list-group-item my-2">
                        Email <a class="float-right">{{ $page.props.auth.user.email }}</a>
                    </li>
                </ul>
                <div class="text-right my-5">
                    <Link :href="route('book.user.profile.show')" class="btn btn-outline-primary">Back
                    </Link>
                    <button type="submit" class="btn btn-danger ml-2">Update</button>
                </div>
            </div>
        </div>
    </form>
</template>