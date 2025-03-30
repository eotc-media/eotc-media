<script setup>
import Navbar from '@/Partials/Main/Navbar.vue'
import Footer from '@/Partials/Main/Footer.vue'
import SuccessMessage from '@/Components/General/SuccessMessage.vue'
import ErrorMessage from '@/Components/General/ErrorMessage.vue'
</script>

<template>
    <Navbar />
    <div class="min-h-screen flex flex-col sm:justify-center items-center py-3 sm:pt-0 bg-gray-100">

        <div class="w-full sm:max-w-md mt-5 py-4 bg-white shadow-md overflow-hidden sm:rounded-lg">
            <SuccessMessage />
            <ErrorMessage />
            <slot />
            <Footer></Footer>
        </div>
    </div>
</template>
