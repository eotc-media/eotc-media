<script setup>
</script>

<template>
    <nav id="navbarExample" class="navbar navbar-expand fixed-top navbar-light bg-white border-bottom border-grey"
        aria-label="Main navigation">
        <div class="container">
            <!-- For devices greater than or equal to 668px -->
            <div class="d-none d-md-flex col-md-10 offset-md-1">
                <Link class="navbar-brand logo-text" :href="route('welcome')">
                <div><img src="/image/icon.png" height="30" /> EOTC Media</div>
                </Link>

                <ul class="navbar-nav flex-row ms-auto">
                    <li class="nav-item mx-2">
                        <Link class="nav-link px-1" :href="route('bible.show_chapter', ['amharic', '1954', 1, 1])">መጽሃፍ
                        ቅዱስ
                        </Link>
                    </li>
                    <li class="nav-item mx-2">
                        <Link class="nav-link px-1" :href="route('book.books.index', [0, 0, 0])">መጻህፍት
                        </Link>
                    </li>
                    <li class="nav-item mx-2">
                        <Link class="nav-link px-1" :href="route('hymn.hymns.index', [0, 0, 0])">መዝሙራት
                        </Link>
                    </li>
                    <li class="nav-item ms-2 me-4">
                        <a class="nav-link px-1" href="#">
                            ትምህርቶች</a>
                    </li>
                    <template v-if="$page.props.auth.user">
                        <li class="nav-item dropdown">
                            <div class="btn-group dropstart">
                                <a data-bs-toggle="dropdown" href="#" data-bs-display="static" aria-expanded="false">
                                    <img v-if="$page.props.auth.user.image"
                                        :src="'/storage/user/image/' + $page.props.auth.user.image"
                                        class="rounded-circle" height="40" alt="img" loading="lazy" />
                                    <img v-else :src="'/storage/user/image/default.jpg'" class="rounded-circle"
                                        height="40" alt="img" loading="lazy" />
                                </a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <Link class="dropdown-item" :href="route('user.profile.show')">Profile</Link>
                                    </li>
                                    <li>
                                        <div class="dropdown-divider"></div>
                                    </li>
                                    <template v-if="$page.props.auth.can.access_main_admin">
                                        <li>
                                            <Link class="dropdown-item" :href="route('admin.dashboard')">Admin</Link>
                                        </li>
                                        <li>
                                            <div class="dropdown-divider"></div>
                                        </li>
                                    </template>
                                    <li>
                                        <Link class="dropdown-item" :href="route('logout')" method="post">Logout</Link>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </template>
                    <template v-else>
                        <li class="nav-item">
                            <Link class="btn-solid-sm" :href="route('login')"
                                :class="{ 'active': $page.url == '/login' }">Sign in</Link>
                        </li>
                    </template>
                </ul>
            </div>

            <!-- For devices smaller than 668px -->
            <div class="d-flex flex-column d-md-none col-md-10 offset-md-1">
                <div class="d-flex">
                    <Link class="navbar-brand logo-text" :href="route('welcome')">
                    <div>EOTC Media</div>
                    </Link>

                    <ul class="navbar-nav flex-row ms-auto">
                        <template v-if="$page.props.auth.user">
                            <li class="nav-item dropdown">
                                <div class="btn-group dropstart">
                                    <a data-bs-toggle="dropdown" href="#" data-bs-display="static"
                                        aria-expanded="false">
                                        <img v-if="$page.props.auth.user.image"
                                            :src="'/storage/user/image/' + $page.props.auth.user.image"
                                            class="rounded-circle" height="40" alt="img" loading="lazy" />
                                        <img v-else :src="'/storage/user/image/default.jpg'" class="rounded-circle"
                                            height="40" alt="img" loading="lazy" />
                                    </a>
                                    <ul class="dropdown-menu">
                                        <li>
                                            <Link class="dropdown-item" :href="route('user.profile.show')">Profile
                                            </Link>
                                        </li>
                                        <li>
                                            <div class="dropdown-divider"></div>
                                        </li>
                                        <template v-if="$page.props.auth.is_admin">
                                            <li>
                                                <Link class="dropdown-item" :href="route('admin.dashboard')">Admin
                                                </Link>
                                            </li>
                                            <li>
                                                <div class="dropdown-divider"></div>
                                            </li>
                                        </template>
                                        <li>
                                            <Link class="dropdown-item" :href="route('logout')" method="post">Logout
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        </template>
                        <template v-else>
                            <li class="nav-item">
                                <Link class="btn-solid-sm" :href="route('login')"
                                    :class="{ 'active': $page.url == '/login' }">Sign in</Link>
                            </li>
                        </template>
                    </ul>
                </div>

                <div class="d-flex">
                    <ul class="navbar-nav flex-row text-center">
                        <li class="nav-item">
                            <Link class="nav-link px-1" :href="route('bible.show_chapter', ['amharic', '1954', 1, 1])">
                            መጽሃፍ
                            ቅዱስ</Link>
                        </li>
                        <li class="nav-item">
                            <Link class="nav-link px-1" :href="route('book.books.index', [0, 0, 0])">መጻህፍት
                            </Link>
                        </li>
                        <li class="nav-item">
                            <Link class="nav-link px-2" :href="route('hymn.hymns.index', [0, 0, 0])">መዝሙራት
                            </Link>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link px-2" href="#">ትምህርቶች</a>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    </nav>
</template>

<style scoped>
.navbar .navbar-brand {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
}

.navbar .logo-image img {
    width: 126px;
    height: 32px;
}

.nav-link {
    padding-bottom: 0.2rem;
}

.nav-link.active {
    position: relative;
}

.nav-link.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 2px;
    background-color: #0c76ec;
}

.btn-solid-sm {
    display: inline-block;
    padding: 1rem 1.5rem 1rem 1.5rem;
    border: 1px solid #0092ff;
    border-radius: 30px;
    background-color: #0092ff;
    color: #ffffff;
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
    /* needs to stay here because of the color property of a tag */
    text-decoration: none;
}
</style>