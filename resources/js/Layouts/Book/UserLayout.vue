<script setup>
import { ref } from 'vue'
import { usePage } from '@inertiajs/vue3'

const hideSidebar = () => {
    if (ref(window.innerWidth).value <= 768) {
        document.body.classList.add('sidebar-closed')
        document.body.classList.add('sidebar-collapse')
        document.body.classList.remove('sidebar-open')
    }
}
</script>

<template>
    <div class="wrapper">

        <!-- Navbar -->
        <nav class="main-header navbar navbar-expand bg-white navbar-light border-bottom">
            <!-- Left navbar links -->
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" data-widget="pushmenu" href="#"><i class="fa fa-bars"></i></a>
                </li>
                <li class="nav-item">
                    <Link :href="route('welcome')" class="nav-link">ዋና ገጽ</Link>
                </li>
                <li v-if="$page.props.auth.can.access_admin" class="nav-item">
                    <Link :href="route('book.admin.books.new')" class="nav-link">አድሚን</Link>
                </li>
                <li class="nav-item">
                    <Link :href="route('feedbacks.create')" class="nav-link">አስተያየት</Link>
                </li>
            </ul>

            <!-- Right navbar links -->
            <ul v-if="$page.props.auth.user" class="navbar-nav ml-auto">
                <div class="btn-group dropstart">
                    <a class="me-2" data-bs-toggle="dropdown" href="#" data-bs-display="static" aria-expanded="false">
                        <img v-if="$page.props.auth.user.image"
                            :src="'/storage/user/image/' + $page.props.auth.user.image" class="rounded-circle"
                            height="35" alt="img" loading="lazy" />
                        <img v-else src="/storage/user/image/default.jpg" class="rounded-circle" height="35" alt="img"
                            loading="lazy" />
                    </a>
                    <ul class="dropdown-menu dropdown-menu-start dropdown-menu-lg-start">
                        <li>
                            <a class="dropdown-item d-flex" target="_blank" href="/user/profile/show">
                                <img v-if="$page.props.auth.user.image"
                                    :src="'/storage/user/image/' + $page.props.auth.user.image" class="rounded-circle"
                                    height="45" alt="img" loading="lazy" />
                                <img v-else src="/storage/user/image/default.jpg" class="rounded-circle" height="45"
                                    alt="img" loading="lazy" />
                                <div class="ms-2">
                                    <div>{{ $page.props.auth.user.name }}</div>
                                    <small>{{ $page.props.auth.user.email }}</small>
                                </div>
                            </a>
                            <hr>
                        </li>
                        <li>
                            <Link class="dropdown-item" :href="route('logout')" method="post">
                            Logout
                            </Link>
                        </li>
                    </ul>
                </div>
            </ul>
            <Link v-else class="btn-solid-sm navbar-nav ml-auto" :href="route('login')">Sign in</Link>
        </nav>
        <!-- /.navbar -->

        <!-- Main Sidebar Container -->
        <aside class="main-sidebar sidebar-light-gray elevation-0">

            <!-- Sidebar -->
            <div class="sidebar">
                <div class="user-panel mt-3 pb-3 mb-3 d-flex">
                    <template v-if="$page.props.auth.user">
                        <div v-if="$page.props.auth.user.image" class="image">
                            <img :src="'/storage/user/image/' + $page.props.auth.user.image"
                                class="img-circle elevation-2" alt="">
                        </div>
                        <div v-else class="image">
                            <img src="/storage/user/image/default.jpg" class="img-circle elevation-2" alt="">
                        </div>
                        <div class="info">
                            <a href="#" class="d-block">{{ $page.props.auth.user.name }}</a>
                        </div>
                    </template>
                    <template v-else>
                        <div class="image">
                            <img src="/storage/user/image/default.jpg" class="img-circle elevation-2" alt="">
                        </div>
                        <div class="info">
                            <a href="#" class="d-block">Guest User</a>
                        </div>
                    </template>
                </div>

                <!-- Sidebar Menu -->
                <nav class="mt-2">
                    <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu"
                        data-accordion="false">
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('book.books.index', { language: 0, category: 0, sub_category: 0 })"
                                class="nav-link" :class="{ 'active': $page.url.startsWith('/book/books') }">
                            <i class="nav-icon fa-solid fa-book"></i>
                            <p>Books</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('book.user.books.index')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/book/user/book') }">
                            <i class="nav-icon fa-solid fa-upload"></i>
                            <p>Your uploads</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('book.user.dashboard')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/book/user/dashboard') }">
                            <i class="nav-icon fa-solid fa-gauge"></i>
                            <p>Dashboard</p>
                            </Link>
                        </li>
                    </ul>
                </nav>
                <!-- /.sidebar-menu -->
            </div>
            <!-- /.sidebar -->

        </aside>

        <!-- Content Wrapper. Contains page content -->
        <div class="content-wrapper">
            <div class="container-fluid">
                <slot />
            </div>
        </div>
        <!-- /.content-wrapper -->
    </div>
</template>

<style scoped>
hr {
    border-color: #666666;
}

.content-wrapper {
    background-color: #ffffff;
}

.btn-solid-sm {
    display: inline-block;
    padding: 1rem 1.5rem 1rem 1.5rem;
    border: 1px solid #0092ff;
    border-radius: 30px;
    background-color: #0092ff;
    color: #ffffff !important;
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 0;
    text-decoration: none;
    transition: all 0.2s;
    margin-top: 0.4rem;
}

.btn-solid-sm:hover {
    background-color: transparent;
    color: #0092ff;
    color: #000000 !important;
    text-decoration: none;
}
</style>
