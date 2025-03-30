<script setup>
import { ref } from 'vue'

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
        <nav class="main-header navbar navbar-expand bg-white navbar-light border-bottom" style="z-index: 10">
            <!-- Left navbar links -->
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" data-widget="pushmenu" href="#"><i class="fa fa-bars"></i></a>
                </li>
                <li class="nav-item">
                    <Link href="/" class="nav-link">Home</Link>
                </li>
                <li class="nav-item">
                    <Link :href="route('hymn.hymns.index', { language: 0, category: 0, sub_category: 0 })"
                        class="nav-link">
                    Hymns
                    </Link>
                </li>
            </ul>

            <!-- Right navbar links -->
            <ul v-if="$page.props.auth.user" class="navbar-nav ml-auto">
                <div class="btn-group dropstart">
                    <a class="me-4" data-bs-toggle="dropdown" href="#" data-bs-display="static" aria-expanded="false">
                        <img v-if="$page.props.auth.user.image"
                            :src="'/storage/user/image/' + $page.props.auth.user.image" class="rounded-circle"
                            height="30" alt="img" loading="lazy" />
                        <img v-else src="/storage/user/image/default.jpg" class="rounded-circle" height="30" alt="img"
                            loading="lazy" />
                    </a>
                    <ul class="dropdown-menu dropdown-menu-start dropdown-menu-lg-start">
                        <li>
                            <Link class="dropdown-item" :href="route('logout')" method="post">
                            Logout
                            </Link>
                        </li>
                    </ul>
                </div>
            </ul>
        </nav>
        <!-- /.navbar -->

        <!-- Main Sidebar Container -->
        <aside class="main-sidebar sidebar-light-primary elevation-3">

            <!-- Sidebar -->
            <div class="sidebar">
                <div class="user-panel mt-3 pb-3 mb-3 d-flex">
                    <div v-if="$page.props.auth.user.image" class="image">
                        <img :src="'/storage/user/image/' + $page.props.auth.user.image" class="img-circle elevation-2"
                            alt="">
                    </div>
                    <div v-else class="image">
                        <img src="/storage/user/image/default.jpg" class="img-circle elevation-2" alt="">
                    </div>
                    <div class="info">
                        <a href="#" class="d-block">{{ $page.props.auth.user.name }}</a>
                    </div>
                </div>

                <!-- Sidebar Menu -->
                <nav class="mt-2">
                    <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu"
                        data-accordion="false">
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.dashboard')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/admin/dashboard') }">
                            <i class="nav-icon fa-solid fa-gauge"></i>
                            <p>Dashboard</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.hymns.new')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/admin/hymns/new') }">
                            <i class="nav-icon fa-solid fa-microphone-lines"></i>
                            <p>New hymns</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.hymns.lyrics_suggestion')" class="nav-link"
                                :class="{ 'active': $page.url === '/admin/lyrics-suggestions' }">
                            <i class="nav-icon fa-solid fa-scroll"></i>
                            <p>Lyrics suggestions</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.hymns.index')" class="nav-link"
                                :class="{ 'active': $page.url === '/admin/hymns' }">
                            <i class="nav-icon fa-solid fa-microphone"></i>
                            <p>All hymns</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.languages.index')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/admin/languages') }">
                            <i class="nav-icon fa-solid fa-language"></i>
                            <p>Languages</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.categories.index')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/admin/categories') }">
                            <i class="nav-icon fa-solid fa-layer-group"></i>
                            <p>Categories</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.sub_categories.index')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/admin/sub-categories') }">
                            <i class="nav-icon fa-solid fa-object-group"></i>
                            <p>Sub categories</p>
                            </Link>
                        </li>
                        <li class="nav-item" @click="hideSidebar">
                            <Link :href="route('hymn.admin.approval_statuses.index')" class="nav-link"
                                :class="{ 'active': $page.url.startsWith('/admin/approval-statuses') }">
                            <i class="nav-icon fa-regular fa-square-check"></i>
                            <p>Approval status</p>
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
            <div class="container-fluid py-3">
                <div class="card p-3">
                    <slot />
                </div>
            </div>
        </div>
        <!-- /.content-wrapper -->

        <!-- Main Footer -->
        <footer class="main-footer">
            <!-- To the right -->
            <div class="float-right d-none d-sm-inline">

            </div>
            <!-- Default to the left -->
            <strong>Copyright &copy; {{ new Date().getFullYear() }} <a href="/">Christian
                    Hymns</a>.</strong> All
            rights
            reserved.
        </footer>
    </div>
</template>
