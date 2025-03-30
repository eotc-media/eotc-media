<script setup>
import InputError from '@/Components/General/InputError.vue';
import { useForm } from '@inertiajs/vue3';
import ApplicationLogo from '@/Components/General/ApplicationLogo.vue';

const props = defineProps({
    email: String,
    token: String,
});

const form = useForm({
    token: props.token,
    email: props.email,
    password: '',
    password_confirmation: '',
});

const submit = () => {
    form.post(route('password.store'), {
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

    <Head title="Reset Password" />

    <div class="vh-100">
        <div class="row mt-5 justify-content-center">
            <div class="col-lg-3 text-center my-4">
                <ApplicationLogo></ApplicationLogo>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col-lg-6">
                <div class="card-group">
                    <div class="card m-1 p-md-4">
                        <div class="card-body">
                            <form @submit.prevent="submit">

                                <h4>Reset Password</h4>
                                <p class="text-medium-emphasis">Reset your password</p>
                                <div v-if="status" class="text-white bg-green my-3 p-2 rounded">
                                    {{ status }}
                                </div>
                                <div class="input-group mt-3"><span class="input-group-text">
                                        <i class="fa-solid fa-at"></i></span>
                                    <input id="email" type="email" class="form-control" v-model="form.email"
                                        name="email" placeholder="Email" required autocomplete="username">
                                </div>
                                <small class="text-danger"> {{ form.errors.email }} </small>

                                <div class="input-group mt-3"><span class="input-group-text">
                                        <i class="fa-solid fa-key"></i></span>
                                    <input id="password" type="password" placeholder="New password" class="form-control"
                                        name="password" v-model="form.password" autocomplete="new-password" required>
                                </div>
                                <small class="text-danger"> {{ form.errors.password }} </small>

                                <div class="input-group my-3"><span class="input-group-text">
                                        <i class="fa-solid fa-key"></i></span>
                                    <input id="password_confirmation" type="password" placeholder="Confirm password"
                                        class="form-control" name="password_confirmation"
                                        v-model="form.password_confirmation" autocomplete="new-password" required>
                                </div>

                                <div class="flex items-center justify-end mt-4">
                                    <button type="submit" class="btn btn-primary"
                                        :class="{ 'opacity-25': form.processing }" :disabled="form.processing">
                                        Reset Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
