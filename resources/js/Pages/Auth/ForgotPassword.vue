<script setup>
import InputError from '@/Components/General/InputError.vue';
import { useForm } from '@inertiajs/vue3';
import ApplicationLogo from '@/Components/General/ApplicationLogo.vue'

defineProps({
    status: String,
});

const form = useForm({
    email: '',
});

const submit = () => {
    form.post(route('password.email'));
};
</script>
<script>
import GuestLayout from '@/Layouts/Main/GuestLayout.vue';
export default {
    layout: GuestLayout
}
</script>

<template>

    <Head title="Forgot Password" />

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
                                <p class="text-medium-emphasis">Forgot your password? No problem. Just let us know your
                                    email address and we will email you a password
                                    reset
                                    link that will allow you to choose a new one.</p>
                                <div v-if="status" class="text-white bg-green my-3 p-2 rounded">
                                    {{ status }}
                                </div>
                                <div class="input-group"><span class="input-group-text">
                                        <i class="fa-solid fa-at"></i></span>
                                    <input id="email" type="email" class="form-control" v-model="form.email"
                                        name="email" placeholder="Email" required autocomplete="username">
                                </div>
                                <small class="text-danger"> {{ form.errors.email }} </small>

                                <div class="flex items-center justify-end mt-4">
                                    <button type="submit" class="btn btn-primary"
                                        :class="{ 'opacity-25': form.processing }" :disabled="form.processing">
                                        Email Password Reset Link
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
