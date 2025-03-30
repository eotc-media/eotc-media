<script setup>
</script>
<script>
import UserLayout from '@/Layouts/Book/UserLayout.vue'
export default {
    layout: UserLayout
}
</script>

<template>
    <div class="row">
        <div class="col-md-6 offset-md-3">
            <div class="text-center my-5">
                <img v-if="$page.props.auth.user.image" :src="'/storage/user/image/' + $page.props.auth.user.image"
                    class="rounded" style="width: 25%" alt="">
                <img v-else src="/storage/user/image/default.jpg" class="rounded" style="width: 25%" alt="image">
            </div>
            <ul class="list-group list-group-unbordered">
                <li class="list-group-item">
                    Name <a class="float-right my-2">{{ $page.props.auth.user.name }}</a>
                </li>
                <li class="list-group-item my-2">
                    Email <a class="float-right">{{ $page.props.auth.user.email }}</a>
                </li>
            </ul>
            <div class="text-right my-5">
                <Link :href="route('book.user.profile.edit')" class="btn btn-outline-primary">Edit
                </Link>
            </div>
        </div>
    </div>
</template>