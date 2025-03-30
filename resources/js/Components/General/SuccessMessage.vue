<script setup>
</script>

<template>
    <div v-show="$page.props.flash.success">
        <p class="text-white bg-green p-3 mx-2 rounded">
            {{ $page.props.flash.success }}
        </p>
    </div>
</template>
