<script setup>
</script>
<template>
    <div class="py-3">
        <div class="card">
            <div class="card-header mb-3">
                <div class="row">
                    <slot name="title"></slot>
                </div>
            </div>
            <slot name="pages-top"></slot>
            <div class="card-body table-responsive pt-0 mt-0">
                <table class="table">
                    <thead class="thead-light">
                        <slot name="thead"></slot>
                    </thead>
                    <tbody>
                        <slot name="tbody"></slot>
                    </tbody>
                </table>
            </div>
            <slot name="pages-bottom"></slot>
        </div>
        <slot name="buttons"></slot>
        <slot name="other"></slot>
    </div>
</template>
