<script setup>
defineProps(['title'])
</script>
<template>
    <div class="card">
        <div class="card-header">
            <div class="row">
                <div class="col-11">
                    <h4 class="font-weight-normal">{{ title }}</h4>
                </div>
                <div class="col-1 text-right">
                    <button type="button" class="btn btn-tool" data-card-widget="collapse">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="card-body table-responsive">
            <slot />
        </div>
    </div>
</template>
