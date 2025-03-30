<script setup>
import { computed } from 'vue'
import { useForm } from '@inertiajs/vue3'

const props = defineProps({
    status: String,
});
const form = useForm({});
const submit = () => {
    form.post(route('verification.send'));
};
const verificationLinkSent = computed(() => props.status === 'verification-link-sent');
</script>
<script>
import GuestLayout from '@/Layouts/Main/GuestLayout.vue';
export default {
    layout: GuestLayout
}
</script>

<template>

    <Head title="Email Verification" />

    <div class="vh-100">
        <div class="row justify-content-center align-items-center mt-5">
            <div class="col-lg-6">
                <div class="card p-md-4 my-5 mx-2">
                    <div class="card-body">
                        <div>
                            Thanks for signing up! Before getting started, could you verify your email address by
                            clicking
                            on the link we just emailed to you? If you didn't receive the email, we will gladly send you
                            another.
                        </div>
                        <div class="text-white bg-green my-2 p-1 rounded" v-if="verificationLinkSent">
                            A new verification link has been sent to the email address you provided during registration.
                        </div>
                        <form @submit.prevent="submit" class="my-4">
                            <div class="row">
                                <div class="col-6">
                                    <button type="submit" class="btn btn-primary"
                                        :class="{ 'opacity-25': form.processing }" :disabled="form.processing">
                                        Resend Verification Email
                                    </button>
                                </div>
                                <div class="col-6 text-end">
                                    <Link :href="route('logout')" method="post" as="button"
                                        class="btn btn-outline-primary">
                                    Log Out</Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
