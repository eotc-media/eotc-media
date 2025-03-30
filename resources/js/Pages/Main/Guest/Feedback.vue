<script setup>
import { useForm } from '@inertiajs/vue3'
import InputError from '@/Components/General/InputError.vue'
import Req from '@/Components/General/RequiredIndicator.vue'

const form = useForm({
    name: '',
    email: '',
    phone: '',
    body: '',
})

const submit = () => {
    form.post(route('feedbacks.store'), {
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

    <Head title="Home" />

    <div class="container">
        <div class="row d-flex align-items-center">
            <form @submit.prevent="submit">
                <div class="col-md-10 offset-md-1">
                    <div class="my-2">
                        <h3>አስተያየት ይስጡን / Give us your feedback</h3>
                    </div>
                    <hr>
                    <div class="container-fluid form-group">
                        <label for="name">ስም / Name</label>
                        <div class="input-group mb-3">
                            <span class="input-group-text">
                                <i class="fa-solid fa-user"></i></span>
                            <input id="name" type="text" class="form-control" v-model="form.name" name="name"
                                placeholder="Name (Opt)" autocomplete="name">
                        </div>
                        <InputError :message="form.errors.name"></InputError>
                    </div>
                    <div class="container-fluid form-group">
                        <label for="email">ኢሜይል / Email</label>
                        <div class="input-group mb-3">
                            <span class="input-group-text">
                                <i class="fa-solid fa-at"></i></span>
                            <input id="email" type="text" class="form-control" v-model="form.email" name="email"
                                placeholder="Email (Opt)" autocomplete="email">
                        </div>
                        <InputError :message="form.errors.email"></InputError>
                    </div>
                    <div class="container-fluid form-group">
                        <label for="phone">ስልክ / Phone</label>
                        <div class="input-group mb-3">
                            <span class="input-group-text">
                                <i class="fa-solid fa-phone"></i></span>
                            <input id="phone" type="text" class="form-control" v-model="form.phone" phone="phone"
                                placeholder="Phone (Opt)" autocomplete="phone">
                        </div>
                        <InputError :message="form.errors.phone"></InputError>
                    </div>
                    <div class="container-fluid form-group">
                        <label for="body">አስተያየት / Feedback
                            <Req />
                        </label>
                        <div class="input-group mb-3">
                            <textarea id="body" class="form-control" v-model="form.body" name="body"
                                placeholder="Feedback" rows="10" required autocomplete="body"></textarea>
                        </div>
                        <InputError :message="form.errors.body"></InputError>
                    </div>
                    <div class="text-right pt-3 mb-3">
                        <button type="submit" class="btn btn-primary mr-2">Submit
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
a:hover .card {
    background-color: #ddf0fe;
}

h4 {
    font-size: 1.5rem;
    font-weight: 400;
}

hr {
    border-color: #888888;
}
</style>
