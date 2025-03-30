<script setup>
</script>
<script>
import GuestLayout from '@/Layouts/Main/GuestLayout.vue'
export default {
    layout: GuestLayout
}
</script>

<template>

    <Head title="Profile" />

    <div class="row my-5">
        <div class="col-md-6 offset-md-3">
            <div class="text-center my-5">
                <img v-if="$page.props.auth.user.image" :src="'/storage/user/image/' + $page.props.auth.user.image"
                    class="rounded img-fluid" style="width: 25%" alt="User Image">
                <img v-else :src="'/storage/user/image/default.jpg'" class="rounded img-fluid" style="width: 25%"
                    alt="Default Image">
            </div>
            <ul class="list-group">
                <li class="list-group-item py-3">
                    Name <a class="float-end text-decoration-none">{{ $page.props.auth.user.name }}</a>
                </li>
                <li class="list-group-item py-3">
                    Email <a class="float-end text-decoration-none">{{ $page.props.auth.user.email }}</a>
                </li>
            </ul>
            <div class="text-end my-5">
                <Link :href="route('user.profile.edit')" class="btn btn-outline-primary">Edit</Link>
            </div>
        </div>
    </div>
</template>
