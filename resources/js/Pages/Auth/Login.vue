<script setup>
import BreezeCheckbox from '@/Components/General/Checkbox.vue';
import ApplicationLogo from '@/Components/General/ApplicationLogo.vue'
import { useForm } from '@inertiajs/vue3';

defineProps({
    canResetPassword: Boolean,
    status: String,
});

const form = useForm({
    email: '',
    password: '',
    remember: false
});

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
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

    <Head title="Log In" />

    <div class="vh-100">
        <div class="row mt-5 justify-content-center">
            <div class="col-lg-3 text-center my-4">
                <ApplicationLogo></ApplicationLogo>
                <hr>
                <div>
                    <Link :href="route('register')">Create new account if you are new</Link>
                </div>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col-lg-6">
                <div class="card-group">
                    <div class="card m-1 p-md-4">
                        <div class="card-body">
                            <form @submit.prevent="submit">

                                <h3>Login</h3>
                                <p class="text-medium-emphasis">Sign In to your account</p>
                                <div v-if="status" class="text-white bg-green my-3 p-2 rounded">
                                    {{ status }}
                                </div>
                                <div class="input-group"><span class="input-group-text">
                                        <i class="fa-solid fa-at"></i></span>
                                    <input id="email" type="email" class="form-control" v-model="form.email"
                                        name="email" placeholder="Email" required autocomplete="username">
                                </div>
                                <small class="text-danger"> {{ form.errors.email }} </small>


                                <div class="input-group mt-3"><span class="input-group-text">
                                        <i class="fa-solid fa-key"></i></span>
                                    <input id="password" type="password" placeholder="Password" class="form-control"
                                        name="password" v-model="form.password" autocomplete="current-password"
                                        required>
                                </div>
                                <small class="text-danger"> {{ form.errors.password }} </small>

                                <div class="form-group row mt-3">
                                    <label class="form-check font-weight-normal">
                                        <BreezeCheckbox name="remember" v-model:checked="form.remember" />
                                        <span class="ml-2 text-gray-600">Remember me</span>
                                    </label>
                                </div>

                                <div class="row">
                                    <div class="col-4">
                                        <button type="submit" class="btn btn-primary"
                                            :class="{ 'opacity-25': form.processing }" :disabled="form.processing">
                                            Log in
                                        </button>
                                    </div>
                                    <div class="col-8 text-end">
                                        <Link v-if="canResetPassword" :href="route('password.request')"
                                            class="btn btn-link">
                                        Change your password
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
hr {
    border-color: #222222;
    width: 50%;
    margin-left: auto;
    margin-right: auto;
}
</style>
