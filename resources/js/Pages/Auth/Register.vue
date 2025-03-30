<script setup>
import { useForm } from '@inertiajs/vue3'
import InputError from '@/Components/General/InputError.vue'
import ApplicationLogo from '@/Components/General/ApplicationLogo.vue'

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms: false,
});

const submit = () => {
    form.post(route('register'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>
<script>
import GuestLayout from '@/Layouts/Main/GuestLayout.vue';
export default {
    layout: GuestLayout
}
</script>

<template>

    <Head title="Register" />

    <div class="vh-100">
        <div class="row mt-5 justify-content-center">
            <div class="col-lg-6 text-center">
                <ApplicationLogo></ApplicationLogo>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col-lg-6">
                <div class="card p-md-4 my-3 mx-2">
                    <div class="card-body">
                        <form @submit.prevent="submit">

                            <h3>Register</h3>
                            <p class="text-medium-emphasis">Create new account</p>

                            <div class="input-group"><span class="input-group-text">
                                    <i class="fa-solid fa-user"></i></span>
                                <input id="name" type="text" class="form-control" v-model="form.name" name="name"
                                    placeholder="Full name" required autocomplete="name">
                            </div>
                            <InputError :message="form.errors.name"></InputError>

                            <div class="input-group mt-4"><span class="input-group-text">
                                    <i class="fa-solid fa-at"></i></span>
                                <input id="email" type="email" class="form-control" v-model="form.email" name="email"
                                    placeholder="Email" required autocomplete="username">
                            </div>
                            <InputError :message="form.errors.email"></InputError>

                            <div class="input-group mt-4"><span class="input-group-text">
                                    <i class="fa-solid fa-key"></i></span>
                                <input id="password" type="password" placeholder="Password" class="form-control"
                                    name="password" v-model="form.password" autocomplete="new-password" required>
                            </div>
                            <InputError :message="form.errors.password"></InputError>

                            <div class="input-group my-4"><span class="input-group-text">
                                    <i class="fa-solid fa-key"></i></span>
                                <input id="password_confirmation" type="password" placeholder="Confirm password"
                                    class="form-control" name="password_confirmation"
                                    v-model="form.password_confirmation" autocomplete="new-password" required>
                            </div>

                            <div class="row">
                                <div class="col-6">
                                    <button class="btn btn-primary" :class="{ 'opacity-25': form.processing }"
                                        :disabled="form.processing">
                                        Register
                                    </button>
                                </div>
                                <div class="col-6 text-end">
                                    <Link :href="route('login')">
                                    Already registered?
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
